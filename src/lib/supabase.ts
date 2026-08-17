import { createClient, SupabaseClient } from "@supabase/supabase-js";
import type { UserProfile, Medication, MedicationLog, GlucoseLog, BPLog, WaterLog, WaterItem } from "../types";
import { APP_CONFIG } from "../config/app.config";
import { encryptPII } from "../utils/piiSecurity";

// Read Supabase environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "";
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || "";

export const isSupabaseConfigured = Boolean(
  supabaseUrl && 
  supabaseAnonKey && 
  supabaseUrl !== "YOUR_SUPABASE_URL" && 
  !supabaseUrl.includes("example.supabase.co")
);

// Initialize Supabase Client if configured
export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

// LOCAL STORAGE FALLBACK ENGINE
export const STORAGE_KEYS = {
  PROFILES: "vitalsguard_profiles_v1",
  MEDICATIONS: "vitalsguard_medications_v1",
  MED_LOGS: "vitalsguard_med_logs_v1",
  GLUCOSE_LOGS: "vitalsguard_glucose_logs_v1",
  BP_LOGS: "vitalsguard_bp_logs_v1",
  REPORTS: "vitalsguard_reports_v1",
  WATER_ITEMS: "vitalsguard_water_items_v1",
  WATER_LOGS: "vitalsguard_water_logs_v1",
};


// Helper to safely load from local storage or defaults
export function loadFromStorage<T>(key: string, defaultData: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) {
      localStorage.setItem(key, JSON.stringify(defaultData));
      return defaultData;
    }
    const parsed = JSON.parse(raw) as T;
    if (Array.isArray(parsed) && parsed.length === 0 && Array.isArray(defaultData) && defaultData.length > 0) {
      localStorage.setItem(key, JSON.stringify(defaultData));
      return defaultData;
    }
    return parsed;
  } catch (err) {
    console.warn(`[LocalStorage] Error reading ${key}:`, err);
    return defaultData;
  }
}

function saveToStorage<T>(key: string, data: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (err) {
    console.error(`[LocalStorage] Error writing ${key}:`, err);
  }
}

// Helper for profile lock persistence
const LOCKED_PROFILES_KEY = "vitalsguard_locked_profiles_map";

export function getLockedProfilesMap(): Record<string, boolean> {
  try {
    const raw = localStorage.getItem(LOCKED_PROFILES_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function saveLockedProfilesMap(map: Record<string, boolean>): void {
  try {
    localStorage.setItem(LOCKED_PROFILES_KEY, JSON.stringify(map));
  } catch (err) {
    console.warn("Error saving locked profiles map:", err);
  }
}

// Helper for profile PIN persistence
const PROFILE_PINS_KEY = "vitalsguard_profile_pins_map";

export function getProfilePinsMap(): Record<string, string> {
  try {
    const raw = localStorage.getItem(PROFILE_PINS_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function saveProfilePinsMap(map: Record<string, string>): void {
  try {
    localStorage.setItem(PROFILE_PINS_KEY, JSON.stringify(map));
  } catch (err) {
    console.warn("Error saving profile pins map:", err);
  }
}

// Helper for profile daily low stock email toggle persistence
const DAILY_EMAIL_KEY = "vitalsguard_daily_email_map";

export function getDailyLowStockEmailMap(): Record<string, boolean> {
  try {
    const raw = localStorage.getItem(DAILY_EMAIL_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function saveDailyLowStockEmailMap(map: Record<string, boolean>): void {
  try {
    localStorage.setItem(DAILY_EMAIL_KEY, JSON.stringify(map));
  } catch (err) {
    console.warn("Error saving daily email map:", err);
  }
}

// Helper for profile caretaker email persistence
const CARETAKER_EMAIL_MAP_KEY = "vitalsguard_caretaker_email_map";

export function getCaretakerEmailMap(): Record<string, string> {
  try {
    const raw = localStorage.getItem(CARETAKER_EMAIL_MAP_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function saveCaretakerEmailMap(map: Record<string, string>): void {
  try {
    localStorage.setItem(CARETAKER_EMAIL_MAP_KEY, JSON.stringify(map));
  } catch (err) {
    console.warn("Error saving caretaker email map:", err);
  }
}

// DATABASE ADAPTER IMPLEMENTATION

// --- PROFILES ---
export async function fetchProfiles(): Promise<UserProfile[]> {
  const lockedMap = getLockedProfilesMap();
  const pinsMap = getProfilePinsMap();
  const dailyEmailMap = getDailyLowStockEmailMap();
  const caretakerEmailMap = getCaretakerEmailMap();

  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase.from(APP_CONFIG.supabaseTables.profiles).select("*");
      if (error) throw error;
      if (data) {
        if (data.length > 0) {
          return data.map(item => {
            const hasRemoteLock = item.is_locked !== undefined && item.is_locked !== null;
            const isLockedVal = hasRemoteLock 
              ? Boolean(item.is_locked)
              : (item.isLocked !== undefined ? Boolean(item.isLocked) : Boolean(lockedMap[item.id]));

            const rawPin = item.pin || pinsMap[item.id] || "1234";
            const pinVal = encryptPII(rawPin);

            const hasRemoteDailyEmail = item.daily_low_stock_email_enabled !== undefined && item.daily_low_stock_email_enabled !== null;
            const dailyEmailVal = hasRemoteDailyEmail 
              ? Boolean(item.daily_low_stock_email_enabled)
              : (item.dailyLowStockEmailEnabled !== undefined ? Boolean(item.dailyLowStockEmailEnabled) : Boolean(dailyEmailMap[item.id]));

            const remoteCaretakerEmail = item.caretaker_email || item.caretakerEmail;
            const caretakerEmailVal = (remoteCaretakerEmail && remoteCaretakerEmail.trim() !== "")
              ? remoteCaretakerEmail
              : (caretakerEmailMap[item.id] || "");

            // If Supabase database column contains unencrypted cleartext PIN, automatically update database to encrypted PII ciphertext
            if (item.pin && !item.pin.startsWith("PII_ENC:")) {
              supabase.from(APP_CONFIG.supabaseTables.profiles).update({ pin: pinVal }).eq("id", item.id).then();
            }

            // Keep local maps synchronized
            lockedMap[item.id] = isLockedVal;
            saveLockedProfilesMap(lockedMap);
            pinsMap[item.id] = pinVal;
            saveProfilePinsMap(pinsMap);
            dailyEmailMap[item.id] = dailyEmailVal;
            saveDailyLowStockEmailMap(dailyEmailMap);
            if (caretakerEmailVal) {
              caretakerEmailMap[item.id] = caretakerEmailVal;
              saveCaretakerEmailMap(caretakerEmailMap);
            }

            return {
              id: item.id,
              name: item.name,
              role: item.role || "Parent",
              age: item.age,
              targetGlucoseFasting: item.target_glucose_fasting || item.targetGlucoseFasting,
              targetGlucosePostMeal: item.target_glucose_post_meal || item.targetGlucosePostMeal,
              targetBP: item.target_bp || item.targetBP,
              targetWater: item.target_water || item.targetWater || 2000,
              gender: item.gender || "Female",
              weight: item.weight || 60,
              season: item.season || "Spring/Autumn",
              emergencyContact: item.emergency_contact || item.emergencyContact,
              doctorName: item.doctor_name || item.doctorName,
              notes: item.notes,
              avatarColor: item.avatar_color || item.avatarColor || "#3b82f6",
              isLocked: isLockedVal,
              pin: pinVal,
              caretakerEmail: caretakerEmailVal,
              dailyLowStockEmailEnabled: dailyEmailVal
            };
          }) as UserProfile[];
        } else {
          console.log("Supabase profiles table is empty. Seeding defaults...");
          for (const p of APP_CONFIG.defaultProfiles) {
            await saveProfileDB(p as UserProfile);
          }
          return APP_CONFIG.defaultProfiles as UserProfile[];
        }
      }
    } catch (err) {
      console.warn("Supabase fetchProfiles fallback to LocalStorage:", err);
    }
  }

  const localProfiles = loadFromStorage<UserProfile[]>(STORAGE_KEYS.PROFILES, APP_CONFIG.defaultProfiles as UserProfile[]);
  return localProfiles.map(p => ({
    ...p,
    isLocked: p.isLocked !== undefined ? p.isLocked : Boolean(lockedMap[p.id]),
    pin: p.pin || pinsMap[p.id] || "1234",
    caretakerEmail: p.caretakerEmail || caretakerEmailMap[p.id] || "",
    dailyLowStockEmailEnabled: p.dailyLowStockEmailEnabled !== undefined ? p.dailyLowStockEmailEnabled : Boolean(dailyEmailMap[p.id])
  }));
}

export async function saveProfileDB(profile: UserProfile): Promise<UserProfile> {
  // Update local lock, pin, daily email, and caretaker email maps
  const lockedMap = getLockedProfilesMap();
  lockedMap[profile.id] = Boolean(profile.isLocked);
  saveLockedProfilesMap(lockedMap);

  const pinsMap = getProfilePinsMap();
  const rawPin = profile.pin || pinsMap[profile.id] || "1234";
  const encryptedPin = encryptPII(rawPin);
  pinsMap[profile.id] = encryptedPin;
  saveProfilePinsMap(pinsMap);

  const dailyEmailMap = getDailyLowStockEmailMap();
  if (profile.dailyLowStockEmailEnabled !== undefined) {
    dailyEmailMap[profile.id] = Boolean(profile.dailyLowStockEmailEnabled);
    saveDailyLowStockEmailMap(dailyEmailMap);
  }

  const caretakerEmailMap = getCaretakerEmailMap();
  if (profile.caretakerEmail) {
    caretakerEmailMap[profile.id] = profile.caretakerEmail;
    saveCaretakerEmailMap(caretakerEmailMap);
  }

  const fullProfile: UserProfile = {
    ...profile,
    pin: encryptedPin,
    isLocked: Boolean(profile.isLocked)
  };

  if (isSupabaseConfigured && supabase) {
    try {
      const payload: any = {
        id: fullProfile.id,
        name: fullProfile.name,
        role: fullProfile.role || "Member",
        age: fullProfile.age,
        target_glucose_fasting: fullProfile.targetGlucoseFasting,
        target_glucose_post_meal: fullProfile.targetGlucosePostMeal,
        target_bp: fullProfile.targetBP,
        target_water: fullProfile.targetWater || 2000,
        emergency_contact: fullProfile.emergencyContact,
        doctor_name: fullProfile.doctorName,
        notes: fullProfile.notes,
        avatar_color: fullProfile.avatarColor || "#3b82f6",
        is_locked: fullProfile.isLocked,
        pin: fullProfile.pin
      };
      if (fullProfile.gender) payload.gender = fullProfile.gender;
      if (fullProfile.weight) payload.weight = fullProfile.weight;
      if (fullProfile.season) payload.season = fullProfile.season;
      if (fullProfile.caretakerEmail) payload.caretaker_email = fullProfile.caretakerEmail;
      if (fullProfile.dailyLowStockEmailEnabled !== undefined) payload.daily_low_stock_email_enabled = fullProfile.dailyLowStockEmailEnabled;

      const { error } = await supabase.from(APP_CONFIG.supabaseTables.profiles).upsert(payload);
      if (error) {
        // Resilient fallback retry keeping security fields
        const corePayload = {
          id: fullProfile.id,
          name: fullProfile.name,
          role: fullProfile.role || "Member",
          age: fullProfile.age,
          target_glucose_fasting: fullProfile.targetGlucoseFasting,
          target_glucose_post_meal: fullProfile.targetGlucosePostMeal,
          target_bp: fullProfile.targetBP,
          target_water: fullProfile.targetWater || 2000,
          emergency_contact: fullProfile.emergencyContact,
          doctor_name: fullProfile.doctorName,
          notes: fullProfile.notes,
          avatar_color: fullProfile.avatarColor || "#3b82f6",
          is_locked: fullProfile.isLocked,
          pin: fullProfile.pin
        };
        const { error: retryErr } = await supabase.from(APP_CONFIG.supabaseTables.profiles).upsert(corePayload);
        if (retryErr) console.warn("Supabase corePayload upsert retry failed:", retryErr);
      }
    } catch (err) {
      console.warn("Supabase saveProfile fallback to LocalStorage:", err);
    }
  }
  const current = loadFromStorage<UserProfile[]>(STORAGE_KEYS.PROFILES, APP_CONFIG.defaultProfiles as UserProfile[]);
  const index = current.findIndex(p => p.id === fullProfile.id);
  if (index >= 0) current[index] = fullProfile;
  else current.push(fullProfile);
  saveToStorage(STORAGE_KEYS.PROFILES, current);
  return fullProfile;
}

export async function deleteProfileDB(id: string): Promise<boolean> {
  if (isSupabaseConfigured && supabase) {
    try {
      // 1. Delete dependent BP Logs
      const { error: bpError } = await supabase.from(APP_CONFIG.supabaseTables.bpLogs).delete().eq("profile_id", id);
      if (bpError) throw bpError;

      // 2. Delete dependent Glucose Logs
      const { error: glucoseError } = await supabase.from(APP_CONFIG.supabaseTables.glucoseLogs).delete().eq("profile_id", id);
      if (glucoseError) throw glucoseError;

      // 3. Delete dependent Medication Logs
      const { error: logsError } = await supabase.from(APP_CONFIG.supabaseTables.medicationLogs).delete().eq("profile_id", id);
      if (logsError) throw logsError;

      // 4. Delete dependent Medications
      const { error: medsError } = await supabase.from(APP_CONFIG.supabaseTables.medications).delete().eq("profile_id", id);
      if (medsError) throw medsError;

      // 5. Delete dependent Water Logs (try-catch, in case table doesn't exist)
      try {
        await supabase.from("water_logs").delete().eq("profile_id", id);
      } catch (waterErr) {
        console.warn("Could not delete water logs from Supabase:", waterErr);
      }

      // 6. Delete Profile
      const { error } = await supabase.from(APP_CONFIG.supabaseTables.profiles).delete().eq("id", id);
      if (error) throw error;
    } catch (err) {
      console.error("Supabase deleteProfile error:", err);
      throw err;
    }
  }
  
  // Clean up profiles local storage
  const current = loadFromStorage<UserProfile[]>(STORAGE_KEYS.PROFILES, []);
  saveToStorage(STORAGE_KEYS.PROFILES, current.filter(p => p.id !== id));

  // Clean up medications local storage
  const meds = loadFromStorage<Medication[]>(STORAGE_KEYS.MEDICATIONS, []);
  saveToStorage(STORAGE_KEYS.MEDICATIONS, meds.filter(m => m.profileId !== id));

  // Clean up medication logs local storage
  const logs = loadFromStorage<MedicationLog[]>(STORAGE_KEYS.MED_LOGS, []);
  saveToStorage(STORAGE_KEYS.MED_LOGS, logs.filter(l => l.profileId !== id));

  // Clean up glucose logs local storage
  const gluc = loadFromStorage<GlucoseLog[]>(STORAGE_KEYS.GLUCOSE_LOGS, []);
  saveToStorage(STORAGE_KEYS.GLUCOSE_LOGS, gluc.filter(g => g.profileId !== id));

  // Clean up bp logs local storage
  const bp = loadFromStorage<BPLog[]>(STORAGE_KEYS.BP_LOGS, []);
  saveToStorage(STORAGE_KEYS.BP_LOGS, bp.filter(b => b.profileId !== id));

  // Clean up water logs local storage
  const water = loadFromStorage<WaterLog[]>(STORAGE_KEYS.WATER_LOGS, []);
  saveToStorage(STORAGE_KEYS.WATER_LOGS, water.filter(w => w.profileId !== id));

  return true;
}

// --- MEDICATIONS ---
function decodeMedication(item: any): Medication {
  let frequency = item.frequency || "";
  let scheduleType = item.schedule_type || item.scheduleType;
  let daysOfWeek = item.days_of_week || item.daysOfWeek;
  let durationBasis = item.duration_basis || item.durationBasis;
  let trackingEnabled = item.tracking_enabled ?? item.trackingEnabled;

  if (frequency.includes("|__METADATA__")) {
    const parts = frequency.split("|__METADATA__");
    frequency = parts[0];
    try {
      const meta = JSON.parse(parts[1]);
      if (meta.scheduleType !== undefined) scheduleType = meta.scheduleType;
      if (meta.daysOfWeek !== undefined) daysOfWeek = meta.daysOfWeek;
      if (meta.durationBasis !== undefined) durationBasis = meta.durationBasis;
      if (meta.trackingEnabled !== undefined) trackingEnabled = meta.trackingEnabled;
    } catch (e) {
      console.error("Error parsing medication metadata:", e);
    }
  }

  return {
    id: item.id,
    profileId: item.profile_id || item.profileId,
    name: item.name,
    dosage: item.dosage,
    frequency,
    scheduleType: scheduleType || "daily",
    daysOfWeek: daysOfWeek || ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
    durationBasis: durationBasis || "forever",
    times: item.times || [],
    stockCount: item.stock_count ?? item.stockCount ?? 0,
    minStockAlert: item.min_stock_alert ?? item.minStockAlert ?? 5,
    instructions: item.instructions || "",
    foodRelation: item.food_relation || item.foodRelation || "After Food",
    active: item.active ?? true,
    trackingEnabled: trackingEnabled ?? true,
    created_at: item.created_at
  };
}

export async function fetchMedications(profileId?: string): Promise<Medication[]> {
  if (isSupabaseConfigured && supabase) {
    try {
      let query = supabase.from(APP_CONFIG.supabaseTables.medications).select("*");
      if (profileId) query = query.eq("profile_id", profileId);
      const { data, error } = await query;
      if (error) throw error;
      if (data) {
        if (data.length > 0) {
          return data.map(decodeMedication);
        } else if (!profileId) {
          console.log("Supabase medications table is empty. Seeding defaults...");
          for (const m of APP_CONFIG.defaultMedications) {
            await saveMedicationDB(m as Medication);
          }
          return APP_CONFIG.defaultMedications.map(decodeMedication) as Medication[];
        }
      }
    } catch (err) {
      console.warn("Supabase fetchMedications fallback:", err);
    }
  }
  const meds = loadFromStorage<Medication[]>(STORAGE_KEYS.MEDICATIONS, APP_CONFIG.defaultMedications as Medication[]);
  const decodedMeds = meds.map(decodeMedication);
  if (profileId) return decodedMeds.filter(m => m.profileId === profileId);
  return decodedMeds;
}

export async function saveMedicationDB(med: Medication): Promise<Medication> {
  if (isSupabaseConfigured && supabase) {
    try {
      const metadata = {
        scheduleType: med.scheduleType,
        daysOfWeek: med.daysOfWeek,
        durationBasis: med.durationBasis,
        trackingEnabled: med.trackingEnabled
      };
      const encodedFrequency = `${med.frequency}|__METADATA__${JSON.stringify(metadata)}`;

      const payload = {
        id: med.id,
        profile_id: med.profileId,
        name: med.name,
        dosage: med.dosage,
        frequency: encodedFrequency,
        times: med.times,
        stock_count: med.stockCount,
        min_stock_alert: med.minStockAlert,
        instructions: med.instructions,
        food_relation: med.foodRelation,
        active: med.active
      };
      const { error } = await supabase.from(APP_CONFIG.supabaseTables.medications).upsert(payload);
      if (error) throw error;
    } catch (err) {
      console.warn("Supabase saveMedication fallback:", err);
    }
  }
  const meds = loadFromStorage<Medication[]>(STORAGE_KEYS.MEDICATIONS, APP_CONFIG.defaultMedications as Medication[]);
  const index = meds.findIndex(m => m.id === med.id);
  if (index >= 0) meds[index] = med;
  else meds.push(med);
  saveToStorage(STORAGE_KEYS.MEDICATIONS, meds);
  return med;
}

export async function deleteMedicationDB(id: string): Promise<boolean> {
  if (isSupabaseConfigured && supabase) {
    try {
      // 1. Delete dependent medication logs first
      const { error: logsError } = await supabase.from(APP_CONFIG.supabaseTables.medicationLogs).delete().eq("medication_id", id);
      if (logsError) throw logsError;

      // 2. Delete medication
      const { error } = await supabase.from(APP_CONFIG.supabaseTables.medications).delete().eq("id", id);
      if (error) throw error;
    } catch (err) {
      console.error("Supabase deleteMedication error:", err);
      throw err;
    }
  }

  // Clean up medications local storage
  const meds = loadFromStorage<Medication[]>(STORAGE_KEYS.MEDICATIONS, []);
  saveToStorage(STORAGE_KEYS.MEDICATIONS, meds.filter(m => m.id !== id));

  // Clean up medication logs local storage
  const logs = loadFromStorage<MedicationLog[]>(STORAGE_KEYS.MED_LOGS, []);
  saveToStorage(STORAGE_KEYS.MED_LOGS, logs.filter(l => l.medicationId !== id));

  return true;
}

export async function deleteMedicationLogDB(logId: string): Promise<boolean> {
  if (isSupabaseConfigured && supabase) {
    try {
      const { error } = await supabase.from(APP_CONFIG.supabaseTables.medicationLogs).delete().eq("id", logId);
      if (error) throw error;
    } catch (err) {
      console.error("Supabase deleteMedicationLog error:", err);
      throw err;
    }
  }
  const logs = loadFromStorage<MedicationLog[]>(STORAGE_KEYS.MED_LOGS, []);
  saveToStorage(STORAGE_KEYS.MED_LOGS, logs.filter(l => l.id !== logId));
  return true;
}

// --- MEDICATION ADHERENCE LOGS & STOCK AUTO-SUBTRACT WITH CUSTOM TIMESTAMPS ---
export async function logAdherenceDB(
  medicationId: string,
  profileId: string,
  status: "taken" | "missed" | "skipped",
  quantityTaken: number = 1,
  customTimestamp?: string
): Promise<{ log: MedicationLog; updatedMed?: Medication }> {
  const newLog: MedicationLog = {
    id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
    medicationId,
    profileId,
    timestamp: customTimestamp || new Date().toISOString(),
    status,
    quantityTaken
  };

  // Fetch current meds to adjust stock
  const allMeds = await fetchMedications();
  const targetMed = allMeds.find(m => m.id === medicationId);
  let updatedMed: Medication | undefined = undefined;

  if (targetMed && status === "taken" && APP_CONFIG.inventorySettings.autoSubtractOnTaken) {
    const newStock = Math.max(0, targetMed.stockCount - quantityTaken);
    updatedMed = { ...targetMed, stockCount: newStock };
    await saveMedicationDB(updatedMed);
  }

  if (isSupabaseConfigured && supabase) {
    try {
      const { error } = await supabase.from(APP_CONFIG.supabaseTables.medicationLogs).insert({
        id: newLog.id,
        medication_id: newLog.medicationId,
        profile_id: newLog.profileId,
        timestamp: newLog.timestamp,
        status: newLog.status,
        quantity_taken: newLog.quantityTaken
      });
      if (error) throw error;
    } catch (err) {
      console.warn("Supabase logAdherence fallback:", err);
    }
  }

  const logs = loadFromStorage<MedicationLog[]>(STORAGE_KEYS.MED_LOGS, []);
  logs.unshift(newLog);
  saveToStorage(STORAGE_KEYS.MED_LOGS, logs);

  return { log: newLog, updatedMed };
}

export async function fetchMedicationLogs(profileId?: string): Promise<MedicationLog[]> {
  if (isSupabaseConfigured && supabase) {
    try {
      let query = supabase.from(APP_CONFIG.supabaseTables.medicationLogs).select("*").order("timestamp", { ascending: false });
      if (profileId) query = query.eq("profile_id", profileId);
      const { data, error } = await query;
      if (error) throw error;
      if (data) {
        return data.map(d => ({
          id: d.id,
          medicationId: d.medication_id || d.medicationId,
          profileId: d.profile_id || d.profileId,
          timestamp: d.timestamp,
          status: d.status,
          quantityTaken: d.quantity_taken || d.quantityTaken || 1,
          notes: d.notes
        })) as MedicationLog[];
      }
    } catch (err) {
      console.warn("Supabase fetchMedicationLogs fallback:", err);
    }
  }
  const logs = loadFromStorage<MedicationLog[]>(STORAGE_KEYS.MED_LOGS, []);
  if (profileId) return logs.filter(l => l.profileId === profileId);
  return logs;
}

// --- GLUCOSE LOGS ---
export async function fetchGlucoseLogs(profileId?: string): Promise<GlucoseLog[]> {
  if (isSupabaseConfigured && supabase) {
    try {
      let query = supabase.from(APP_CONFIG.supabaseTables.glucoseLogs).select("*").order("timestamp", { ascending: false });
      if (profileId) query = query.eq("profile_id", profileId);
      const { data, error } = await query;
      if (error) throw error;
      if (data) {
        return data.map(d => ({
          id: d.id,
          profileId: d.profile_id || d.profileId,
          value: d.value,
          mealType: d.meal_type || d.mealType,
          timestamp: d.timestamp,
          status: d.status,
          notes: d.notes
        })) as GlucoseLog[];
      }
    } catch (err) {
      console.warn("Supabase fetchGlucoseLogs fallback:", err);
    }
  }
  const logs = loadFromStorage<GlucoseLog[]>(STORAGE_KEYS.GLUCOSE_LOGS, []);
  if (profileId) return logs.filter(l => l.profileId === profileId);
  return logs;
}

export async function saveGlucoseLogDB(log: GlucoseLog): Promise<GlucoseLog> {
  if (isSupabaseConfigured && supabase) {
    try {
      const { error } = await supabase.from(APP_CONFIG.supabaseTables.glucoseLogs).insert({
        id: log.id,
        profile_id: log.profileId,
        value: log.value,
        meal_type: log.mealType,
        timestamp: log.timestamp,
        status: log.status,
        notes: log.notes
      });
      if (error) throw error;
    } catch (err) {
      console.warn("Supabase saveGlucoseLog fallback:", err);
    }
  }
  const logs = loadFromStorage<GlucoseLog[]>(STORAGE_KEYS.GLUCOSE_LOGS, []);
  logs.unshift(log);
  saveToStorage(STORAGE_KEYS.GLUCOSE_LOGS, logs);
  return log;
}

export async function deleteGlucoseLogDB(id: string): Promise<boolean> {
  if (isSupabaseConfigured && supabase) {
    try {
      const { error } = await supabase.from(APP_CONFIG.supabaseTables.glucoseLogs).delete().eq("id", id);
      if (error) throw error;
    } catch (err) {
      console.warn("Supabase deleteGlucoseLog error:", err);
    }
  }
  const logs = loadFromStorage<GlucoseLog[]>(STORAGE_KEYS.GLUCOSE_LOGS, []);
  saveToStorage(STORAGE_KEYS.GLUCOSE_LOGS, logs.filter(l => l.id !== id));
  return true;
}

// --- BLOOD PRESSURE LOGS ---
export async function fetchBPLogs(profileId?: string): Promise<BPLog[]> {
  if (isSupabaseConfigured && supabase) {
    try {
      let query = supabase.from(APP_CONFIG.supabaseTables.bpLogs).select("*").order("timestamp", { ascending: false });
      if (profileId) query = query.eq("profile_id", profileId);
      const { data, error } = await query;
      if (error) throw error;
      if (data) {
        return data.map(d => ({
          id: d.id,
          profileId: d.profile_id || d.profileId,
          systolic: d.systolic,
          diastolic: d.diastolic,
          pulse: d.pulse,
          category: d.category,
          timestamp: d.timestamp,
          notes: d.notes
        })) as BPLog[];
      }
    } catch (err) {
      console.warn("Supabase fetchBPLogs fallback:", err);
    }
  }
  const logs = loadFromStorage<BPLog[]>(STORAGE_KEYS.BP_LOGS, []);
  if (profileId) return logs.filter(l => l.profileId === profileId);
  return logs;
}

export async function saveBPLogDB(log: BPLog): Promise<BPLog> {
  if (isSupabaseConfigured && supabase) {
    try {
      const { error } = await supabase.from(APP_CONFIG.supabaseTables.bpLogs).insert({
        id: log.id,
        profile_id: log.profileId,
        systolic: log.systolic,
        diastolic: log.diastolic,
        pulse: log.pulse,
        category: log.category,
        timestamp: log.timestamp,
        notes: log.notes
      });
      if (error) throw error;
    } catch (err) {
      console.warn("Supabase saveBPLog fallback:", err);
    }
  }
  const logs = loadFromStorage<BPLog[]>(STORAGE_KEYS.BP_LOGS, []);
  logs.unshift(log);
  saveToStorage(STORAGE_KEYS.BP_LOGS, logs);
  return log;
}

export async function deleteBPLogDB(id: string): Promise<boolean> {
  if (isSupabaseConfigured && supabase) {
    try {
      const { error } = await supabase.from(APP_CONFIG.supabaseTables.bpLogs).delete().eq("id", id);
      if (error) throw error;
    } catch (err) {
      console.warn("Supabase deleteBPLog error:", err);
    }
  }
  const logs = loadFromStorage<BPLog[]>(STORAGE_KEYS.BP_LOGS, []);
  saveToStorage(STORAGE_KEYS.BP_LOGS, logs.filter(l => l.id !== id));
  return true;
}

// --- WATER CONTAINERS & ITEMS ---
export async function fetchWaterItems(profileId?: string): Promise<WaterItem[]> {
  if (isSupabaseConfigured && supabase) {
    try {
      let query = supabase.from("water_items").select("*").order("created_at", { ascending: true });
      if (profileId) query = query.eq("profile_id", profileId);
      const { data, error } = await query;
      if (error) throw error;
      if (data) {
        return data.map(d => ({
          id: d.id,
          profileId: d.profile_id || d.profileId,
          name: d.name,
          amount: d.amount,
          times: d.times,
          active: d.active !== false,
          created_at: d.created_at
        })) as WaterItem[];
      }
    } catch (err) {
      console.warn("Supabase fetchWaterItems fallback to LocalStorage:", err);
    }
  }
  const items = loadFromStorage<WaterItem[]>(STORAGE_KEYS.WATER_ITEMS, []);
  if (profileId) return items.filter(i => i.profileId === profileId);
  return items;
}

export async function saveWaterItemDB(item: WaterItem): Promise<WaterItem> {
  if (isSupabaseConfigured && supabase) {
    try {
      const { error } = await supabase.from("water_items").upsert({
        id: item.id,
        profile_id: item.profileId,
        name: item.name,
        amount: item.amount,
        times: item.times || ['08:00'],
        active: item.active !== false
      });
      if (error) throw error;
    } catch (err) {
      console.warn("Supabase saveWaterItem fallback to LocalStorage:", err);
    }
  }
  const items = loadFromStorage<WaterItem[]>(STORAGE_KEYS.WATER_ITEMS, []);
  const idx = items.findIndex(i => i.id === item.id);
  if (idx >= 0) {
    items[idx] = item;
  } else {
    items.push(item);
  }
  saveToStorage(STORAGE_KEYS.WATER_ITEMS, items);
  return item;
}

export async function deleteWaterItemDB(id: string): Promise<boolean> {
  if (isSupabaseConfigured && supabase) {
    try {
      const { error } = await supabase.from("water_items").delete().eq("id", id);
      if (error) throw error;
    } catch (err) {
      console.warn("Supabase deleteWaterItem error:", err);
    }
  }
  const items = loadFromStorage<WaterItem[]>(STORAGE_KEYS.WATER_ITEMS, []);
  saveToStorage(STORAGE_KEYS.WATER_ITEMS, items.filter(i => i.id !== id));
  return true;
}

// --- WATER INTAKE LOGS ---
export async function fetchWaterLogs(profileId?: string): Promise<WaterLog[]> {
  if (isSupabaseConfigured && supabase) {
    try {
      let query = supabase.from("water_logs").select("*").order("timestamp", { ascending: false });
      if (profileId) query = query.eq("profile_id", profileId);
      const { data, error } = await query;
      if (error) throw error;
      if (data) {
        return data.map(d => ({
          id: d.id,
          profileId: d.profile_id || d.profileId,
          waterId: d.water_id || d.waterId,
          amount: d.amount,
          timestamp: d.timestamp,
          notes: d.notes
        })) as WaterLog[];
      }
    } catch (err) {
      console.warn("Supabase fetchWaterLogs fallback to LocalStorage:", err);
    }
  }
  const logs = loadFromStorage<WaterLog[]>(STORAGE_KEYS.WATER_LOGS, []);
  if (profileId) return logs.filter(l => l.profileId === profileId);
  return logs;
}

export async function saveWaterLogDB(log: WaterLog): Promise<WaterLog> {
  if (isSupabaseConfigured && supabase) {
    try {
      const { error } = await supabase.from("water_logs").insert({
        id: log.id,
        profile_id: log.profileId,
        water_id: log.waterId || null,
        amount: log.amount,
        timestamp: log.timestamp,
        notes: log.notes
      });
      if (error) throw error;
    } catch (err) {
      console.warn("Supabase saveWaterLog fallback to LocalStorage:", err);
    }
  }
  const logs = loadFromStorage<WaterLog[]>(STORAGE_KEYS.WATER_LOGS, []);
  logs.unshift(log);
  saveToStorage(STORAGE_KEYS.WATER_LOGS, logs);
  return log;
}

export async function deleteWaterLogDB(id: string): Promise<boolean> {
  if (isSupabaseConfigured && supabase) {
    try {
      const { error } = await supabase.from("water_logs").delete().eq("id", id);
      if (error) throw error;
    } catch (err) {
      console.warn("Supabase deleteWaterLog error:", err);
    }
  }
  const logs = loadFromStorage<WaterLog[]>(STORAGE_KEYS.WATER_LOGS, []);
  saveToStorage(STORAGE_KEYS.WATER_LOGS, logs.filter(l => l.id !== id));
  return true;
}


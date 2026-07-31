import { createClient, SupabaseClient } from "@supabase/supabase-js";
import type { UserProfile, Medication, MedicationLog, GlucoseLog, BPLog } from "../types";
import { APP_CONFIG } from "../config/app.config";

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
const STORAGE_KEYS = {
  PROFILES: "vitalsguard_profiles_v1",
  MEDICATIONS: "vitalsguard_medications_v1",
  MED_LOGS: "vitalsguard_med_logs_v1",
  GLUCOSE_LOGS: "vitalsguard_glucose_logs_v1",
  BP_LOGS: "vitalsguard_bp_logs_v1",
  REPORTS: "vitalsguard_reports_v1",
};

// Helper to safely load from local storage or defaults
function loadFromStorage<T>(key: string, defaultData: T): T {
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

// DATABASE ADAPTER IMPLEMENTATION

// --- PROFILES ---
export async function fetchProfiles(): Promise<UserProfile[]> {
  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase.from(APP_CONFIG.supabaseTables.profiles).select("*");
      if (!error && data) {
        if (data.length > 0) {
          return data.map(item => ({
            id: item.id,
            name: item.name,
            role: item.role || "Parent",
            age: item.age,
            targetGlucoseFasting: item.target_glucose_fasting || item.targetGlucoseFasting,
            targetGlucosePostMeal: item.target_glucose_post_meal || item.targetGlucosePostMeal,
            targetBP: item.target_bp || item.targetBP,
            emergencyContact: item.emergency_contact || item.emergencyContact,
            doctorName: item.doctor_name || item.doctorName,
            notes: item.notes,
            avatarColor: item.avatar_color || item.avatarColor || "#3b82f6"
          })) as UserProfile[];
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
  return loadFromStorage<UserProfile[]>(STORAGE_KEYS.PROFILES, APP_CONFIG.defaultProfiles as UserProfile[]);
}

export async function saveProfileDB(profile: UserProfile): Promise<UserProfile> {
  if (isSupabaseConfigured && supabase) {
    try {
      const payload = {
        id: profile.id,
        name: profile.name,
        role: profile.role,
        age: profile.age,
        target_glucose_fasting: profile.targetGlucoseFasting,
        target_glucose_post_meal: profile.targetGlucosePostMeal,
        target_bp: profile.targetBP,
        emergency_contact: profile.emergencyContact,
        doctor_name: profile.doctorName,
        notes: profile.notes,
        avatar_color: profile.avatarColor
      };
      await supabase.from(APP_CONFIG.supabaseTables.profiles).upsert(payload);
    } catch (err) {
      console.warn("Supabase saveProfile fallback to LocalStorage:", err);
    }
  }
  const current = loadFromStorage<UserProfile[]>(STORAGE_KEYS.PROFILES, APP_CONFIG.defaultProfiles as UserProfile[]);
  const index = current.findIndex(p => p.id === profile.id);
  if (index >= 0) current[index] = profile;
  else current.push(profile);
  saveToStorage(STORAGE_KEYS.PROFILES, current);
  return profile;
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

      // 5. Delete Profile
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
      if (!error && data) {
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
      await supabase.from(APP_CONFIG.supabaseTables.medications).upsert(payload);
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
      await supabase.from(APP_CONFIG.supabaseTables.medicationLogs).insert({
        id: newLog.id,
        medication_id: newLog.medicationId,
        profile_id: newLog.profileId,
        timestamp: newLog.timestamp,
        status: newLog.status,
        quantity_taken: newLog.quantityTaken
      });
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
      if (!error && data) {
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
      if (!error && data) {
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
      await supabase.from(APP_CONFIG.supabaseTables.glucoseLogs).insert({
        id: log.id,
        profile_id: log.profileId,
        value: log.value,
        meal_type: log.mealType,
        timestamp: log.timestamp,
        status: log.status,
        notes: log.notes
      });
    } catch (err) {
      console.warn("Supabase saveGlucoseLog fallback:", err);
    }
  }
  const logs = loadFromStorage<GlucoseLog[]>(STORAGE_KEYS.GLUCOSE_LOGS, []);
  logs.unshift(log);
  saveToStorage(STORAGE_KEYS.GLUCOSE_LOGS, logs);
  return log;
}

// --- BLOOD PRESSURE LOGS ---
export async function fetchBPLogs(profileId?: string): Promise<BPLog[]> {
  if (isSupabaseConfigured && supabase) {
    try {
      let query = supabase.from(APP_CONFIG.supabaseTables.bpLogs).select("*").order("timestamp", { ascending: false });
      if (profileId) query = query.eq("profile_id", profileId);
      const { data, error } = await query;
      if (!error && data) {
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
      await supabase.from(APP_CONFIG.supabaseTables.bpLogs).insert({
        id: log.id,
        profile_id: log.profileId,
        systolic: log.systolic,
        diastolic: log.diastolic,
        pulse: log.pulse,
        category: log.category,
        timestamp: log.timestamp,
        notes: log.notes
      });
    } catch (err) {
      console.warn("Supabase saveBPLog fallback:", err);
    }
  }
  const logs = loadFromStorage<BPLog[]>(STORAGE_KEYS.BP_LOGS, []);
  logs.unshift(log);
  saveToStorage(STORAGE_KEYS.BP_LOGS, logs);
  return log;
}

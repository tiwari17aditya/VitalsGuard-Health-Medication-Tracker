import React, { createContext, useContext, useState, useEffect } from "react";
import confetti from "canvas-confetti";
import type { 
  UserProfile, Medication, MedicationLog, GlucoseLog, BPLog, ToastMessage, MealType, BPCategory 
} from "../types";
import { APP_CONFIG } from "../config/app.config";
import { 
  fetchProfiles, saveProfileDB, deleteProfileDB,
  fetchMedications, saveMedicationDB, deleteMedicationDB,
  fetchMedicationLogs, logAdherenceDB,
  fetchGlucoseLogs, saveGlucoseLogDB,
  fetchBPLogs, saveBPLogDB,
  isSupabaseConfigured
} from "../lib/supabase";
import { sendEmailNotification, generateRefillAlertHTML, generateDailyCheckHTML } from "../services/emailService";

interface AppContextType {
  // Profiles
  profiles: UserProfile[];
  activeProfile: UserProfile | null;
  setActiveProfileId: (id: string) => void;
  addOrUpdateProfile: (profile: UserProfile) => Promise<void>;
  deleteProfile: (id: string) => Promise<void>;

  // Medications
  medications: Medication[];
  medicationLogs: MedicationLog[];
  addOrUpdateMedication: (med: Medication) => Promise<void>;
  deleteMedication: (id: string) => Promise<void>;
  takeMedication: (medId: string) => Promise<void>;
  refillStock: (medId: string, addedCount: number) => Promise<void>;

  // Vitals
  glucoseLogs: GlucoseLog[];
  addGlucoseLog: (val: number, mealType: MealType, notes?: string) => Promise<void>;
  bpLogs: BPLog[];
  addBPLog: (sys: number, dia: number, pulse: number, notes?: string) => Promise<void>;

  // Reports & Email
  caretakerEmail: string;
  setCaretakerEmail: (email: string) => void;
  sendDailyCheckEmail: (profileId?: string) => Promise<void>;
  sendRefillAlertEmail: (profileId?: string) => Promise<void>;

  // Toasts
  toasts: ToastMessage[];
  showToast: (type: ToastMessage["type"], title: string, message: string) => void;
  removeToast: (id: string) => void;

  // System & Status
  isOffline: boolean;
  isSupabaseActive: boolean;
  isLoading: boolean;
  lowStockMeds: Medication[];
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [profiles, setProfiles] = useState<UserProfile[]>(APP_CONFIG.defaultProfiles as UserProfile[]);
  const [activeProfileId, setActiveProfileIdState] = useState<string>(APP_CONFIG.defaultProfiles[0].id);
  const [medications, setMedications] = useState<Medication[]>(APP_CONFIG.defaultMedications as Medication[]);
  const [medicationLogs, setMedicationLogs] = useState<MedicationLog[]>([]);
  const [glucoseLogs, setGlucoseLogs] = useState<GlucoseLog[]>([]);
  const [bpLogs, setBpLogs] = useState<BPLog[]>([]);
  
  const [caretakerEmail, setCaretakerEmailState] = useState<string>(
    localStorage.getItem("carepulse_caretaker_email") || APP_CONFIG.emailSettings.defaultCaretakerEmail
  );
  
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isOffline, setIsOffline] = useState<boolean>(!navigator.onLine);

  // Network offline listener
  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // Toast Notification Helper
  const showToast = (type: ToastMessage["type"], title: string, message: string) => {
    const id = `toast-${Date.now()}-${Math.random()}`;
    setToasts(prev => [...prev, { id, type, title, message }]);
    setTimeout(() => {
      removeToast(id);
    }, 4500);
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  const setCaretakerEmail = (email: string) => {
    setCaretakerEmailState(email);
    localStorage.setItem("carepulse_caretaker_email", email);
    showToast("info", "Email Saved", `Caretaker email updated to ${email}`);
  };

  // Initial Load from Supabase / LocalStorage
  const refreshAllData = async () => {
    setIsLoading(true);
    try {
      let loadedProfiles = await fetchProfiles();
      if (!loadedProfiles || loadedProfiles.length === 0) {
        loadedProfiles = APP_CONFIG.defaultProfiles as UserProfile[];
      }
      setProfiles(loadedProfiles);
      
      const savedId = localStorage.getItem("carepulse_active_profile");
      const match = loadedProfiles.find(p => p.id === savedId);
      setActiveProfileIdState(match ? match.id : loadedProfiles[0].id);

      let loadedMeds = await fetchMedications();
      if (!loadedMeds || loadedMeds.length === 0) {
        loadedMeds = APP_CONFIG.defaultMedications as Medication[];
      }
      setMedications(loadedMeds);

      const loadedMedLogs = await fetchMedicationLogs();
      setMedicationLogs(loadedMedLogs);

      const loadedGlucose = await fetchGlucoseLogs();
      setGlucoseLogs(loadedGlucose);

      const loadedBP = await fetchBPLogs();
      setBpLogs(loadedBP);
    } catch (err) {
      console.error("Error loading application data:", err);
      showToast("error", "Data Error", "Could not load records. Operating in fallback mode.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshAllData();
  }, []);

  const setActiveProfileId = (id: string) => {
    setActiveProfileIdState(id);
    localStorage.setItem("carepulse_active_profile", id);
  };

  const activeProfile = profiles.find(p => p.id === activeProfileId) || profiles[0] || APP_CONFIG.defaultProfiles[0];

  // Scoped Low Stock Medications ONLY for current active profile
  const lowStockMeds = medications.filter(
    m => m.profileId === activeProfile?.id && m.stockCount <= m.minStockAlert
  );

  // PROFILES CRUD
  const addOrUpdateProfile = async (profile: UserProfile) => {
    try {
      const saved = await saveProfileDB(profile);
      setProfiles(prev => {
        const idx = prev.findIndex(p => p.id === saved.id);
        if (idx >= 0) {
          const next = [...prev];
          next[idx] = saved;
          return next;
        }
        return [...prev, saved];
      });
      if (!activeProfileId) setActiveProfileId(saved.id);
      showToast("success", "Profile Saved", `Profile for ${saved.name} updated successfully.`);
    } catch (err: any) {
      showToast("error", "Profile Error", err.message || "Failed to save profile.");
    }
  };

  const deleteProfile = async (id: string) => {
    try {
      await deleteProfileDB(id);
      setProfiles(prev => prev.filter(p => p.id !== id));
      if (activeProfileId === id && profiles.length > 1) {
        const remaining = profiles.filter(p => p.id !== id);
        setActiveProfileId(remaining[0].id);
      }
      showToast("info", "Profile Removed", "User profile has been deleted.");
    } catch (err: any) {
      showToast("error", "Delete Error", err.message || "Could not delete profile.");
    }
  };

  // MEDICATIONS CRUD
  const addOrUpdateMedication = async (med: Medication) => {
    try {
      const saved = await saveMedicationDB(med);
      setMedications(prev => {
        const idx = prev.findIndex(m => m.id === saved.id);
        if (idx >= 0) {
          const next = [...prev];
          next[idx] = saved;
          return next;
        }
        return [...prev, saved];
      });
      showToast("success", "Medication Saved", `${saved.name} (${saved.dosage}) saved.`);

      // Check if newly saved med has low stock
      if (saved.stockCount <= saved.minStockAlert) {
        showToast("warning", "Low Stock Alert", `Only ${saved.stockCount} pills left for ${saved.name}!`);
      }
    } catch (err: any) {
      showToast("error", "Medication Error", err.message || "Failed to save medication.");
    }
  };

  const deleteMedication = async (id: string) => {
    try {
      await deleteMedicationDB(id);
      setMedications(prev => prev.filter(m => m.id !== id));
      showToast("info", "Medication Deleted", "Medication removed from inventory.");
    } catch (err: any) {
      showToast("error", "Delete Error", err.message || "Could not delete medication.");
    }
  };

  // TAKE MEDICATION & AUTO-SUBTRACT INVENTORY
  const takeMedication = async (medId: string) => {
    const targetMed = medications.find(m => m.id === medId);
    if (!targetMed) return;

    if (targetMed.stockCount <= 0) {
      showToast("error", "Out of Stock!", `Cannot take ${targetMed.name}. Inventory is empty (0 pills). Please refill stock.`);
      return;
    }

    try {
      const { log, updatedMed } = await logAdherenceDB(medId, targetMed.profileId, "taken", 1);
      setMedicationLogs(prev => [log, ...prev]);

      if (updatedMed) {
        setMedications(prev => prev.map(m => m.id === updatedMed.id ? updatedMed : m));
        
        // Refill Warning check after subtraction
        if (updatedMed.stockCount <= updatedMed.minStockAlert) {
          showToast(
            "warning", 
            "⚠️ Refill Alert Needed!", 
            `${updatedMed.name} stock is down to ${updatedMed.stockCount} pills! Alert notice created.`
          );
        }
      }

      showToast("success", "Medication Taken", `Logged 1 dose of ${targetMed.name}. ${updatedMed ? updatedMed.stockCount : targetMed.stockCount - 1} pills remaining.`);

      // Check if all today's medications for this profile are completed -> trigger confetti celebration!
      if (APP_CONFIG.featureFlags.enableConfettiOnAdherence) {
        const profileMeds = medications.filter(m => m.profileId === targetMed.profileId && m.active);
        const todayStr = new Date().toISOString().split("T")[0];
        const takenTodayIds = new Set(
          medicationLogs
            .filter(l => l.profileId === targetMed.profileId && l.timestamp.startsWith(todayStr) && l.status === "taken")
            .map(l => l.medicationId)
        );
        takenTodayIds.add(medId);

        if (profileMeds.length > 0 && takenTodayIds.size >= profileMeds.length) {
          confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } });
          showToast("success", "🎉 All Meds Complete!", "Great job! All scheduled medications for today are taken!");
        }
      }

    } catch (err: any) {
      showToast("error", "Adherence Error", err.message || "Failed to log medication intake.");
    }
  };

  const refillStock = async (medId: string, addedCount: number) => {
    const targetMed = medications.find(m => m.id === medId);
    if (!targetMed) return;

    const newStock = targetMed.stockCount + addedCount;
    const updated = { ...targetMed, stockCount: newStock };

    await addOrUpdateMedication(updated);
    showToast("success", "Stock Refilled", `Added ${addedCount} pills to ${targetMed.name}. Total stock: ${newStock} pills.`);
  };

  // DIABETES GLUCOSE LOGGING & MEDICAL CLASSIFICATION
  const addGlucoseLog = async (val: number, mealType: MealType, notes?: string) => {
    if (!activeProfile) {
      showToast("error", "No User Profile", "Please select or create a user profile first.");
      return;
    }

    // Determine Ada glucose status
    const ranges = mealType === "fasting" 
      ? APP_CONFIG.medicalStandards.bloodGlucose.ranges.fasting 
      : APP_CONFIG.medicalStandards.bloodGlucose.ranges.postMeal;
    
    const statusMatch = ranges.find(r => val >= r.min && val <= r.max);
    const status = statusMatch ? statusMatch.name : "High (Diabetes)";

    const newLog: GlucoseLog = {
      id: `gl-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      profileId: activeProfile.id,
      value: val,
      mealType,
      timestamp: new Date().toISOString(),
      status,
      notes
    };

    try {
      await saveGlucoseLogDB(newLog);
      setGlucoseLogs(prev => [newLog, ...prev]);
      
      const isHigh = val >= 180 || status.includes("High");
      const isLow = val < 70;
      if (isHigh || isLow) {
        showToast("warning", `Glucose Alert (${val} mg/dL)`, `Reading categorized as: ${status}. Notes logged.`);
      } else {
        showToast("success", "Glucose Logged", `${val} mg/dL (${mealType}) recorded successfully.`);
      }
    } catch (err: any) {
      showToast("error", "Glucose Log Error", err.message || "Could not save blood glucose record.");
    }
  };

  // BLOOD PRESSURE LOGGING & CATEGORY COMPUTATION
  const addBPLog = async (sys: number, dia: number, pulse: number, notes?: string) => {
    if (!activeProfile) {
      showToast("error", "No User Profile", "Please select or create a user profile first.");
      return;
    }

    // Calculate BP Category (ACC/AHA Standard)
    let category: BPCategory = "Normal";
    if (sys >= 180 || dia >= 120) category = "Hypertensive Crisis";
    else if (sys >= 140 || dia >= 90) category = "Stage 2 Hypertension";
    else if ((sys >= 130 && sys <= 139) || (dia >= 80 && dia <= 89)) category = "Stage 1 Hypertension";
    else if (sys >= 120 && sys <= 129 && dia < 80) category = "Elevated";

    const newLog: BPLog = {
      id: `bp-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      profileId: activeProfile.id,
      systolic: sys,
      diastolic: dia,
      pulse,
      category,
      timestamp: new Date().toISOString(),
      notes
    };

    try {
      await saveBPLogDB(newLog);
      setBpLogs(prev => [newLog, ...prev]);

      if (category === "Hypertensive Crisis") {
        showToast("error", "🚨 EMERGENCY BP ALERT", `Reading ${sys}/${dia} mmHg is Hypertensive Crisis level! Consult doctor immediately!`);
      } else if (category.includes("Stage")) {
        showToast("warning", `BP Alert: ${category}`, `Reading ${sys}/${dia} mmHg logged.`);
      } else {
        showToast("success", "BP Recorded", `${sys}/${dia} mmHg (Pulse: ${pulse} bpm) logged.`);
      }
    } catch (err: any) {
      showToast("error", "BP Log Error", err.message || "Could not save BP reading.");
    }
  };

  // EMAIL REPORT DISPATCHERS
  const sendDailyCheckEmail = async (targetProfileId?: string) => {
    const prof = profiles.find(p => p.id === (targetProfileId || activeProfileId)) || activeProfile;
    if (!prof) return;

    const profMeds = medications.filter(m => m.profileId === prof.id);
    const todayStr = new Date().toISOString().split("T")[0];
    const logsToday = medicationLogs.filter(l => l.profileId === prof.id && l.timestamp.startsWith(todayStr));
    const glucoseToday = glucoseLogs.filter(g => g.profileId === prof.id && g.timestamp.startsWith(todayStr));
    const bpToday = bpLogs.filter(b => b.profileId === prof.id && b.timestamp.startsWith(todayStr));

    const htmlContent = generateDailyCheckHTML(prof, profMeds, logsToday, glucoseToday, bpToday);
    const res = await sendEmailNotification({
      to: caretakerEmail,
      subject: `Daily VitalsGuard Health Check: ${prof.name} (${new Date().toLocaleDateString()})`,
      htmlContent,
      type: "daily_check"
    });

    if (res.success) {
      showToast("success", "Daily Email Dispatched", res.message);
    } else {
      showToast("error", "Email Failed", res.message);
    }
  };

  const sendRefillAlertEmail = async (targetProfileId?: string) => {
    const prof = profiles.find(p => p.id === (targetProfileId || activeProfileId)) || activeProfile;
    if (!prof) return;

    const lowMeds = medications.filter(m => m.profileId === prof.id && m.stockCount <= m.minStockAlert);
    if (lowMeds.length === 0) {
      showToast("info", "Stock Healthy", `No low stock medications detected for ${prof.name}.`);
      return;
    }

    const htmlContent = generateRefillAlertHTML(prof, lowMeds);
    const res = await sendEmailNotification({
      to: caretakerEmail,
      subject: `⚠️ Urgent Refill Needed for ${prof.name} - VitalsGuard Alert`,
      htmlContent,
      type: "refill_alert"
    });

    if (res.success) {
      showToast("warning", "Refill Warning Email Sent", res.message);
    } else {
      showToast("error", "Email Failed", res.message);
    }
  };

  return (
    <AppContext.Provider
      value={{
        profiles,
        activeProfile,
        setActiveProfileId,
        addOrUpdateProfile,
        deleteProfile,

        medications,
        medicationLogs,
        addOrUpdateMedication,
        deleteMedication,
        takeMedication,
        refillStock,

        glucoseLogs,
        addGlucoseLog,
        bpLogs,
        addBPLog,

        caretakerEmail,
        setCaretakerEmail,
        sendDailyCheckEmail,
        sendRefillAlertEmail,

        toasts,
        showToast,
        removeToast,

        isOffline,
        isSupabaseActive: isSupabaseConfigured,
        isLoading,
        lowStockMeds
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
};

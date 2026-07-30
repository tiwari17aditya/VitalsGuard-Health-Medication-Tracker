import React, { createContext, useContext, useState, useEffect } from "react";
import confetti from "canvas-confetti";
import type { 
  UserProfile, Medication, MedicationLog, GlucoseLog, BPLog, ToastMessage, MealType, BPCategory, ActionAuditLog 
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
  takeMedication: (medId: string, customTimeStr?: string, customDateStr?: string) => Promise<void>;
  skipMedication: (medId: string, reason?: string) => Promise<void>;
  deleteMedicationLog: (logId: string) => Promise<void>;
  refillStock: (medId: string, addedCount: number) => Promise<void>;

  // Vitals
  glucoseLogs: GlucoseLog[];
  addGlucoseLog: (val: number, mealType: MealType, notes?: string, customTimeStr?: string) => Promise<void>;
  bpLogs: BPLog[];
  addBPLog: (sys: number, dia: number, pulse: number, notes?: string, customTimeStr?: string) => Promise<void>;

  // Audit Action Logs
  auditLogs: ActionAuditLog[];
  logUserAction: (actionType: ActionAuditLog["actionType"], description: string, details?: any) => void;

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
  updateAdminPasscode: (newPin: string) => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [profiles, setProfiles] = useState<UserProfile[]>(APP_CONFIG.defaultProfiles as UserProfile[]);
  const [activeProfileId, setActiveProfileIdState] = useState<string>(APP_CONFIG.defaultProfiles[0].id);
  const [medications, setMedications] = useState<Medication[]>(APP_CONFIG.defaultMedications as Medication[]);
  const [medicationLogs, setMedicationLogs] = useState<MedicationLog[]>([]);
  const [glucoseLogs, setGlucoseLogs] = useState<GlucoseLog[]>([]);
  const [bpLogs, setBpLogs] = useState<BPLog[]>([]);
  const [auditLogs, setAuditLogs] = useState<ActionAuditLog[]>(() => {
    try {
      const raw = localStorage.getItem("vitalsguard_audit_logs_v1");
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });
  
  const [caretakerEmail, setCaretakerEmailState] = useState<string>(
    localStorage.getItem("vitalsguard_caretaker_email") || APP_CONFIG.emailSettings.defaultCaretakerEmail
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

  // Action Audit Logging Helper
  const logUserAction = (actionType: ActionAuditLog["actionType"], description: string, details?: any) => {
    const profId = activeProfileId || (profiles.length > 0 ? profiles[0].id : "default");
    const newLog: ActionAuditLog = {
      id: `audit_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      profileId: profId,
      timestamp: new Date().toISOString(),
      actionType,
      description,
      details
    };
    setAuditLogs(prev => {
      const updated = [newLog, ...prev];
      try {
        localStorage.setItem("vitalsguard_audit_logs_v1", JSON.stringify(updated.slice(0, 500)));
      } catch (e) {
        console.warn("Error saving audit log:", e);
      }
      return updated;
    });
  };

  const setCaretakerEmail = (email: string) => {
    setCaretakerEmailState(email);
    localStorage.setItem("vitalsguard_caretaker_email", email);
    logUserAction("PROFILE_UPDATED", `Caretaker email address updated to ${email}`);
    showToast("info", "Email Saved", `Caretaker email updated to ${email}`);
  };

  // Initial Load from Supabase / LocalStorage
  const refreshAllData = async () => {
    setIsLoading(true);
    try {
      let loadedProfiles = await fetchProfiles();
      const systemSettings = loadedProfiles.find(p => p.id === "system-settings");
      if (systemSettings && systemSettings.notes) {
        localStorage.setItem("vitalsguard_admin_pin", systemSettings.notes);
      }
      loadedProfiles = loadedProfiles.filter(p => p.id !== "system-settings");

      if (!loadedProfiles || loadedProfiles.length === 0) {
        loadedProfiles = APP_CONFIG.defaultProfiles as UserProfile[];
      }
      setProfiles(loadedProfiles);
      
      const savedId = localStorage.getItem("vitalsguard_active_profile");
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
    localStorage.setItem("vitalsguard_active_profile", id);
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
      const isEdit = medications.some(m => m.id === med.id);
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
      logUserAction(
        isEdit ? "MEDICATION_EDITED" : "MEDICATION_ADDED", 
        `${isEdit ? "Updated" : "Added"} prescription ${saved.name} (${saved.dosage}) with schedule ${saved.scheduleType || 'daily'}`
      );
      showToast("success", "Medication Saved", `${saved.name} (${saved.dosage}) saved.`);

      if (saved.stockCount <= saved.minStockAlert) {
        showToast("warning", "Low Stock Alert", `Only ${saved.stockCount} pills left for ${saved.name}!`);
      }
    } catch (err: any) {
      showToast("error", "Medication Error", err.message || "Failed to save medication.");
    }
  };

  const deleteMedication = async (id: string) => {
    try {
      const target = medications.find(m => m.id === id);
      await deleteMedicationDB(id);
      setMedications(prev => prev.filter(m => m.id !== id));
      if (target) {
        logUserAction("UI_INTERACTION", `Deleted prescription ${target.name} from inventory`);
      }
      showToast("info", "Medication Deleted", "Medication removed from inventory.");
    } catch (err: any) {
      showToast("error", "Delete Error", err.message || "Could not delete medication.");
    }
  };

  // TAKE MEDICATION WITH CUSTOM TIME & DATE SUPPORT
  const takeMedication = async (medId: string, customTimeStr?: string, customDateStr?: string) => {
    const targetMed = medications.find(m => m.id === medId);
    if (!targetMed) return;

    if (targetMed.stockCount <= 0) {
      showToast("error", "Out of Stock!", `Cannot take ${targetMed.name}. Inventory is empty (0 pills). Please refill stock.`);
      return;
    }

    let timestampToLog = new Date().toISOString();
    if (customDateStr) {
      const dateParts = customDateStr.split("-").map(Number);
      const customDate = new Date(dateParts[0], dateParts[1] - 1, dateParts[2]);
      if (customTimeStr) {
        const [hours, minutes] = customTimeStr.split(":").map(Number);
        if (!isNaN(hours) && !isNaN(minutes)) {
          customDate.setHours(hours, minutes, 0, 0);
        }
      } else {
        const now = new Date();
        customDate.setHours(now.getHours(), now.getMinutes(), 0, 0);
      }
      timestampToLog = customDate.toISOString();
    } else if (customTimeStr) {
      const [hours, minutes] = customTimeStr.split(":").map(Number);
      const customDate = new Date();
      if (!isNaN(hours) && !isNaN(minutes)) {
        customDate.setHours(hours, minutes, 0, 0);
        timestampToLog = customDate.toISOString();
      }
    }

    try {
      const { log, updatedMed } = await logAdherenceDB(medId, targetMed.profileId, "taken", 1, timestampToLog);
      setMedicationLogs(prev => 
        [log, ...prev].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      );
      logUserAction("MEDICATION_TAKEN", `Logged intake of ${targetMed.name} (${targetMed.dosage})`, { medId, timestamp: timestampToLog });

      if (updatedMed) {
        setMedications(prev => prev.map(m => m.id === updatedMed.id ? updatedMed : m));
        
        if (updatedMed.stockCount <= updatedMed.minStockAlert) {
          showToast(
            "warning", 
            "⚠️ Refill Alert Needed!", 
            `${updatedMed.name} stock is down to ${updatedMed.stockCount} pills!`
          );
        }
      }

      const formattedTime = new Date(timestampToLog).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const formattedDate = new Date(timestampToLog).toLocaleDateString([], { month: 'short', day: 'numeric' });
      showToast("success", "Medication Logged", `Taken ${targetMed.name} on ${formattedDate} at ${formattedTime}. ${updatedMed ? updatedMed.stockCount : targetMed.stockCount - 1} pills remaining.`);

      if (APP_CONFIG.featureFlags.enableConfettiOnAdherence) {
        const profileMeds = medications.filter(m => m.profileId === targetMed.profileId && m.active);
        const logDateStr = timestampToLog.split("T")[0];
        const takenOnDateIds = new Set(
          medicationLogs
            .filter(l => l.profileId === targetMed.profileId && l.timestamp.startsWith(logDateStr) && l.status === "taken")
            .map(l => l.medicationId)
        );
        takenOnDateIds.add(medId);

        if (profileMeds.length > 0 && takenOnDateIds.size >= profileMeds.length) {
          confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } });
          showToast("success", "🎉 All Meds Complete!", `Great job! All scheduled medications for ${formattedDate} are taken!`);
        }
      }

    } catch (err: any) {
      showToast("error", "Adherence Error", err.message || "Failed to log medication intake.");
    }
  };

  const skipMedication = async (medId: string, reason?: string) => {
    const targetMed = medications.find(m => m.id === medId);
    if (!targetMed) return;

    try {
      const { log } = await logAdherenceDB(medId, targetMed.profileId, "skipped", 0);
      if (reason) log.notes = reason;
      setMedicationLogs(prev => [log, ...prev]);
      logUserAction("MEDICATION_SKIPPED", `Marked ${targetMed.name} dose as skipped${reason ? `: ${reason}` : ""}`);
      showToast("info", "Dose Marked Skipped", `Marked ${targetMed.name} dose as skipped${reason ? `: ${reason}` : ""}.`);
    } catch (err: any) {
      showToast("error", "Skip Error", err.message || "Failed to log skipped dose.");
    }
  };

  const deleteMedicationLog = async (logId: string) => {
    try {
      setMedicationLogs(prev => prev.filter(l => l.id !== logId));
      // Save updated logs to localStorage
      const filtered = medicationLogs.filter(l => l.id !== logId);
      localStorage.setItem("vitalsguard_med_logs_v1", JSON.stringify(filtered));
      showToast("info", "Log Deleted", "Intake log removed.");
    } catch (err: any) {
      showToast("error", "Delete Error", err.message || "Could not delete log.");
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

  // DIABETES GLUCOSE LOGGING
  const addGlucoseLog = async (val: number, mealType: MealType, notes?: string, customTimeStr?: string) => {
    if (!activeProfile) {
      showToast("error", "No User Profile", "Please select or create a user profile first.");
      return;
    }

    const ranges = mealType === "fasting" 
      ? APP_CONFIG.medicalStandards.bloodGlucose.ranges.fasting 
      : APP_CONFIG.medicalStandards.bloodGlucose.ranges.postMeal;
    
    const statusMatch = ranges.find(r => val >= r.min && val <= r.max);
    const status = statusMatch ? statusMatch.name : "High (Diabetes)";

    let timestampToLog = new Date().toISOString();
    if (customTimeStr) {
      const [hours, minutes] = customTimeStr.split(":").map(Number);
      const customDate = new Date();
      if (!isNaN(hours) && !isNaN(minutes)) {
        customDate.setHours(hours, minutes, 0, 0);
        timestampToLog = customDate.toISOString();
      }
    }

    const newLog: GlucoseLog = {
      id: `gl-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      profileId: activeProfile.id,
      value: val,
      mealType,
      timestamp: timestampToLog,
      status,
      notes
    };

    try {
      await saveGlucoseLogDB(newLog);
      setGlucoseLogs(prev => [newLog, ...prev]);
      
      const formattedTime = new Date(timestampToLog).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      showToast("success", "Glucose Logged", `${val} mg/dL logged at ${formattedTime} (${mealType}).`);
    } catch (err: any) {
      showToast("error", "Glucose Log Error", err.message || "Could not save blood glucose record.");
    }
  };

  // BLOOD PRESSURE LOGGING
  const addBPLog = async (sys: number, dia: number, pulse: number, notes?: string, customTimeStr?: string) => {
    if (!activeProfile) {
      showToast("error", "No User Profile", "Please select or create a user profile first.");
      return;
    }

    let category: BPCategory = "Normal";
    if (sys >= 180 || dia >= 120) category = "Hypertensive Crisis";
    else if (sys >= 140 || dia >= 90) category = "Stage 2 Hypertension";
    else if ((sys >= 130 && sys <= 139) || (dia >= 80 && dia <= 89)) category = "Stage 1 Hypertension";
    else if (sys >= 120 && sys <= 129 && dia < 80) category = "Elevated";

    let timestampToLog = new Date().toISOString();
    if (customTimeStr) {
      const [hours, minutes] = customTimeStr.split(":").map(Number);
      const customDate = new Date();
      if (!isNaN(hours) && !isNaN(minutes)) {
        customDate.setHours(hours, minutes, 0, 0);
        timestampToLog = customDate.toISOString();
      }
    }

    const newLog: BPLog = {
      id: `bp-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      profileId: activeProfile.id,
      systolic: sys,
      diastolic: dia,
      pulse,
      category,
      timestamp: timestampToLog,
      notes
    };

    try {
      await saveBPLogDB(newLog);
      setBpLogs(prev => [newLog, ...prev]);

      const formattedTime = new Date(timestampToLog).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      showToast("success", "BP Recorded", `${sys}/${dia} mmHg logged at ${formattedTime}.`);
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

  const updateAdminPasscode = async (newPin: string) => {
    localStorage.setItem("vitalsguard_admin_pin", newPin);
    try {
      await saveProfileDB({
        id: "system-settings",
        name: "System Settings",
        role: "System",
        notes: newPin
      } as UserProfile);
    } catch (err) {
      console.warn("Error saving passcode profile:", err);
    }
    logUserAction("PROFILE_UPDATED", "Admin passcode updated in database");
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
        skipMedication,
        deleteMedicationLog,
        refillStock,

        glucoseLogs,
        addGlucoseLog,
        bpLogs,
        addBPLog,

        auditLogs,
        logUserAction,

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
        lowStockMeds,
        updateAdminPasscode
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

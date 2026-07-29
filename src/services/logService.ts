import type { MedicationLog, GlucoseLog, BPLog, UserProfile, Medication } from "../types";

export interface DailyLogFile {
  dateStr: string; // YYYY-MM-DD
  formattedDate: string; // e.g. "Wednesday, July 29, 2026"
  profileName: string;
  medicationLogs: (MedicationLog & { medicationName?: string; dosage?: string })[];
  glucoseLogs: GlucoseLog[];
  bpLogs: BPLog[];
  totalLogsCount: number;
}

/**
 * Returns all logs grouped by day (YYYY-MM-DD) for a given profile
 */
export function getDailyLogsGrouped(
  profile: UserProfile,
  medications: Medication[],
  medicationLogs: MedicationLog[],
  glucoseLogs: GlucoseLog[],
  bpLogs: BPLog[]
): Record<string, DailyLogFile> {
  const profileMeds = medications.filter(m => m.profileId === profile.id);
  const medMap = new Map(profileMeds.map(m => [m.id, m]));

  const profileMedLogs = medicationLogs.filter(l => l.profileId === profile.id);
  const profileGlucose = glucoseLogs.filter(g => g.profileId === profile.id);
  const profileBP = bpLogs.filter(b => b.profileId === profile.id);

  const grouped: Record<string, DailyLogFile> = {};

  // Collect all unique date strings
  const datesSet = new Set<string>();
  
  profileMedLogs.forEach(l => datesSet.add(l.timestamp.split("T")[0]));
  profileGlucose.forEach(g => datesSet.add(g.timestamp.split("T")[0]));
  profileBP.forEach(b => datesSet.add(b.timestamp.split("T")[0]));

  // Ensure today's date is always present in list
  const todayStr = new Date().toISOString().split("T")[0];
  datesSet.add(todayStr);

  const sortedDates = Array.from(datesSet).sort((a, b) => b.localeCompare(a));

  sortedDates.forEach(dateStr => {
    const medLogsForDay = profileMedLogs
      .filter(l => l.timestamp.startsWith(dateStr))
      .map(l => {
        const med = medMap.get(l.medicationId);
        return {
          ...l,
          medicationName: med ? med.name : "Unknown Medication",
          dosage: med ? med.dosage : ""
        };
      });

    const glucoseForDay = profileGlucose.filter(g => g.timestamp.startsWith(dateStr));
    const bpForDay = profileBP.filter(b => b.timestamp.startsWith(dateStr));

    const totalLogsCount = medLogsForDay.length + glucoseForDay.length + bpForDay.length;
    
    // Format date string for display
    const d = new Date(dateStr + "T12:00:00");
    const formattedDate = d.toLocaleDateString("en-US", {
      weekday: "long", year: "numeric", month: "long", day: "numeric"
    });

    grouped[dateStr] = {
      dateStr,
      formattedDate,
      profileName: profile.name,
      medicationLogs: medLogsForDay,
      glucoseLogs: glucoseForDay,
      bpLogs: bpForDay,
      totalLogsCount
    };
  });

  return grouped;
}

/**
 * Downloads a daily log file as a JSON document (vitalsguard_log_YYYY-MM-DD.json)
 */
export function downloadDailyLogJSON(dailyLog: DailyLogFile) {
  const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(dailyLog, null, 2));
  const downloadAnchor = document.createElement("a");
  downloadAnchor.setAttribute("href", dataStr);
  downloadAnchor.setAttribute("download", `vitalsguard_log_${dailyLog.dateStr}.json`);
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();
}

/**
 * Downloads a daily log file as a CSV document (vitalsguard_log_YYYY-MM-DD.csv)
 */
export function downloadDailyLogCSV(dailyLog: DailyLogFile) {
  const csvRows: string[] = [];
  csvRows.push(`VitalsGuard Daily Health Log File - ${dailyLog.profileName}`);
  csvRows.push(`Date,${dailyLog.formattedDate}`);
  csvRows.push("");

  csvRows.push("--- MEDICATIONS INTAKE LOGS ---");
  csvRows.push("Time,Medication Name,Dosage,Status,Pills Taken,Notes");
  dailyLog.medicationLogs.forEach(l => {
    const timeStr = new Date(l.timestamp).toLocaleTimeString();
    csvRows.push(`"${timeStr}","${l.medicationName || ''}","${l.dosage || ''}","${l.status}",${l.quantityTaken || 1},"${l.notes || ''}"`);
  });
  csvRows.push("");

  csvRows.push("--- BLOOD GLUCOSE LOGS ---");
  csvRows.push("Time,Blood Glucose (mg/dL),Meal Type,ADA Status,Notes");
  dailyLog.glucoseLogs.forEach(g => {
    const timeStr = new Date(g.timestamp).toLocaleTimeString();
    csvRows.push(`"${timeStr}",${g.value},"${g.mealType}","${g.status}","${g.notes || ''}"`);
  });
  csvRows.push("");

  csvRows.push("--- BLOOD PRESSURE LOGS ---");
  csvRows.push("Time,Systolic (mmHg),Diastolic (mmHg),Pulse (BPM),AHA Category,Notes");
  dailyLog.bpLogs.forEach(b => {
    const timeStr = new Date(b.timestamp).toLocaleTimeString();
    csvRows.push(`"${timeStr}",${b.systolic},${b.diastolic},${b.pulse},"${b.category}","${b.notes || ''}"`);
  });

  const csvString = csvRows.join("\n");
  const blob = new Blob([csvString], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const downloadAnchor = document.createElement("a");
  downloadAnchor.setAttribute("href", url);
  downloadAnchor.setAttribute("download", `vitalsguard_log_${dailyLog.dateStr}.csv`);
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();
}

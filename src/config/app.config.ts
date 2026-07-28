/**
 * SINGLE CENTRAL CONFIGURATION FILE
 * All application defaults, medical reference ranges, notification settings,
 * database mapping, and feature flags are maintained in this file.
 */

export interface MedicalRange {
  name: string;
  min: number;
  max: number;
  color: string;
  badgeBg: string;
  description: string;
}

export const APP_CONFIG = {
  // App Identifiers & Branding
  meta: {
    appName: "VitalsGuard Health & Medication Tracker",
    shortName: "VitalsGuard",
    tagline: "Lifesaver Diabetes, Blood Pressure & Medication Manager for Parents",
    version: "1.0.0",
    developer: "Open Source Free Tech Project",
    license: "MIT Lifetime Free",
    githubRepo: "https://github.com/user/medication-tracker",
  },

  // Medical Reference Standards (ACC/AHA BP & ADA Diabetes Standards)
  medicalStandards: {
    bloodGlucose: {
      unit: "mg/dL",
      ranges: {
        fasting: [
          { name: "Low (Hypoglycemia)", min: 0, max: 69, color: "#ef4444", badgeBg: "rgba(239, 68, 68, 0.15)", description: "Requires immediate sugar boost" },
          { name: "Normal Target", min: 70, max: 99, color: "#10b981", badgeBg: "rgba(16, 185, 129, 0.15)", description: "Ideal fasting level" },
          { name: "Pre-Diabetes", min: 100, max: 125, color: "#f59e0b", badgeBg: "rgba(245, 158, 11, 0.15)", description: "Slightly elevated" },
          { name: "High (Diabetes)", min: 126, max: 500, color: "#dc2626", badgeBg: "rgba(220, 38, 38, 0.15)", description: "High glucose reading" },
        ],
        postMeal: [
          { name: "Low", min: 0, max: 69, color: "#ef4444", badgeBg: "rgba(239, 68, 68, 0.15)", description: "Below target range" },
          { name: "Normal Target", min: 70, max: 139, color: "#10b981", badgeBg: "rgba(16, 185, 129, 0.15)", description: "Healthy post-meal level" },
          { name: "Pre-Diabetes", min: 140, max: 199, color: "#f59e0b", badgeBg: "rgba(245, 158, 11, 0.15)", description: "Elevated post-meal" },
          { name: "High Glucose", min: 200, max: 600, color: "#dc2626", badgeBg: "rgba(220, 38, 38, 0.15)", description: "High post-meal reading" },
        ]
      }
    },

    bloodPressure: {
      unit: "mmHg",
      categories: [
        { name: "Normal", sysMax: 120, diaMax: 80, color: "#10b981", badgeBg: "rgba(16, 185, 129, 0.15)", advice: "Healthy BP range" },
        { name: "Elevated", sysMax: 129, diaMax: 80, color: "#eab308", badgeBg: "rgba(234, 179, 8, 0.15)", advice: "Adopt healthy lifestyle habits" },
        { name: "Stage 1 Hypertension", sysMax: 139, diaMax: 89, color: "#f97316", badgeBg: "rgba(249, 115, 22, 0.15)", advice: "Consult doctor for guidance" },
        { name: "Stage 2 Hypertension", sysMax: 179, diaMax: 119, color: "#ef4444", badgeBg: "rgba(239, 68, 68, 0.15)", advice: "Requires medical attention" },
        { name: "Hypertensive Crisis", sysMax: 300, diaMax: 200, color: "#991b1b", badgeBg: "rgba(153, 27, 27, 0.25)", advice: "Urgent medical care needed!" },
      ]
    }
  },

  // Inventory & Refill Rules
  inventorySettings: {
    defaultLowStockThreshold: 5, // Alert when remaining stock is <= 5 pills
    autoSubtractOnTaken: true,
    warningPillCount: 7,
    criticalPillCount: 3,
  },

  // Email Notification & Caretaker Reports
  emailSettings: {
    defaultCaretakerEmail: "caretaker@example.com",
    sendDailyDigest: true,
    dailyDigestTime: "20:00", // 8:00 PM
    sendRefillAlerts: true,
    weeklyReportDay: "Sunday",
    monthlyReportDate: 1,
    resendApiEndpoint: "https://api.resend.com/emails",
  },

  // Database Schema Table Names (Supabase)
  supabaseTables: {
    profiles: "profiles",
    medications: "medications",
    medicationLogs: "medication_logs",
    glucoseLogs: "glucose_logs",
    bpLogs: "bp_logs",
    reports: "health_reports"
  },

  // Global Feature Toggles
  featureFlags: {
    enableSupabase: true,
    enableOfflineFallback: true,
    enablePWAInstall: true,
    enableConfettiOnAdherence: true,
    enableDirectPrintPDF: true,
    enableCSVExport: true,
  },

  // Pre-populated Default Sample Data for instant out-of-the-box usage
  defaultProfiles: [
    {
      id: "profile-mom",
      name: "Mom (Sarah)",
      role: "Mother",
      age: 62,
      targetGlucoseFasting: "70-100 mg/dL",
      targetGlucosePostMeal: "< 140 mg/dL",
      targetBP: "120/80 mmHg",
      emergencyContact: "+1 (555) 234-5678",
      doctorName: "Dr. Robert Smith (Cardiologist)",
      notes: "Diabetic care routine + BP monitoring every morning",
      avatarColor: "#ec4899"
    },
    {
      id: "profile-dad",
      name: "Dad (James)",
      role: "Father",
      age: 65,
      targetGlucoseFasting: "80-110 mg/dL",
      targetGlucosePostMeal: "< 140 mg/dL",
      targetBP: "130/85 mmHg",
      emergencyContact: "+1 (555) 876-5432",
      doctorName: "Dr. Emily Davis (General Physician)",
      notes: "Blood Pressure tracking & Evening cholesterol medication",
      avatarColor: "#3b82f6"
    }
  ],

  defaultMedications: [
    {
      id: "med-1",
      profileId: "profile-mom",
      name: "Metformin ER",
      dosage: "500 mg",
      frequency: "Twice Daily",
      times: ["08:00", "20:00"],
      stockCount: 14,
      minStockAlert: 5,
      instructions: "Take with meals to minimize stomach upset",
      foodRelation: "After Food",
      active: true
    },
    {
      id: "med-2",
      profileId: "profile-mom",
      name: "Amlodipine",
      dosage: "5 mg",
      frequency: "Once Daily",
      times: ["09:00"],
      stockCount: 4, // Trigger low stock alert!
      minStockAlert: 5,
      instructions: "Take in the morning for BP management",
      foodRelation: "Before Food",
      active: true
    },
    {
      id: "med-3",
      profileId: "profile-dad",
      name: "Atorvastatin",
      dosage: "20 mg",
      frequency: "Once Daily (Night)",
      times: ["21:00"],
      stockCount: 22,
      minStockAlert: 5,
      instructions: "Take at bedtime",
      foodRelation: "After Food",
      active: true
    },
    {
      id: "med-4",
      profileId: "profile-dad",
      name: "Telmisartan",
      dosage: "40 mg",
      frequency: "Once Daily",
      times: ["08:00"],
      stockCount: 3, // Trigger critical alert!
      minStockAlert: 5,
      instructions: "Morning BP pill",
      foodRelation: "Before Food",
      active: true
    }
  ]
};

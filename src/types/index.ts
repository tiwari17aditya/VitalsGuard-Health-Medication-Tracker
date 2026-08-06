export type MealType = "fasting" | "post_meal" | "bedtime" | "random";
export type AdherenceStatus = "taken" | "missed" | "skipped";
export type FoodRelation = "Before Food" | "After Food" | "With Food";
export type BPCategory = "Normal" | "Elevated" | "Stage 1 Hypertension" | "Stage 2 Hypertension" | "Hypertensive Crisis";
export type GlucoseStatus = "Low (Hypoglycemia)" | "Normal Target" | "Pre-Diabetes" | "High (Diabetes)" | "Low" | "High Glucose";

export interface UserProfile {
  id: string;
  name: string;
  role: string; // e.g., "Mother", "Father", "Self"
  age?: number;
  targetGlucoseFasting?: string;
  targetGlucosePostMeal?: string;
  targetBP?: string;
  targetWater?: number;
  gender?: string;
  weight?: number;
  season?: string;
  emergencyContact?: string;
  doctorName?: string;
  notes?: string;
  avatarColor?: string;
  isLocked?: boolean;
  pin?: string;
  created_at?: string;
}

export interface Medication {
  id: string;
  profileId: string;
  name: string;
  dosage: string;
  frequency: string;
  scheduleType?: "daily" | "weekly" | "monthly" | "specific_days" | "as_needed";
  daysOfWeek?: string[]; // e.g. ["Mon", "Wed", "Fri", "Sun"]
  durationBasis?: "forever" | "7_days" | "14_days" | "30_days" | "custom";
  times: string[]; // e.g. ["08:00", "20:00"]
  stockCount: number;
  minStockAlert: number;
  instructions: string;
  foodRelation: FoodRelation;
  active: boolean;
  trackingEnabled?: boolean;
  created_at?: string;
}

export interface MedicationLog {
  id: string;
  medicationId: string;
  profileId: string;
  timestamp: string; // ISO String
  status: AdherenceStatus;
  quantityTaken: number;
  notes?: string;
}

export interface GlucoseLog {
  id: string;
  profileId: string;
  value: number; // mg/dL
  mealType: MealType;
  timestamp: string; // ISO String
  status: string;
  notes?: string;
}

export interface BPLog {
  id: string;
  profileId: string;
  systolic: number; // mmHg
  diastolic: number; // mmHg
  pulse: number; // bpm
  category: BPCategory;
  timestamp: string; // ISO String
  notes?: string;
}

export interface HealthReport {
  id: string;
  profileId: string;
  startDate: string;
  endDate: string;
  adherenceRate: number; // Percentage
  totalDosesScheduled: number;
  totalDosesTaken: number;
  avgFastingGlucose: number;
  avgPostMealGlucose: number;
  avgSystolicBP: number;
  avgDiastolicBP: number;
  lowStockAlertsCount: number;
  createdAt: string;
  notes?: string;
}

export interface ActionAuditLog {
  id: string;
  profileId: string;
  timestamp: string; // ISO String
  actionType: "MEDICATION_TAKEN" | "MEDICATION_SKIPPED" | "MEDICATION_ADDED" | "MEDICATION_EDITED" | "MEDICATION_PAUSED" | "EMAIL_SENT" | "PROFILE_UPDATED" | "LOG_EXPORTED" | "UI_INTERACTION" | "WATER_LOGGED" | "WATER_TARGET_UPDATED" | "WATER_LOG_DELETED";
  description: string;
  details?: Record<string, any>;
}

export interface WaterItem {
  id: string;
  profileId: string;
  name: string;
  amount: number; // in ml
  times?: string[];
  active: boolean;
  icon?: string;
  created_at?: string;
}

export interface WaterLog {
  id: string;
  profileId: string;
  waterId?: string;
  amount: number; // in ml
  timestamp: string; // ISO String
  notes?: string;
}

export interface ToastMessage {
  id: string;
  type: "success" | "warning" | "error" | "info";
  title: string;
  message: string;
}


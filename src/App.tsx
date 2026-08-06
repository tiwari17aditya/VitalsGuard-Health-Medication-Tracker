import React, { useState } from "react";
import { AppProvider, useApp } from "./context/AppContext";
import { Header } from "./components/Header";
import { Navigation } from "./components/Navigation";
import type { NavTab } from "./components/Navigation";
import { VitalsTracker } from "./components/VitalsTracker";
import { MedicationTracker } from "./components/MedicationTracker";
import { MedicationCalendar } from "./components/MedicationCalendar";
import { ReportsManager } from "./components/ReportsManager";
import { WaterTracker } from "./components/WaterTracker";
import { ProfileModal } from "./components/ProfileModal";
import { PrivacyLockGate } from "./components/PrivacyLockGate";
import { ToastContainer } from "./components/ToastContainer";

const DashboardContent: React.FC = () => {
  const [activeTab, setActiveTab] = useState<NavTab>("vitals");
  const [showProfileModal, setShowProfileModal] = useState<boolean>(false);

  const { activeProfile, glucoseLogs, bpLogs, medicationLogs, medications, waterLogs, waterTargets } = useApp();

  const currentProfile = activeProfile || null;

  // Check if current active profile session is unlocked
  const isUnlocked = () => {
    if (!currentProfile || !currentProfile.isLocked) return true;
    return sessionStorage.getItem(`vitalsguard_unlocked_${currentProfile.id}`) === "true";
  };

  const unlocked = isUnlocked();

  // Calculate top KPI statistics for current active profile
  const profileGlucose = currentProfile ? glucoseLogs.filter(g => g.profileId === currentProfile.id) : [];
  const profileBP = currentProfile ? bpLogs.filter(b => b.profileId === currentProfile.id) : [];
  const profileMeds = currentProfile ? medications.filter(m => m.profileId === currentProfile.id) : [];

  const latestGlucose = profileGlucose.length > 0 ? profileGlucose[0] : null;
  const latestBP = profileBP.length > 0 ? profileBP[0] : null;

  const todayStr = new Date().toISOString().split("T")[0];
  const logsToday = currentProfile ? medicationLogs.filter(l => l.profileId === currentProfile.id && l.timestamp.startsWith(todayStr)) : [];
  const takenTodayCount = logsToday.filter(l => l.status === "taken").length;
  const totalProfileMeds = profileMeds.length;
  const todayAdherence = totalProfileMeds > 0 ? Math.round((takenTodayCount / totalProfileMeds) * 100) : 0;

  // Calculate water metrics for top KPI card
  const profileWaterToday = currentProfile
    ? waterLogs
        .filter(w => w.profileId === currentProfile.id && w.timestamp.startsWith(todayStr))
        .reduce((sum, w) => sum + w.amount, 0)
    : 0;
  const waterTarget = currentProfile ? (waterTargets[currentProfile.id] || 2000) : 2000;
  const waterProgressPercent = Math.round((profileWaterToday / waterTarget) * 100);

  return (
    <div className="app-container">
      {/* Header */}
      <Header onOpenProfileModal={() => setShowProfileModal(true)} />

      {/* Top Overview KPI Quick Cards */}
      <div className="grid-4" style={{ marginBottom: "20px" }}>
        
        {/* Card 1: Today's Adherence */}
        <div className="glass-card" style={{ padding: "16px", display: "flex", alignItems: "center", gap: "14px" }}>
          <div 
            style={{ 
              minWidth: "60px", 
              height: "46px", 
              padding: "0 10px", 
              borderRadius: "12px", 
              background: unlocked && todayAdherence > 0 ? "rgba(16, 185, 129, 0.2)" : "rgba(100, 116, 139, 0.2)", 
              display: "flex", 
              alignItems: "center", 
              justifyContent: "center", 
              color: unlocked && todayAdherence > 0 ? "#10b981" : "#94a3b8", 
              fontWeight: "bold", 
              fontSize: "0.95rem",
              whiteSpace: "nowrap"
            }}
          >
            {unlocked ? `${todayAdherence}%` : "🔒"}
          </div>
          <div>
            <h4 style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>Today's Pill Adherence</h4>
            <p style={{ fontSize: "1.05rem", fontWeight: "bold" }}>
              {unlocked ? `${takenTodayCount} of ${totalProfileMeds} Doses Recorded` : "🔒 Profile Locked"}
            </p>
          </div>
        </div>

        {/* Card 2: Latest Glucose */}
        <div className="glass-card" style={{ padding: "16px", display: "flex", alignItems: "center", gap: "14px" }}>
          <div style={{ width: "46px", height: "46px", borderRadius: "12px", background: "rgba(59, 130, 246, 0.2)", display: "flex", alignItems: "center", justifyContent: "center", color: "#3b82f6", fontWeight: "bold", fontSize: "1.1rem" }}>
            🩸
          </div>
          <div>
            <h4 style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>Latest Blood Sugar</h4>
            <p style={{ fontSize: "1.05rem", fontWeight: "bold" }}>
              {unlocked ? (latestGlucose ? `${latestGlucose.value} mg/dL` : "No log today") : "🔒 Profile Locked"}
            </p>
          </div>
        </div>

        {/* Card 3: Latest BP */}
        <div className="glass-card" style={{ padding: "16px", display: "flex", alignItems: "center", gap: "14px" }}>
          <div style={{ width: "46px", height: "46px", borderRadius: "12px", background: "rgba(239, 68, 68, 0.2)", display: "flex", alignItems: "center", justifyContent: "center", color: "#ef4444", fontWeight: "bold", fontSize: "1.1rem" }}>
            ❤️
          </div>
          <div>
            <h4 style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>Latest Blood Pressure</h4>
            <p style={{ fontSize: "1.05rem", fontWeight: "bold" }}>
              {unlocked ? (latestBP ? `${latestBP.systolic}/${latestBP.diastolic} mmHg` : "No log today") : "🔒 Profile Locked"}
            </p>
          </div>
        </div>

        {/* Card 4: Water Intake Progress */}
        <div className="glass-card" style={{ padding: "16px", display: "flex", alignItems: "center", gap: "14px" }}>
          <div style={{ width: "46px", height: "46px", borderRadius: "12px", background: "rgba(59, 130, 246, 0.15)", display: "flex", alignItems: "center", justifyContent: "center", color: "#60a5fa", fontWeight: "bold", fontSize: "1.1rem" }}>
            💧
          </div>
          <div>
            <h4 style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>Today's Water Intake</h4>
            <p style={{ fontSize: "1.05rem", fontWeight: "bold" }}>
              {unlocked ? `${profileWaterToday} ml (${waterProgressPercent}%)` : "🔒 Profile Locked"}
            </p>
          </div>
        </div>

      </div>

      {/* Main Navigation Bar */}
      <Navigation activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Active Tab View Rendering Protected by Privacy Lock Gate */}
      <PrivacyLockGate profile={currentProfile}>
        {activeTab === "vitals" && <VitalsTracker />}
        {activeTab === "medications" && <MedicationTracker />}
        {activeTab === "water" && <WaterTracker />}
        {activeTab === "calendar" && <MedicationCalendar />}
        {activeTab === "reports" && <ReportsManager />}
      </PrivacyLockGate>

      {/* Modals */}
      {showProfileModal && <ProfileModal onClose={() => setShowProfileModal(false)} />}

      {/* Floating Toast Notification Container */}
      <ToastContainer />
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <DashboardContent />
    </AppProvider>
  );
}

import React, { useState } from "react";
import { AppProvider, useApp } from "./context/AppContext";
import { Header } from "./components/Header";
import { Navigation } from "./components/Navigation";
import type { NavTab } from "./components/Navigation";
import { VitalsTracker } from "./components/VitalsTracker";
import { MedicationTracker } from "./components/MedicationTracker";
import { MedicationCalendar } from "./components/MedicationCalendar";
import { ReportsManager } from "./components/ReportsManager";
import { ProfileModal } from "./components/ProfileModal";
import { ToastContainer } from "./components/ToastContainer";
import { APP_CONFIG } from "./config/app.config";

const DashboardContent: React.FC = () => {
  const [activeTab, setActiveTab] = useState<NavTab>("vitals");
  const [showProfileModal, setShowProfileModal] = useState<boolean>(false);

  const { activeProfile, glucoseLogs, bpLogs, medicationLogs, medications } = useApp();

  const currentProfile = activeProfile || (APP_CONFIG.defaultProfiles[0] as any);

  // Calculate top KPI statistics for current active profile
  const profileGlucose = glucoseLogs.filter(g => g.profileId === currentProfile.id);
  const profileBP = bpLogs.filter(b => b.profileId === currentProfile.id);
  const profileMeds = medications.filter(m => m.profileId === currentProfile.id);

  const latestGlucose = profileGlucose.length > 0 ? profileGlucose[0] : null;
  const latestBP = profileBP.length > 0 ? profileBP[0] : null;

  const todayStr = new Date().toISOString().split("T")[0];
  const logsToday = medicationLogs.filter(l => l.profileId === currentProfile.id && l.timestamp.startsWith(todayStr));
  const takenTodayCount = logsToday.filter(l => l.status === "taken").length;
  const totalProfileMeds = profileMeds.length;
  const todayAdherence = totalProfileMeds > 0 ? Math.round((takenTodayCount / totalProfileMeds) * 100) : 0;

  return (
    <div className="app-container">
      {/* Header */}
      <Header onOpenProfileModal={() => setShowProfileModal(true)} />

      {/* Top Overview KPI Quick Cards */}
      <div className="grid-3" style={{ marginBottom: "20px" }}>
        
        {/* Card 1: Today's Adherence */}
        <div className="glass-card" style={{ padding: "16px", display: "flex", alignItems: "center", gap: "14px" }}>
          <div 
            style={{ 
              minWidth: "60px", 
              height: "46px", 
              padding: "0 10px", 
              borderRadius: "12px", 
              background: todayAdherence > 0 ? "rgba(16, 185, 129, 0.2)" : "rgba(100, 116, 139, 0.2)", 
              display: "flex", 
              alignItems: "center", 
              justifyContent: "center", 
              color: todayAdherence > 0 ? "#10b981" : "#94a3b8", 
              fontWeight: "bold", 
              fontSize: "0.95rem",
              whiteSpace: "nowrap"
            }}
          >
            {todayAdherence}%
          </div>
          <div>
            <h4 style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>Today's Pill Adherence</h4>
            <p style={{ fontSize: "1.05rem", fontWeight: "bold" }}>
              {takenTodayCount} of {totalProfileMeds} Doses Recorded
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
              {latestGlucose ? `${latestGlucose.value} mg/dL` : "No log today"}
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
              {latestBP ? `${latestBP.systolic}/${latestBP.diastolic} mmHg` : "No log today"}
            </p>
          </div>
        </div>

      </div>

      {/* Main Navigation Bar */}
      <Navigation activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Active Tab View Rendering */}
      {activeTab === "vitals" && <VitalsTracker />}
      {activeTab === "medications" && <MedicationTracker />}
      {activeTab === "calendar" && <MedicationCalendar />}
      {activeTab === "reports" && <ReportsManager />}

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

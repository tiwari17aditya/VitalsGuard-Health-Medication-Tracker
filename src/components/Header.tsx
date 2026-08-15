import React, { useState } from "react";
import { BookOpen, Heart, Users, AlertTriangle, ShieldCheck, 
  Phone, CheckCircle2, WifiOff, Lock, Unlock, KeyRound, Shield, Wrench, RotateCcw
} from "lucide-react";
import { useApp } from "../context/AppContext";
import { APP_CONFIG } from "../config/app.config";
import { AdminAuthModal } from "./AdminAuthModal";
import { ChangePinModal } from "./ChangePinModal";
import { UserGuideModal } from "./UserGuideModal";
import type { NavTab } from "./Navigation";

interface HeaderProps {
  onOpenProfileModal?: () => void;
  activeTab: NavTab;
  setActiveTab: (tab: NavTab) => void;
}

export const Header: React.FC<HeaderProps> = ({ activeTab, setActiveTab }) => {
  const { 
    profiles, 
    activeProfile, 
    setActiveProfileId, 
    addOrUpdateProfile,
    isOffline, 
    isSupabaseActive, 
    medications,
    isLoading,
    refreshAllData
  } = useApp();

  const [showChangePinModal, setShowChangePinModal] = useState<boolean>(false);
  const [showUserGuideModal, setShowUserGuideModal] = useState<boolean>(false);
  const [pendingLockProfileId, setPendingLockProfileId] = useState<string | null>(null);

  const isAdminProfile = activeProfile?.id === "admin" && sessionStorage.getItem("vitalsguard_unlocked_admin") === "true";

  // Filter low stock meds ONLY for current active user profile
  const profileLowStockMeds = medications.filter(
    m => m.profileId === activeProfile?.id && m.stockCount <= m.minStockAlert
  );

  const handleProfileSelectChange = (profileId: string) => {
    if (profileId === activeProfile?.id) return;
    const targetProf = profiles.find(p => p.id === profileId);
    if (targetProf?.isLocked) {
      setPendingLockProfileId(profileId);
    } else {
      setActiveProfileId(profileId);
    }
  };

  const handleToggleActiveProfileLock = async () => {
    if (!activeProfile) return;
    const newLockState = !activeProfile.isLocked;
    if (newLockState) {
      sessionStorage.removeItem(`vitalsguard_unlocked_${activeProfile.id}`);
    }
    await addOrUpdateProfile({
      ...activeProfile,
      isLocked: newLockState
    });
  };

  const pendingProfileObj = profiles.find(p => p.id === pendingLockProfileId);

  return (
    <header 
      className="glass-card" 
      style={{ 
        marginBottom: "16px", 
        padding: "14px",
        borderTop: activeProfile?.id === "admin" ? "3px solid #dc2626" : "1px solid var(--border-color)",
        boxShadow: activeProfile?.id === "admin" ? "0 4px 20px rgba(220, 38, 38, 0.15)" : "none",
        transition: "all 0.3s ease"
      }}
    >
      <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", gap: "12px" }}>
        
        {/* Logo, Branding & Admin Tabs */}
        <div style={{ display: "flex", alignItems: "center", gap: "16px", flexWrap: "wrap" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div style={{
              width: "38px",
              height: "38px",
              borderRadius: "10px",
              background: activeProfile?.id === "admin" ? "linear-gradient(135deg, #dc2626, #f59e0b)" : "linear-gradient(135deg, #ef4444, #3b82f6)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#ffffff",
              boxShadow: activeProfile?.id === "admin" ? "0 4px 10px rgba(220, 38, 38, 0.4)" : "0 4px 10px rgba(239, 68, 68, 0.3)",
              flexShrink: 0,
              transition: "all 0.3s ease"
            }}>
              <Heart size={22} fill="white" />
            </div>
            <div>
              <h1 style={{ fontSize: "1.2rem", display: "flex", alignItems: "center", gap: "6px", margin: 0 }}>
                {APP_CONFIG.meta.appName}
              </h1>
              <p style={{ fontSize: "0.775rem", color: "var(--text-secondary)", margin: 0 }}>
                {APP_CONFIG.meta.tagline}
              </p>
            </div>
          </div>

          {/* Admin/Developer navigation tabs beside title */}
          {isAdminProfile && (
            <div style={{ display: "flex", gap: "8px", marginLeft: "10px" }}>
              <button
                onClick={() => setActiveTab("admin")}
                className={`btn btn-sm ${activeTab === "admin" ? "btn-primary" : "btn-secondary"}`}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  fontSize: "0.8rem",
                  padding: "6px 12px",
                  borderRadius: "8px",
                  boxShadow: activeTab === "admin" ? "0 2px 8px rgba(220, 38, 38, 0.4)" : "none",
                  border: activeTab === "admin" ? "1px solid #dc2626" : "1px solid var(--border-color)",
                  background: activeTab === "admin" ? "#dc2626" : "transparent",
                  color: activeTab === "admin" ? "#ffffff" : "var(--text-primary)"
                }}
              >
                <Shield size={14} /> Admin Panel
              </button>
              <button
                onClick={() => setActiveTab("developer")}
                className={`btn btn-sm ${activeTab === "developer" ? "btn-primary" : "btn-secondary"}`}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  fontSize: "0.8rem",
                  padding: "6px 12px",
                  borderRadius: "8px",
                  boxShadow: activeTab === "developer" ? "0 2px 8px rgba(245, 158, 11, 0.4)" : "none",
                  border: activeTab === "developer" ? "1px solid #f59e0b" : "1px solid var(--border-color)",
                  background: activeTab === "developer" ? "#f59e0b" : "transparent",
                  color: activeTab === "developer" ? "#ffffff" : "var(--text-primary)"
                }}
              >
                <Wrench size={14} /> Developer Settings
              </button>
            </div>
          )}
        </div>

        {/* User Profiles Switcher & Status Badges */}
        <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "8px", width: "100%", maxWidth: "100%", marginTop: "4px" }}>
          
          {/* Profile Selector with Lock/Unlock Status */}
          <div 
            style={{ 
               display: "flex", 
               alignItems: "center", 
               gap: "6px", 
               background: activeProfile?.id === "admin" ? "rgba(220, 38, 38, 0.08)" : "var(--bg-primary)", 
               padding: "4px 8px", 
               borderRadius: "var(--radius-full)", 
               border: activeProfile?.id === "admin" ? "1.5px solid #dc2626" : "1px solid var(--border-color)", 
               boxShadow: activeProfile?.id === "admin" ? "0 0 10px rgba(220, 38, 38, 0.1)" : "none",
               flex: "1 1 auto",
               transition: "all 0.3s ease"
             }}
          >
            <Users size={16} color="var(--primary)" />
            <select
              id="header-profile-select"
              value={activeProfile?.id || ""}
              onChange={(e) => handleProfileSelectChange(e.target.value)}
              style={{
                background: "transparent",
                border: "none",
                color: "var(--text-primary)",
                fontWeight: "600",
                fontSize: "0.875rem",
                outline: "none",
                cursor: "pointer",
                maxWidth: "150px",
                textOverflow: "ellipsis"
              }}
            >
              {profiles.map(p => (
                <option key={p.id} value={p.id} style={{ background: "var(--bg-card)", color: "var(--text-primary)" }}>
                  {p.isLocked ? "🔒 " : "🔓 "}{p.name}
                </option>
              ))}
            </select>
            {activeProfile?.isLocked ? (
              <span style={{ fontSize: "0.75rem", color: "#f59e0b", display: "flex", alignItems: "center", gap: "2px" }} title="Profile Locked">
                <Lock size={12} />
              </span>
            ) : (
              <span style={{ fontSize: "0.75rem", color: "#10b981", display: "flex", alignItems: "center", gap: "2px" }} title="Profile Unlocked">
                <Unlock size={12} />
              </span>
            )}
          </div>

          {/* Quick Lock / Unlock Toggle Button */}
          {activeProfile && (
            <button
              id="header-toggle-lock-btn"
              onClick={handleToggleActiveProfileLock}
              className="btn btn-secondary btn-sm"
              style={{
                padding: "4px 8px",
                fontSize: "0.775rem",
                minHeight: "32px",
                color: activeProfile.isLocked ? "#f59e0b" : "#10b981",
                borderColor: activeProfile.isLocked ? "rgba(245, 158, 11, 0.4)" : "rgba(16, 185, 129, 0.4)"
              }}
              title={activeProfile.isLocked ? "Click to Unlock Profile Data Visibility" : "Click to Lock Profile Data Privacy"}
            >
              {activeProfile.isLocked ? <><Lock size={13} /> Locked</> : <><Unlock size={13} /> Unlocked</>}
            </button>
          )}

          {/* Change PIN Button */}
          {activeProfile && (
            <button
              id="header-change-pin-btn"
              onClick={() => setShowChangePinModal(true)}
              className="btn btn-secondary btn-sm"
              style={{ padding: "4px 10px", fontSize: "0.775rem", minHeight: "32px" }}
              title={`Change Password for ${activeProfile.name}`}
            >
              <KeyRound size={13} /> Change Password
            </button>
          )}

          {/* Manual Refresh Data Button with Spinner */}
          <button
            id="header-refresh-data-btn"
            onClick={refreshAllData}
            disabled={isLoading}
            className="btn btn-secondary btn-sm"
            style={{ padding: "4px 10px", fontSize: "0.775rem", minHeight: "32px", borderColor: "rgba(59, 130, 246, 0.4)", color: "var(--primary)" }}
            title="Refresh & Sync latest data from database"
          >
            <RotateCcw size={13} className={isLoading ? "spin" : ""} /> {isLoading ? "Syncing..." : "Refresh Data"}
          </button>

          {/* User Guide & Help Documentation Button */}
          <button
            id="header-user-guide-btn"
            onClick={() => setShowUserGuideModal(true)}
            className="btn btn-secondary btn-sm"
            style={{ padding: "4px 10px", fontSize: "0.775rem", minHeight: "32px", borderColor: "rgba(59, 130, 246, 0.4)", color: "var(--primary)" }}
            title="Open User Guide & Documentation"
          >
            <BookOpen size={13} /> User Guide
          </button>

          {/* Emergency Doctor Call Button */}
          {activeProfile?.emergencyContact && (
            <a
              id="header-emergency-call-btn"
              href={`tel:${activeProfile.emergencyContact}`}
              className="badge badge-danger"
              style={{ textDecoration: "none", cursor: "pointer", padding: "6px 10px", fontSize: "0.775rem" }}
              title={`Call Emergency: ${activeProfile.emergencyContact}`}
            >
              <Phone size={12} /> Call Dr
            </a>
          )}

          {/* Low Stock Warning Counter Pill */}
          {profileLowStockMeds.length > 0 && (
            <span className="badge badge-warning" style={{ fontSize: "0.775rem", padding: "6px 10px" }} title={`${profileLowStockMeds.length} medications require refill`}>
              <AlertTriangle size={12} /> {profileLowStockMeds.length} Low Stock
            </span>
          )}

          {/* Database / Connection Status Pill (Visible ONLY to Aditya / Admin) */}
          {isAdminProfile && (
            isOffline ? (
              <span className="badge badge-warning" style={{ fontSize: "0.775rem", padding: "6px 10px" }}>
                <WifiOff size={12} /> Offline
              </span>
            ) : isSupabaseActive ? (
              <span className="badge badge-success" style={{ fontSize: "0.775rem", padding: "6px 10px" }}>
                <ShieldCheck size={12} /> Supabase Live
              </span>
            ) : (
              <span className="badge badge-primary" style={{ fontSize: "0.775rem", padding: "6px 10px" }}>
                <CheckCircle2 size={12} /> Local Storage
              </span>
            )
          )}

        </div>

      </div>

      {/* Profile Switch Lock Verification Gate */}
      {pendingLockProfileId && (
        <AdminAuthModal
          onSuccess={() => {
            if (pendingLockProfileId) {
              sessionStorage.setItem(`vitalsguard_unlocked_${pendingLockProfileId}`, "true");
              setActiveProfileId(pendingLockProfileId);
            }
            setPendingLockProfileId(null);
          }}
          onClose={() => setPendingLockProfileId(null)}
          authMode="user"
          targetProfileName={pendingProfileObj?.name}
          targetProfileId={pendingProfileObj?.id}
          title={`Unlock ${pendingProfileObj?.name || "Profile"}`}
          expectedPin={pendingProfileObj?.pin || "1234"}
          subtitle={`Enter ${pendingProfileObj?.name || "Profile"}'s User Password to switch.`}
        />
      )}

      {/* Change PIN Modal */}
      {showChangePinModal && activeProfile && (
        <ChangePinModal
          profile={activeProfile}
          onClose={() => setShowChangePinModal(false)}
        />
      )}

      {/* User Guide & Documentation Modal */}
      {showUserGuideModal && (
        <UserGuideModal onClose={() => setShowUserGuideModal(false)} />
      )}

    </header>
  );
};


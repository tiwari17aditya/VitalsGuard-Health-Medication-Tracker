import React, { useState } from "react";
import { 
  Heart, Users, AlertTriangle, ShieldCheck, 
  Phone, CheckCircle2, WifiOff, Wrench, Lock, Unlock, KeyRound
} from "lucide-react";
import { useApp } from "../context/AppContext";
import { APP_CONFIG } from "../config/app.config";
import { AdminAuthModal } from "./AdminAuthModal";
import { DeveloperModal } from "./DeveloperModal";
import { ChangePinModal } from "./ChangePinModal";

interface HeaderProps {
  onOpenProfileModal?: () => void;
}

export const Header: React.FC<HeaderProps> = () => {
  const { 
    profiles, 
    activeProfile, 
    setActiveProfileId, 
    addOrUpdateProfile,
    isOffline, 
    isSupabaseActive, 
    medications
  } = useApp();

  const [showAuthModal, setShowAuthModal] = useState<boolean>(false);
  const [showDevModal, setShowDevModal] = useState<boolean>(false);
  const [showChangePinModal, setShowChangePinModal] = useState<boolean>(false);
  const [pendingLockProfileId, setPendingLockProfileId] = useState<string | null>(null);

  // Filter low stock meds ONLY for current active user profile
  const profileLowStockMeds = medications.filter(
    m => m.profileId === activeProfile?.id && m.stockCount <= m.minStockAlert
  );

  const isAdminAuthed = () => sessionStorage.getItem("vitalsguard_admin_authed") === "true";

  const handleProfileSelectChange = (profileId: string) => {
    const targetProf = profiles.find(p => p.id === profileId);
    const isProfileUnlockedSession = sessionStorage.getItem(`vitalsguard_unlocked_${profileId}`) === "true";
    if (targetProf?.isLocked && !isAdminAuthed() && !isProfileUnlockedSession) {
      setPendingLockProfileId(profileId);
    } else {
      setActiveProfileId(profileId);
    }
  };

  const handleToggleActiveProfileLock = async () => {
    if (!activeProfile) return;
    const newLockState = !activeProfile.isLocked;
    await addOrUpdateProfile({
      ...activeProfile,
      isLocked: newLockState
    });
  };

  const handleDeveloperClick = () => {
    if (isAdminAuthed()) {
      setShowDevModal(true);
    } else {
      setShowAuthModal(true);
    }
  };

  const handleAuthSuccess = () => {
    setShowAuthModal(false);
    setShowDevModal(true);
  };

  const pendingProfileObj = profiles.find(p => p.id === pendingLockProfileId);

  return (
    <header className="glass-card" style={{ marginBottom: "16px", padding: "14px" }}>
      <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", gap: "12px" }}>
        
        {/* Logo & Branding */}
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div style={{
            width: "38px",
            height: "38px",
            borderRadius: "10px",
            background: "linear-gradient(135deg, #ef4444, #3b82f6)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#ffffff",
            boxShadow: "0 4px 10px rgba(239, 68, 68, 0.3)",
            flexShrink: 0
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

        {/* User Profiles Switcher & Status Badges */}
        <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "8px", width: "100%", maxWidth: "100%", marginTop: "4px" }}>
          
          {/* Profile Selector with Lock/Unlock Status */}
          <div style={{ display: "flex", alignItems: "center", gap: "6px", background: "var(--bg-primary)", padding: "4px 8px", borderRadius: "var(--radius-full)", border: "1px solid var(--border-color)", flex: "1 1 auto" }}>
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
              title={`Change PIN / Password for ${activeProfile.name}`}
            >
              <KeyRound size={13} /> Change PIN
            </button>
          )}

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

          {/* Database / Connection Status Pill */}
          {isOffline ? (
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
          )}

          {/* Developer Settings Button */}
          <button
            id="header-dev-settings-btn"
            onClick={handleDeveloperClick}
            className="btn btn-secondary btn-sm"
            style={{ padding: "4px 10px", fontSize: "0.775rem", minHeight: "32px" }}
            title="Developer Settings Hub"
          >
            <Wrench size={13} /> Developer Settings
          </button>

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
          title={`Unlock ${pendingProfileObj?.name || "Profile"}`}
          expectedPin={pendingProfileObj?.pin || "1234"}
          subtitle={`Enter ${pendingProfileObj?.name || "Profile"}'s PIN (default: 1234) or Admin Passcode to switch.`}
        />
      )}

      {/* Developer Passcode Authentication Modal */}
      {showAuthModal && (
        <AdminAuthModal
          onSuccess={handleAuthSuccess}
          onClose={() => setShowAuthModal(false)}
          title="Developer Passcode Required"
        />
      )}

      {/* Developer Settings Hub Modal */}
      {showDevModal && (
        <DeveloperModal onClose={() => setShowDevModal(false)} />
      )}

      {/* Change PIN Modal */}
      {showChangePinModal && activeProfile && (
        <ChangePinModal
          profile={activeProfile}
          onClose={() => setShowChangePinModal(false)}
        />
      )}

    </header>
  );
};


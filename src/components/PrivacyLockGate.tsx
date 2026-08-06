import React, { useState, useEffect } from "react";
import { Lock, KeyRound } from "lucide-react";
import type { UserProfile } from "../types";
import { AdminAuthModal } from "./AdminAuthModal";

interface PrivacyLockGateProps {
  profile: UserProfile | null;
  children: React.ReactNode;
}

export const PrivacyLockGate: React.FC<PrivacyLockGateProps> = ({ profile, children }) => {
  const [isUnlocked, setIsUnlocked] = useState<boolean>(false);
  const [showAuthModal, setShowAuthModal] = useState<boolean>(false);

  useEffect(() => {
    if (!profile) {
      setIsUnlocked(true);
      return;
    }

    if (!profile.isLocked) {
      setIsUnlocked(true);
      return;
    }

    // Check if session is unlocked specifically for this profile
    const profileUnlocked = sessionStorage.getItem(`vitalsguard_unlocked_${profile.id}`) === "true";

    if (profileUnlocked) {
      setIsUnlocked(true);
    } else {
      setIsUnlocked(false);
    }
  }, [profile]);

  const handleAuthSuccess = () => {
    if (profile) {
      sessionStorage.setItem(`vitalsguard_unlocked_${profile.id}`, "true");
    }
    setShowAuthModal(false);
    setIsUnlocked(true);
  };

  if (!profile || !profile.isLocked || isUnlocked) {
    return <>{children}</>;
  }

  return (
    <div className="glass-card" style={{ padding: "40px 20px", textAlign: "center", margin: "20px 0" }}>
      <div style={{
        width: "70px",
        height: "70px",
        borderRadius: "20px",
        background: "rgba(245, 158, 11, 0.15)",
        color: "#f59e0b",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        margin: "0 auto 20px auto",
        boxShadow: "0 8px 20px rgba(245, 158, 11, 0.2)"
      }}>
        <Lock size={36} />
      </div>

      <h2 style={{ fontSize: "1.4rem", color: "var(--text-primary)", marginBottom: "8px" }}>
        🔒 Health Dashboard Locked
      </h2>

      <p style={{ color: "var(--text-secondary)", fontSize: "0.95rem", maxWidth: "460px", margin: "0 auto 24px auto", lineHeight: "1.5" }}>
        Health records, vitals readings, pill inventories, and hydration logs for <strong>{profile.name}</strong> are private and protected.
      </p>

      <div style={{ display: "flex", justifyContent: "center", gap: "12px", flexWrap: "wrap" }}>
        <button
          onClick={() => setShowAuthModal(true)}
          className="btn btn-primary"
          style={{ padding: "10px 24px", fontSize: "0.95rem", display: "flex", alignItems: "center", gap: "8px" }}
        >
          <KeyRound size={18} /> Enter Passcode to Unlock ({profile.name})
        </button>
      </div>

      {showAuthModal && (
        <AdminAuthModal
          onSuccess={handleAuthSuccess}
          onClose={() => setShowAuthModal(false)}
          title={`Unlock Health Records for ${profile.name}`}
          expectedPin={profile.pin || "1234"}
          subtitle={`Enter ${profile.name}'s PIN or Admin Passcode.`}
        />
      )}
    </div>
  );
};

import React, { useState } from "react";
import { KeyRound, ShieldCheck, AlertCircle, CheckCircle2, Lock, RotateCcw } from "lucide-react";
import type { UserProfile } from "../types";
import { useApp } from "../context/AppContext";
import { APP_CONFIG } from "../config/app.config";
import { verifyPIIPin, encryptPII } from "../utils/piiSecurity";

interface ChangePinModalProps {
  profile: UserProfile;
  onClose: () => void;
  onSuccess?: () => void;
}

export const ChangePinModal: React.FC<ChangePinModalProps> = ({ profile, onClose, onSuccess }) => {
  const { addOrUpdateProfile, showToast, logUserAction, updateAdminPasscode } = useApp();

  const [currentPin, setCurrentPin] = useState<string>("");
  const [newPin, setNewPin] = useState<string>("");
  const [confirmPin, setConfirmPin] = useState<string>("");
  const [errorMsg, setErrorMsg] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const masterAdminPin = localStorage.getItem("vitalsguard_admin_pin") || APP_CONFIG.security.adminPasscode;
  const existingProfilePin = profile.pin || "1234";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    const currInput = currentPin.trim();
    const newPinInput = newPin.trim();
    const confirmInput = confirmPin.trim();

    // 1. Verify Current PIN or Master Admin PIN using PII verification
    const isCurrentValid = verifyPIIPin(currInput, existingProfilePin, masterAdminPin);
    if (!isCurrentValid) {
      setErrorMsg("Current Password is incorrect! Please enter your existing User Password or the Admin Password.");
      return;
    }

    // 2. Validate New PIN format (minimum 4 chars/digits)
    if (newPinInput.length < 4) {
      setErrorMsg("New Password must be at least 4 characters long.");
      return;
    }

    // 3. Validate PIN Confirmation Match
    if (newPinInput !== confirmInput) {
      setErrorMsg("New Password and Confirm Password do not match! Please check and try again.");
      return;
    }

    setIsSubmitting(true);
    try {
      // Update profile with PII encrypted new PIN
      const encryptedNewPin = encryptPII(newPinInput);
      const updatedProfile: UserProfile = {
        ...profile,
        pin: encryptedNewPin
      };

      await addOrUpdateProfile(updatedProfile);

      // Synchronize with admin passcode if this is the ADMIN profile
      if (profile.id === "admin") {
        await updateAdminPasscode(newPinInput);
      }

      // Keep current profile session authenticated
      sessionStorage.setItem(`vitalsguard_unlocked_${profile.id}`, "true");

      logUserAction("PROFILE_UPDATED", `Updated password for profile: ${profile.name}`);
      showToast("success", "Password Changed Successfully", `Password for ${profile.name} has been updated.`);

      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      console.error("Error updating profile password:", err);
      setErrorMsg("Failed to update password. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetToDefaultPin = async () => {
    setIsSubmitting(true);
    try {
      const defaultEncryptedPin = encryptPII("1234");
      const updatedProfile: UserProfile = {
        ...profile,
        pin: defaultEncryptedPin
      };
      await addOrUpdateProfile(updatedProfile);

      // Synchronize with admin passcode if this is the ADMIN profile
      if (profile.id === "admin") {
        await updateAdminPasscode("1234");
      }

      sessionStorage.setItem(`vitalsguard_unlocked_${profile.id}`, "true");
      logUserAction("PROFILE_UPDATED", `Reset password to default (1234) for profile: ${profile.name}`);
      showToast("success", "Password Reset to Default (1234)", `Password for ${profile.name} has been reset to 1234. Current password set to 1234.`);
      setCurrentPin("1234");
      setErrorMsg("");
      if (onSuccess) onSuccess();
    } catch (err) {
      console.error("Error resetting password:", err);
      setErrorMsg("Failed to reset password to default.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose} id="change-pin-modal-overlay">
      <div className="modal-content" style={{ maxWidth: "440px" }} onClick={e => e.stopPropagation()}>
        
        <div style={{ textAlign: "center", marginBottom: "20px" }}>
          <div style={{
            width: "56px",
            height: "56px",
            borderRadius: "50%",
            background: "rgba(59, 130, 246, 0.15)",
            color: "#3b82f6",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: "12px",
            boxShadow: "0 4px 14px rgba(59, 130, 246, 0.2)"
          }}>
            <KeyRound size={28} />
          </div>
          <h2 style={{ fontSize: "1.3rem" }}>Change Password ({profile.name})</h2>
          <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", marginTop: "4px" }}>
            Set a new password to lock and secure access to <strong>{profile.name}</strong>'s health records.
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Current PIN Input */}
          <div className="form-group">
            <label className="form-label" htmlFor="change-pin-current" style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <Lock size={14} /> Current Password / Admin Password
            </label>
            <input
              id="change-pin-current"
              type="password"
              placeholder="Enter current password (default: 1234)"
              value={currentPin}
              onChange={(e) => { setCurrentPin(e.target.value); setErrorMsg(""); }}
              className="form-input"
              autoFocus
              required
            />
          </div>

          {/* New PIN Input */}
          <div className="form-group">
            <label className="form-label" htmlFor="change-pin-new" style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <KeyRound size={14} /> New Password
            </label>
            <input
              id="change-pin-new"
              type="password"
              placeholder="Enter new password (e.g. 5678)"
              value={newPin}
              onChange={(e) => { setNewPin(e.target.value); setErrorMsg(""); }}
              className="form-input"
              required
            />
          </div>

          {/* Confirm New PIN Input */}
          <div className="form-group">
            <label className="form-label" htmlFor="change-pin-confirm" style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <CheckCircle2 size={14} /> Confirm New Password
            </label>
            <input
              id="change-pin-confirm"
              type="password"
              placeholder="Re-enter new password to confirm"
              value={confirmPin}
              onChange={(e) => { setConfirmPin(e.target.value); setErrorMsg(""); }}
              className="form-input"
              required
            />
          </div>

          {/* Error Message Alert */}
          {errorMsg && (
            <div style={{
              display: "flex",
              alignItems: "flex-start",
              gap: "8px",
              color: "#ef4444",
              background: "rgba(239, 68, 68, 0.1)",
              padding: "10px 12px",
              borderRadius: "8px",
              fontSize: "0.825rem",
              marginBottom: "16px",
              border: "1px solid rgba(239, 68, 68, 0.2)"
            }}>
              <AlertCircle size={16} style={{ flexShrink: 0, marginTop: "2px" }} />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Action Buttons */}
          <div style={{ display: "flex", gap: "10px", marginTop: "20px" }}>
            <button
              id="change-pin-submit-btn"
              type="submit"
              className="btn btn-primary"
              disabled={isSubmitting}
              style={{ flex: 1 }}
            >
              <ShieldCheck size={18} /> {isSubmitting ? "Updating Password..." : "Save New Password"}
            </button>
            <button
              id="change-pin-cancel-btn"
              type="button"
              onClick={onClose}
              className="btn btn-secondary"
              disabled={isSubmitting}
            >
              Cancel
            </button>
          </div>

          <button
            id="change-pin-reset-default-btn"
            type="button"
            onClick={handleResetToDefaultPin}
            className="btn btn-secondary btn-sm"
            disabled={isSubmitting}
            style={{ width: "100%", justifyContent: "center", marginTop: "10px", color: "#f59e0b", borderColor: "rgba(245, 158, 11, 0.4)" }}
          >
            <RotateCcw size={14} /> Reset Password to Default (1234)
          </button>
        </form>

        <div style={{ textAlign: "center", marginTop: "16px", fontSize: "0.775rem", color: "var(--text-muted)" }}>
          💡 Default password is <code>1234</code>. You can also use the Admin Password if forgotten.
        </div>

      </div>
    </div>
  );
};

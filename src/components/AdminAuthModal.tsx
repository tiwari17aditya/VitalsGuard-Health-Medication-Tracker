import React, { useState } from "react";
import { Lock, Key, ShieldCheck, AlertCircle, RotateCcw } from "lucide-react";
import { APP_CONFIG } from "../config/app.config";
import { verifyPIIPin, encryptPII } from "../utils/piiSecurity";
import { useApp } from "../context/AppContext";

export interface AdminAuthModalProps {
  onSuccess: () => void;
  onClose: () => void;
  title?: string;
  expectedPin?: string;
  subtitle?: string;
  isMasterOnly?: boolean;
  authMode?: "admin" | "user" | "delete_log" | "either";
  targetProfileName?: string;
  targetProfileId?: string;
}

export const AdminAuthModal: React.FC<AdminAuthModalProps> = ({
  onSuccess,
  onClose,
  title,
  expectedPin,
  subtitle,
  isMasterOnly = false,
  authMode,
  targetProfileName,
  targetProfileId
}) => {
  const { activeProfile, profiles, addOrUpdateProfile, updateAdminPasscode, showToast } = useApp();
  const [pinInput, setPinInput] = useState<string>("");
  const [errorMsg, setErrorMsg] = useState<string>("");
  const [resetMessage, setResetMessage] = useState<string>("");

  // Determine effective mode
  const mode = authMode || (isMasterOnly ? "admin" : (expectedPin ? "user" : "either"));

  // Custom UI content based on mode
  let defaultTitle = "Passcode Verification Required";
  let defaultSubtitle = "Authorization Required: Enter password to proceed.";
  let labelText = "Password";
  let placeholderText = "Enter Password";
  let defaultErrorMsg = "Incorrect Password! Please try again.";

  if (mode === "admin") {
    defaultTitle = "Admin Password Verification Required";
    defaultSubtitle = "Restricted Admin Action: Enter Admin Password to proceed.";
    labelText = "Admin Password";
    placeholderText = "Enter Admin Password";
    defaultErrorMsg = "Incorrect Admin Password! Please try again.";
  } else if (mode === "user") {
    defaultTitle = "User Password Verification Required";
    const nameStr = targetProfileName || activeProfile?.name || "User";
    defaultSubtitle = `Enter ${nameStr}'s User Password (default: 1234) to proceed.`;
    labelText = "User Password";
    placeholderText = "Enter User Password";
    defaultErrorMsg = "Incorrect User Password! Please enter the correct User Password.";
  } else {
    // delete_log or either
    defaultTitle = "Password Verification Required";
    defaultSubtitle = "Deletion Authorization: Enter User Password or Admin Password to proceed.";
    labelText = "Password (User or Admin)";
    placeholderText = "Enter User or Admin Password";
    defaultErrorMsg = "Incorrect Password! Please enter the correct User Password or Admin Password.";
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const input = pinInput.trim();

    const adminProfile = profiles.find(p => p.id === "admin");
    const savedAdminPin = localStorage.getItem("vitalsguard_admin_pin") || APP_CONFIG.security.adminPasscode;

    // Check if input matches ANY valid Admin Password (plaintext, default 1234, or encrypted admin profile PIN)
    const isAdminValid =
      input === savedAdminPin ||
      input === APP_CONFIG.security.adminPasscode ||
      (adminProfile?.pin ? verifyPIIPin(input, adminProfile.pin, savedAdminPin) : false) ||
      verifyPIIPin(input, savedAdminPin, savedAdminPin);

    const targetPin = expectedPin || activeProfile?.pin || "1234";
    const isUserValid = verifyPIIPin(input, targetPin, savedAdminPin);

    let isValid = false;
    if (mode === "admin") {
      isValid = isAdminValid;
    } else if (mode === "user") {
      isValid = isUserValid || isAdminValid;
    } else {
      // delete_log or either: accepts EITHER Admin password OR User password!
      isValid = isAdminValid || isUserValid;
    }

    if (isValid) {
      onSuccess();
    } else {
      setErrorMsg(defaultErrorMsg);
    }
  };

  const handleResetPasswordToDefault = async () => {
    try {
      if (mode === "admin") {
        await updateAdminPasscode("1234");
        const adminProfile = profiles.find(p => p.id === "admin");
        if (adminProfile) {
          await addOrUpdateProfile({ ...adminProfile, pin: encryptPII("1234") });
        }
        setPinInput("1234");
        setErrorMsg("");
        setResetMessage("Admin password reset to default 1234! Click Unlock to continue.");
        showToast("success", "Admin Password Reset", "Admin password reset to default 1234.");
      } else {
        // Reset target or active user profile PIN to 1234
        const target = (targetProfileId ? profiles.find(p => p.id === targetProfileId) : null) || activeProfile || profiles.find(p => p.id === "admin");
        if (target) {
          await addOrUpdateProfile({ ...target, pin: encryptPII("1234") });
          if (target.id === "admin") {
            await updateAdminPasscode("1234");
          }
        } else {
          await updateAdminPasscode("1234");
        }
        setPinInput("1234");
        setErrorMsg("");
        const resetName = target ? target.name : "Profile";
        setResetMessage(`Password for ${resetName} reset to default 1234! Click Unlock to continue.`);
        showToast("success", "Password Reset to 1234", `Password for ${resetName} has been reset to default 1234.`);
      }
    } catch (err: any) {
      setErrorMsg("Failed to reset password: " + (err.message || "Unknown error"));
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose} id="admin-auth-modal-overlay">
      <div className="modal-content" style={{ maxWidth: "440px" }} onClick={e => e.stopPropagation()}>
        
        <div style={{ textAlign: "center", marginBottom: "20px" }}>
          <div style={{
            width: "56px",
            height: "56px",
            borderRadius: "50%",
            background: mode === "admin" ? "rgba(239, 68, 68, 0.15)" : "rgba(59, 130, 246, 0.15)",
            color: mode === "admin" ? "#ef4444" : "#3b82f6",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: "12px"
          }}>
            <Lock size={28} />
          </div>
          <h2 style={{ fontSize: "1.25rem" }}>{title || defaultTitle}</h2>
          <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", marginTop: "4px" }}>
            {subtitle || defaultSubtitle}
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label" htmlFor="admin-auth-pin-input" style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <Key size={14} /> {labelText}
            </label>
            <input
              type="password"
              placeholder={placeholderText}
              value={pinInput}
              onChange={(e) => { setPinInput(e.target.value); setErrorMsg(""); setResetMessage(""); }}
              className="form-input"
              autoFocus
              id="admin-auth-pin-input"
              required
            />
          </div>

          {errorMsg && (
            <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "#ef4444", fontSize: "0.825rem", marginBottom: "14px", background: "rgba(239, 68, 68, 0.1)", padding: "8px 10px", borderRadius: "6px" }}>
              <AlertCircle size={14} style={{ flexShrink: 0 }} /> {errorMsg}
            </div>
          )}

          {resetMessage && (
            <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "#10b981", fontSize: "0.825rem", marginBottom: "14px", background: "rgba(16, 185, 129, 0.1)", padding: "8px 10px", borderRadius: "6px" }}>
              <AlertCircle size={14} style={{ flexShrink: 0 }} /> {resetMessage}
            </div>
          )}

          <div style={{ display: "flex", gap: "10px", marginTop: "16px" }}>
            <button type="submit" className="btn btn-primary" style={{ flex: 1 }} id="admin-auth-submit-btn">
              <ShieldCheck size={18} /> Unlock & Continue
            </button>
            <button type="button" onClick={onClose} className="btn btn-secondary" id="admin-auth-cancel-btn">
              Cancel
            </button>
          </div>

          <button
            type="button"
            onClick={handleResetPasswordToDefault}
            className="btn btn-secondary btn-sm"
            id="admin-auth-reset-btn"
            style={{
              width: "100%",
              justifyContent: "center",
              marginTop: "12px",
              color: "#f59e0b",
              borderColor: "rgba(245, 158, 11, 0.4)",
              fontSize: "0.8rem"
            }}
          >
            <RotateCcw size={13} /> Reset Password to Default (1234)
          </button>
        </form>

        <div style={{ textAlign: "center", marginTop: "14px", fontSize: "0.775rem", color: "var(--text-muted)" }}>
          💡 Default password for admin and users is <code>1234</code>.
        </div>

      </div>
    </div>
  );
};

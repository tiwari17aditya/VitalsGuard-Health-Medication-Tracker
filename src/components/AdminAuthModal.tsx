import React, { useState } from "react";
import { Lock, Key, ShieldCheck, AlertCircle } from "lucide-react";
import { APP_CONFIG } from "../config/app.config";

interface AdminAuthModalProps {
  onSuccess: () => void;
  onClose: () => void;
  title?: string;
}

export const AdminAuthModal: React.FC<AdminAuthModalProps> = ({ onSuccess, onClose, title = "Admin Passcode Required" }) => {
  const [pinInput, setPinInput] = useState<string>("");
  const [errorMsg, setErrorMsg] = useState<string>("");

  const savedPin = localStorage.getItem("vitalsguard_admin_pin") || APP_CONFIG.security.defaultAdminPin;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (pinInput.trim() === savedPin) {
      sessionStorage.setItem("vitalsguard_admin_authed", "true");
      onSuccess();
    } else {
      setErrorMsg("Incorrect Admin Passcode! (Default PIN is 1234)");
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" style={{ maxWidth: "420px" }} onClick={e => e.stopPropagation()}>
        
        <div style={{ textAlign: "center", marginBottom: "20px" }}>
          <div style={{
            width: "56px",
            height: "56px",
            borderRadius: "50%",
            background: "rgba(239, 68, 68, 0.15)",
            color: "#ef4444",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: "12px"
          }}>
            <Lock size={28} />
          </div>
          <h2>{title}</h2>
          <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", marginTop: "4px" }}>
            Restricted Area: Enter your Admin Password to access system settings, database credentials, and tech stack options.
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label" style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <Key size={14} /> Admin Passcode / PIN
            </label>
            <input
              type="password"
              placeholder="Enter passcode (Default: 1234)"
              value={pinInput}
              onChange={(e) => { setPinInput(e.target.value); setErrorMsg(""); }}
              className="form-input"
              autoFocus
              required
            />
          </div>

          {errorMsg && (
            <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "#ef4444", fontSize: "0.825rem", marginBottom: "14px" }}>
              <AlertCircle size={14} /> {errorMsg}
            </div>
          )}

          <div style={{ display: "flex", gap: "10px", marginTop: "16px" }}>
            <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>
              <ShieldCheck size={18} /> Unlock Admin Access
            </button>
            <button type="button" onClick={onClose} className="btn btn-secondary">
              Cancel
            </button>
          </div>
        </form>

        <div style={{ textAlign: "center", marginTop: "16px", fontSize: "0.775rem", color: "var(--text-muted)" }}>
          💡 Default passcode is <code>1234</code>. You can change this in System Config after unlocking.
        </div>

      </div>
    </div>
  );
};

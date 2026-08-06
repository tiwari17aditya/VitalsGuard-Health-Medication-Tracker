import React, { useState } from "react";
import { Settings, FileCode, Lock, Key } from "lucide-react";
import { useApp } from "../context/AppContext";
import { APP_CONFIG } from "../config/app.config";

interface SettingsModalProps {
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ onClose }) => {
  const { showToast, updateAdminPasscode } = useApp();

  const [activeTab, setActiveTab] = useState<"config" | "admin">("config");

  // Admin PIN Passcode Management
  const [newPin, setNewPin] = useState("");

  const handleUpdatePin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPin.trim() || newPin.length < 4) {
      showToast("error", "Invalid Passcode", "Admin passcode must be at least 4 characters.");
      return;
    }
    await updateAdminPasscode(newPin.trim());
    showToast("success", "Admin Passcode Updated", "Your new admin password has been saved.");
    setNewPin("");
  };

  const handleLockAdmin = () => {
    showToast("info", "Admin Session Locked", "Admin settings are now locked behind passcode.");
    onClose();
  };

  const safeConfig = {
    ...APP_CONFIG,
    security: {
      ...APP_CONFIG.security,
      adminPasscode: "••••"
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" style={{ maxWidth: "680px" }} onClick={e => e.stopPropagation()}>
        
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
          <h2 style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <Settings color="var(--primary)" /> System Configuration & Admin Panel
          </h2>
          <button onClick={onClose} className="btn btn-secondary btn-sm">✕</button>
        </div>

        {/* Tab Buttons */}
        <div style={{ display: "flex", gap: "8px", marginBottom: "16px", flexWrap: "wrap" }}>
          {/* Database keys button removed for UI security */}
          <button
            onClick={() => setActiveTab("config")}
            className={`btn ${activeTab === "config" ? "btn-primary" : "btn-secondary"}`}
          >
            <FileCode size={16} /> Central Config (app.config.ts)
          </button>
          <button
            onClick={() => setActiveTab("admin")}
            className={`btn ${activeTab === "admin" ? "btn-primary" : "btn-secondary"}`}
          >
            <Lock size={16} /> Admin Passcode
          </button>
        </div>

        {activeTab === "config" && (
          <div>
            <p style={{ color: "var(--text-secondary)", marginBottom: "12px" }}>
              All application constraints, standards, thresholds, and schemas are defined in a single file: <code>src/config/app.config.ts</code>
            </p>

            <div style={{ background: "var(--bg-primary)", padding: "16px", borderRadius: "var(--radius-md)", border: "1px solid var(--border-color)", maxHeight: "300px", overflowY: "auto" }}>
              <pre style={{ fontSize: "0.8rem", color: "#38bdf8" }}>
                {JSON.stringify(safeConfig, null, 2)}
              </pre>
            </div>
          </div>
        )}

        {activeTab === "admin" && (
          <div>
            <p style={{ color: "var(--text-secondary)", marginBottom: "16px" }}>
              Tech Stack and Config settings are protected behind an admin passcode. You can change your admin passcode below.
            </p>

            <form onSubmit={handleUpdatePin} style={{ background: "var(--bg-primary)", padding: "16px", borderRadius: "var(--radius-md)", border: "1px solid var(--border-color)", marginBottom: "16px" }}>
              <h3 style={{ marginBottom: "12px", display: "flex", alignItems: "center", gap: "8px" }}>
                <Key size={18} color="var(--primary)" /> Change Admin Passcode
              </h3>
              
              {/* Current passcode hidden for UI security */}

              <div className="form-group">
                <label className="form-label">New Admin Passcode</label>
                <input
                  type="password"
                  placeholder="Enter new passcode (e.g. 5678)"
                  value={newPin}
                  onChange={(e) => setNewPin(e.target.value)}
                  className="form-input"
                  required
                />
              </div>

              <button type="submit" className="btn btn-primary btn-sm">
                Save New Passcode
              </button>
            </form>

            <button onClick={handleLockAdmin} className="btn btn-danger btn-sm" style={{ width: "100%" }}>
              <Lock size={16} /> Lock Admin Session Now
            </button>
          </div>
        )}

        <div style={{ marginTop: "20px", display: "flex", justifyContent: "flex-end" }}>
          <button onClick={onClose} className="btn btn-secondary">Close Settings</button>
        </div>

      </div>
    </div>
  );
};

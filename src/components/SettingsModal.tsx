import React, { useState } from "react";
import { Settings, Database, FileCode, CheckCircle } from "lucide-react";
import { useApp } from "../context/AppContext";
import { APP_CONFIG } from "../config/app.config";

interface SettingsModalProps {
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ onClose }) => {
  const { isSupabaseActive } = useApp();

  const [activeTab, setActiveTab] = useState<"database" | "config">("database");
  const [supabaseUrl, setSupabaseUrl] = useState(import.meta.env.VITE_SUPABASE_URL || "");
  const [supabaseKey, setSupabaseKey] = useState(import.meta.env.VITE_SUPABASE_ANON_KEY || "");
  const [resendKey, setResendKey] = useState(import.meta.env.VITE_RESEND_API_KEY || "");

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" style={{ maxWidth: "680px" }} onClick={e => e.stopPropagation()}>
        
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
          <h2 style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <Settings color="var(--primary)" /> System Configuration
          </h2>
          <button onClick={onClose} className="btn btn-secondary btn-sm">✕</button>
        </div>

        {/* Tab Buttons */}
        <div style={{ display: "flex", gap: "8px", marginBottom: "16px" }}>
          <button
            onClick={() => setActiveTab("database")}
            className={`btn ${activeTab === "database" ? "btn-primary" : "btn-secondary"}`}
          >
            <Database size={16} /> Free Database & API Setup
          </button>
          <button
            onClick={() => setActiveTab("config")}
            className={`btn ${activeTab === "config" ? "btn-primary" : "btn-secondary"}`}
          >
            <FileCode size={16} /> Central Config (app.config.ts)
          </button>
        </div>

        {activeTab === "database" ? (
          <div>
            <div style={{ background: "var(--bg-primary)", padding: "16px", borderRadius: "var(--radius-md)", border: "1px solid var(--border-color)", marginBottom: "16px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
                {isSupabaseActive ? (
                  <span className="badge badge-success" style={{ fontSize: "0.9rem" }}>
                    <CheckCircle size={16} /> Live Supabase PostgreSQL Connected
                  </span>
                ) : (
                  <span className="badge badge-warning" style={{ fontSize: "0.9rem" }}>
                    ℹ️ Running in Local Storage Mode (Offline Capable)
                  </span>
                )}
              </div>
              <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>
                CarePulse includes a 100% free Supabase PostgreSQL schema (`supabase/schema.sql`). 
                You can add your free Supabase credentials to <code>.env</code> or configure below.
              </p>
            </div>

            <div className="form-group">
              <label className="form-label">VITE_SUPABASE_URL</label>
              <input
                type="text"
                placeholder="https://your-project.supabase.co"
                value={supabaseUrl}
                onChange={(e) => setSupabaseUrl(e.target.value)}
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label className="form-label">VITE_SUPABASE_ANON_KEY</label>
              <input
                type="password"
                placeholder="eyJhbGciOiJIUzI1NiIsIn..."
                value={supabaseKey}
                onChange={(e) => setSupabaseKey(e.target.value)}
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label className="form-label">VITE_RESEND_API_KEY (Free 3,000 Emails/Month)</label>
              <input
                type="password"
                placeholder="re_123456789..."
                value={resendKey}
                onChange={(e) => setResendKey(e.target.value)}
                className="form-input"
              />
            </div>

            <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginTop: "12px" }}>
              * For full automated email dispatching via GitHub Actions, add these environment secrets in your GitHub repository settings under <code>Settings &gt; Secrets and variables &gt; Actions</code>.
            </p>
          </div>
        ) : (
          <div>
            <p style={{ color: "var(--text-secondary)", marginBottom: "12px" }}>
              All application constraints, standards, thresholds, and schemas are defined in a single file: <code>src/config/app.config.ts</code>
            </p>

            <div style={{ background: "var(--bg-primary)", padding: "16px", borderRadius: "var(--radius-md)", border: "1px solid var(--border-color)", maxHeight: "300px", overflowY: "auto" }}>
              <pre style={{ fontSize: "0.8rem", color: "#38bdf8" }}>
                {JSON.stringify(APP_CONFIG, null, 2)}
              </pre>
            </div>
          </div>
        )}

        <div style={{ marginTop: "20px", display: "flex", justifyContent: "flex-end" }}>
          <button onClick={onClose} className="btn btn-secondary">Close Settings</button>
        </div>

      </div>
    </div>
  );
};

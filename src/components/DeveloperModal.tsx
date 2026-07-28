import React, { useState } from "react";
import { 
  Code, Database, FileCode, CheckCircle, Lock, Key, Terminal 
} from "lucide-react";
import { useApp } from "../context/AppContext";
import { APP_CONFIG } from "../config/app.config";

interface DeveloperModalProps {
  onClose: () => void;
}

export const DeveloperModal: React.FC<DeveloperModalProps> = ({ onClose }) => {
  const { isSupabaseActive, showToast } = useApp();

  const [activeTab, setActiveTab] = useState<"techstack" | "database" | "config" | "passcode">("techstack");
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "";
  const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || "";
  const resendKey = import.meta.env.VITE_RESEND_API_KEY || "";

  // Passcode Management
  const currentPin = localStorage.getItem("vitalsguard_admin_pin") || APP_CONFIG.security.defaultAdminPin;
  const [newPin, setNewPin] = useState("");

  const handleUpdatePin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPin.trim() || newPin.length < 4) {
      showToast("error", "Invalid Passcode", "Developer passcode must be at least 4 characters.");
      return;
    }
    localStorage.setItem("vitalsguard_admin_pin", newPin.trim());
    showToast("success", "Passcode Updated", "Developer passcode updated successfully.");
    setNewPin("");
  };

  const handleLockSession = () => {
    sessionStorage.removeItem("vitalsguard_admin_authed");
    showToast("info", "Developer Mode Locked", "Developer settings locked.");
    onClose();
  };

  const techItems = [
    {
      category: "Frontend SPA Framework",
      tech: "React 18 + Vite 5 + TypeScript",
      cost: "100% Free & Open Source",
      description: "Blazing fast SPA architecture with PWA Web Manifest & Service Worker for mobile installation."
    },
    {
      category: "Design & Accessibility",
      tech: "Vanilla CSS Tokens + Glassmorphism",
      cost: "100% Free & Lightweight",
      description: "Custom CSS custom properties, HSL color tokens, and elderly accessible high-contrast tap targets."
    },
    {
      category: "Cloud Database & Storage",
      tech: "Supabase PostgreSQL (Free Tier)",
      cost: "100% Lifetime Free Tier",
      description: "500MB PostgreSQL DB, Row Level Security, auto-generated REST APIs, and LocalStorage offline fallback."
    },
    {
      category: "Email Engine",
      tech: "Resend API / EmailJS",
      cost: "100% Free Tier (3,000 emails/mo)",
      description: "Refill warning emails, end-of-day compliance check digests, and HTML tabular reports."
    },
    {
      category: "CI/CD & Free Hosting",
      tech: "GitHub Actions + GitHub Pages",
      cost: "100% Lifetime Free",
      description: "Automated build & deploy pipeline triggered on push + scheduled nightly report cron job."
    }
  ];

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" style={{ maxWidth: "720px" }} onClick={e => e.stopPropagation()}>
        
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
          <h2 style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <Terminal color="var(--primary)" /> Developer & Admin Hub
          </h2>
          <button onClick={onClose} className="btn btn-secondary btn-sm">✕</button>
        </div>

        {/* Tab Navigation */}
        <div style={{ display: "flex", gap: "8px", marginBottom: "16px", flexWrap: "wrap" }}>
          <button
            onClick={() => setActiveTab("techstack")}
            className={`btn ${activeTab === "techstack" ? "btn-primary" : "btn-secondary"}`}
          >
            <Code size={16} /> Tech Stack
          </button>
          <button
            onClick={() => setActiveTab("database")}
            className={`btn ${activeTab === "database" ? "btn-primary" : "btn-secondary"}`}
          >
            <Database size={16} /> Cloud Database & Keys
          </button>
          <button
            onClick={() => setActiveTab("config")}
            className={`btn ${activeTab === "config" ? "btn-primary" : "btn-secondary"}`}
          >
            <FileCode size={16} /> Central Config
          </button>
          <button
            onClick={() => setActiveTab("passcode")}
            className={`btn ${activeTab === "passcode" ? "btn-primary" : "btn-secondary"}`}
          >
            <Lock size={16} /> Passcode & Security
          </button>
        </div>

        {/* TAB 1: TECH STACK */}
        {activeTab === "techstack" && (
          <div>
            <p style={{ color: "var(--text-secondary)", marginBottom: "14px" }}>
              Comprehensive breakdown of open-source tools and free services powering VitalsGuard:
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: "10px", maxHeight: "360px", overflowY: "auto" }}>
              {techItems.map(item => (
                <div key={item.tech} style={{ background: "var(--bg-primary)", border: "1px solid var(--border-color)", borderRadius: "var(--radius-md)", padding: "12px 14px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: "0.75rem", fontWeight: "bold", color: "var(--primary)", textTransform: "uppercase" }}>{item.category}</span>
                    <span className="badge badge-success" style={{ fontSize: "0.7rem" }}>{item.cost}</span>
                  </div>
                  <h4 style={{ fontSize: "1rem", margin: "2px 0" }}>{item.tech}</h4>
                  <p style={{ fontSize: "0.825rem", color: "var(--text-secondary)" }}>{item.description}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 2: DATABASE & KEYS */}
        {activeTab === "database" && (
          <div>
            <div style={{ background: "var(--bg-primary)", padding: "14px", borderRadius: "var(--radius-md)", border: "1px solid var(--border-color)", marginBottom: "14px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
                {isSupabaseActive ? (
                  <span className="badge badge-success" style={{ fontSize: "0.85rem" }}>
                    <CheckCircle size={14} /> Live Supabase Connected
                  </span>
                ) : (
                  <span className="badge badge-warning" style={{ fontSize: "0.85rem" }}>
                    ℹ️ Local Storage Mode
                  </span>
                )}
              </div>
              <p style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>
                Database schema available in <code>supabase/schema.sql</code>. Environment variables loaded from <code>.env</code> file.
              </p>
            </div>

            <div className="form-group">
              <label className="form-label">VITE_SUPABASE_URL</label>
              <input type="text" readOnly value={supabaseUrl} className="form-input" />
            </div>

            <div className="form-group">
              <label className="form-label">VITE_SUPABASE_ANON_KEY</label>
              <input type="password" readOnly value={supabaseKey} className="form-input" />
            </div>

            <div className="form-group">
              <label className="form-label">VITE_RESEND_API_KEY</label>
              <input type="password" readOnly value={resendKey} className="form-input" />
            </div>
          </div>
        )}

        {/* TAB 3: CENTRAL CONFIG */}
        {activeTab === "config" && (
          <div>
            <p style={{ color: "var(--text-secondary)", marginBottom: "10px" }}>
              Live contents of single central config <code>src/config/app.config.ts</code>:
            </p>
            <div style={{ background: "var(--bg-primary)", padding: "14px", borderRadius: "var(--radius-md)", border: "1px solid var(--border-color)", maxHeight: "320px", overflowY: "auto" }}>
              <pre style={{ fontSize: "0.775rem", color: "#38bdf8" }}>
                {JSON.stringify(APP_CONFIG, null, 2)}
              </pre>
            </div>
          </div>
        )}

        {/* TAB 4: PASSCODE & SECURITY */}
        {activeTab === "passcode" && (
          <div>
            <form onSubmit={handleUpdatePin} style={{ background: "var(--bg-primary)", padding: "16px", borderRadius: "var(--radius-md)", border: "1px solid var(--border-color)", marginBottom: "16px" }}>
              <h3 style={{ marginBottom: "10px", display: "flex", alignItems: "center", gap: "8px" }}>
                <Key size={18} color="var(--primary)" /> Change Developer Passcode
              </h3>
              <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginBottom: "12px" }}>
                Current Passcode: <code>{currentPin}</code>
              </p>
              <div className="form-group">
                <label className="form-label">New Passcode</label>
                <input
                  type="password"
                  placeholder="Enter new passcode (e.g. 5678)"
                  value={newPin}
                  onChange={(e) => setNewPin(e.target.value)}
                  className="form-input"
                  required
                />
              </div>
              <button type="submit" className="btn btn-primary btn-sm">Save New Passcode</button>
            </form>

            <button onClick={handleLockSession} className="btn btn-danger btn-sm" style={{ width: "100%" }}>
              <Lock size={16} /> Lock Developer Session Now
            </button>
          </div>
        )}

        <div style={{ marginTop: "20px", display: "flex", justifyContent: "flex-end" }}>
          <button onClick={onClose} className="btn btn-secondary">Close Hub</button>
        </div>

      </div>
    </div>
  );
};

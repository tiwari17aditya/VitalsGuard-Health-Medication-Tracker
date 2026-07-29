import React, { useState } from "react";
import { 
  Code, Database, FileCode, CheckCircle, Lock, Key, Terminal, History 
} from "lucide-react";
import { useApp } from "../context/AppContext";
import { APP_CONFIG } from "../config/app.config";

interface DeveloperModalProps {
  onClose: () => void;
}

export const DeveloperModal: React.FC<DeveloperModalProps> = ({ onClose }) => {
  const { isSupabaseActive, showToast } = useApp();

  const [activeTab, setActiveTab] = useState<"techstack" | "database" | "config" | "changelog" | "passcode">("techstack");
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "";
  const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || "";
  const resendKey = import.meta.env.VITE_RESEND_API_KEY || localStorage.getItem("vitalsguard_resend_key") || "";
  const [customResendKey, setCustomResendKey] = useState(resendKey);

  // Passcode Management
  const currentPin = localStorage.getItem("vitalsguard_admin_pin") || APP_CONFIG.security.adminPasscode;
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

  const versionHistory = [
    {
      version: "v1.5.0",
      date: "2026-07-28",
      title: "Mobile Responsiveness & Viewport Optimization",
      highlights: "Hides top navigation bar on mobile in favor of bottom nav bar, fixes mobile header stacking, single column grid collapse, and eliminates horizontal side scrolling."
    },
    {
      version: "v1.4.0",
      date: "2026-07-28",
      title: "Doctor Timestamps & Custom Time Pickers",
      highlights: "Added exact doctor intake timestamps, interactive HH:MM time pickers, schedule timeline logging, and doctor export timestamps."
    },
    {
      version: "v1.3.0",
      date: "2026-07-28",
      title: "User Profile Security & Central Config Passcode",
      highlights: "Protected user addition and deletion behind Admin Passcode gate. Centralized passcode under APP_CONFIG.security.adminPasscode."
    },
    {
      version: "v1.2.0",
      date: "2026-07-28",
      title: "UI Polish & Profile-Scoped Warnings",
      highlights: "Fixed 100% adherence badge overflow, scoped low stock warnings to active user profile, and unified Developer Settings Hub."
    },
    {
      version: "v1.1.0",
      date: "2026-07-28",
      title: "Admin Passcode Security & HTML Email Reports",
      highlights: "Added session passcode authentication gate, strict email format validator, and rich HTML tabular email reports with live preview."
    },
    {
      version: "v1.0.1",
      date: "2026-07-28",
      title: "Supabase Empty Table Auto-Seeding & Loading Fix",
      highlights: "Fixed infinite loading spinner on empty Supabase database tables by implementing automated seeding for default profiles."
    },
    {
      version: "v1.0.0",
      date: "2026-07-28",
      title: "Initial Production Release",
      highlights: "Core React 18 + Vite 5 + TypeScript + Supabase + PWA app scaffolding with ADA Glucose, ACC/AHA BP, and Pill Inventory management."
    }
  ];

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" style={{ maxWidth: "760px", width: "95%" }} onClick={e => e.stopPropagation()}>
        
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px", flexWrap: "wrap", gap: "8px" }}>
          <h2 style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "1.1rem" }}>
            <Terminal color="var(--primary)" size={20} /> Developer Hub (v1.5.2)
          </h2>
          <button onClick={onClose} className="btn btn-secondary btn-sm" style={{ minHeight: "32px", padding: "4px 10px" }}>✕</button>
        </div>

        {/* Responsive Scrollable Tab Navigation */}
        <div className="modal-tabs-scroll">
          <button
            onClick={() => setActiveTab("techstack")}
            className={`btn btn-sm ${activeTab === "techstack" ? "btn-primary" : "btn-secondary"}`}
          >
            <Code size={15} /> Tech Stack
          </button>
          <button
            onClick={() => setActiveTab("changelog")}
            className={`btn btn-sm ${activeTab === "changelog" ? "btn-primary" : "btn-secondary"}`}
          >
            <History size={15} /> Version History
          </button>
          <button
            onClick={() => setActiveTab("database")}
            className={`btn btn-sm ${activeTab === "database" ? "btn-primary" : "btn-secondary"}`}
          >
            <Database size={15} /> Database & Keys
          </button>
          <button
            onClick={() => setActiveTab("config")}
            className={`btn btn-sm ${activeTab === "config" ? "btn-primary" : "btn-secondary"}`}
          >
            <FileCode size={15} /> Config
          </button>
          <button
            onClick={() => setActiveTab("passcode")}
            className={`btn btn-sm ${activeTab === "passcode" ? "btn-primary" : "btn-secondary"}`}
          >
            <Lock size={15} /> Security
          </button>
        </div>

        {/* TAB 1: TECH STACK */}
        {activeTab === "techstack" && (
          <div>
            <p style={{ color: "var(--text-secondary)", marginBottom: "12px", fontSize: "0.85rem" }}>
              Comprehensive breakdown of open-source tools powering VitalsGuard:
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: "10px", maxHeight: "360px", overflowY: "auto" }}>
              {techItems.map(item => (
                <div key={item.tech} style={{ background: "var(--bg-primary)", border: "1px solid var(--border-color)", borderRadius: "var(--radius-md)", padding: "10px 12px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "4px" }}>
                    <span style={{ fontSize: "0.75rem", fontWeight: "bold", color: "var(--primary)", textTransform: "uppercase" }}>{item.category}</span>
                    <span className="badge badge-success" style={{ fontSize: "0.7rem", padding: "2px 8px" }}>{item.cost}</span>
                  </div>
                  <h4 style={{ fontSize: "0.95rem", margin: "4px 0" }}>{item.tech}</h4>
                  <p style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>{item.description}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 2: VERSION HISTORY & CHANGELOG */}
        {activeTab === "changelog" && (
          <div>
            <p style={{ color: "var(--text-secondary)", marginBottom: "12px", fontSize: "0.85rem" }}>
              Full release version history and changelog (See <code>CHANGELOG.md</code>):
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: "10px", maxHeight: "350px", overflowY: "auto" }}>
              {versionHistory.map(v => (
                <div key={v.version} style={{ background: "var(--bg-primary)", border: "1px solid var(--border-color)", borderRadius: "var(--radius-md)", padding: "10px 12px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "4px" }}>
                    <span className="badge badge-primary" style={{ fontSize: "0.75rem", fontWeight: "bold" }}>{v.version}</span>
                    <span style={{ fontSize: "0.725rem", color: "var(--text-muted)" }}>Released: {v.date}</span>
                  </div>
                  <h4 style={{ fontSize: "0.9rem", margin: "4px 0", color: "var(--text-primary)" }}>{v.title}</h4>
                  <p style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>{v.highlights}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 3: DATABASE & KEYS */}
        {activeTab === "database" && (
          <div>
            <div style={{ background: "var(--bg-primary)", padding: "12px", borderRadius: "var(--radius-md)", border: "1px solid var(--border-color)", marginBottom: "12px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                {isSupabaseActive ? (
                  <span className="badge badge-success" style={{ fontSize: "0.8rem" }}>
                    <CheckCircle size={13} /> Supabase Live
                  </span>
                ) : (
                  <span className="badge badge-warning" style={{ fontSize: "0.8rem" }}>
                    ℹ️ Local Storage Mode
                  </span>
                )}
              </div>
              <p style={{ fontSize: "0.775rem", color: "var(--text-secondary)" }}>
                Database schema in <code>supabase/schema.sql</code>. Environment keys loaded from <code>.env</code> file.
              </p>
            </div>

            <div className="form-group">
              <label className="form-label">VITE_SUPABASE_URL</label>
              <input type="text" readOnly value={supabaseUrl} className="form-input" style={{ fontSize: "0.825rem" }} />
            </div>

            <div className="form-group">
              <label className="form-label">VITE_SUPABASE_ANON_KEY</label>
              <input type="password" readOnly value={supabaseKey} className="form-input" style={{ fontSize: "0.825rem" }} />
            </div>

            <div className="form-group">
              <label className="form-label">VITE_RESEND_API_KEY (Optional for direct API dispatch)</label>
              <div style={{ display: "flex", gap: "8px" }}>
                <input 
                  type="password" 
                  placeholder="re_123456..." 
                  value={customResendKey} 
                  onChange={(e) => setCustomResendKey(e.target.value)} 
                  className="form-input" 
                  style={{ fontSize: "0.825rem" }} 
                />
                <button 
                  type="button" 
                  onClick={() => {
                    localStorage.setItem("vitalsguard_resend_key", customResendKey.trim());
                    showToast("success", "API Key Saved", "Resend API key saved to local storage.");
                  }} 
                  className="btn btn-primary btn-sm"
                >
                  Save
                </button>
              </div>
              <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "4px" }}>
                💡 If no API key is set, emails will automatically open your email app / Gmail to send directly!
              </p>
            </div>
          </div>
        )}

        {/* TAB 4: CENTRAL CONFIG */}
        {activeTab === "config" && (
          <div>
            <p style={{ color: "var(--text-secondary)", marginBottom: "10px", fontSize: "0.85rem" }}>
              Live contents of central config <code>src/config/app.config.ts</code>:
            </p>
            <div style={{ background: "var(--bg-primary)", padding: "12px", borderRadius: "var(--radius-md)", border: "1px solid var(--border-color)", maxHeight: "320px", overflowY: "auto" }}>
              <pre style={{ fontSize: "0.75rem", color: "#38bdf8", whiteSpace: "pre-wrap", wordBreak: "break-all" }}>
                {JSON.stringify(APP_CONFIG, null, 2)}
              </pre>
            </div>
          </div>
        )}

        {/* TAB 5: PASSCODE & SECURITY */}
        {activeTab === "passcode" && (
          <div>
            <form onSubmit={handleUpdatePin} style={{ background: "var(--bg-primary)", padding: "14px", borderRadius: "var(--radius-md)", border: "1px solid var(--border-color)", marginBottom: "14px" }}>
              <h3 style={{ marginBottom: "8px", display: "flex", alignItems: "center", gap: "8px", fontSize: "0.95rem" }}>
                <Key size={16} color="var(--primary)" /> Change Developer Passcode
              </h3>
              <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginBottom: "10px" }}>
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
              <button type="submit" className="btn btn-primary btn-sm" style={{ width: "100%" }}>Save New Passcode</button>
            </form>

            <button onClick={handleLockSession} className="btn btn-danger btn-sm" style={{ width: "100%" }}>
              <Lock size={15} /> Lock Developer Session Now
            </button>
          </div>
        )}

        <div style={{ marginTop: "16px", display: "flex", justifyContent: "flex-end" }}>
          <button onClick={onClose} className="btn btn-secondary btn-sm">Close Hub</button>
        </div>

      </div>
    </div>
  );
};

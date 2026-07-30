import React, { useState } from "react";
import { 
  Code, FileCode, Lock, Key, Terminal, History 
} from "lucide-react";
import { useApp } from "../context/AppContext";
import { APP_CONFIG } from "../config/app.config";

interface DeveloperModalProps {
  onClose: () => void;
}

export const DeveloperModal: React.FC<DeveloperModalProps> = ({ onClose }) => {
  const { showToast, updateAdminPasscode } = useApp();

  const [activeTab, setActiveTab] = useState<"techstack" | "config" | "changelog" | "passcode">("techstack");

  // Passcode Management
  const [newPin, setNewPin] = useState("");

  const handleUpdatePin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPin.trim() || newPin.length < 4) {
      showToast("error", "Invalid Passcode", "Developer passcode must be at least 4 characters.");
      return;
    }
    await updateAdminPasscode(newPin.trim());
    showToast("success", "Passcode Updated", "Developer passcode updated successfully.");
    setNewPin("");
  };

  const handleLockSession = () => {
    sessionStorage.removeItem("vitalsguard_admin_authed");
    showToast("info", "Developer Mode Locked", "Developer settings locked.");
    onClose();
  };

  // Mask passcode config display
  const safeConfig = {
    ...APP_CONFIG,
    security: {
      ...APP_CONFIG.security,
      adminPasscode: "••••"
    }
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
      tech: "Resend API / Nodemailer (Fail-safe Fallback)",
      cost: "100% Free Tier (3,000 emails/mo)",
      description: "Supports serverless dispatch via Resend API and Nodemailer fallback SMTP. Client-side mailto-client acts as a fail-safe offline fallback."
    },
    {
      category: "CI/CD & Cloud Hosting",
      tech: "Vercel + GitHub Actions",
      cost: "100% Lifetime Free",
      description: "Automated SPA build and deployment triggered on git push, hosted on Vercel with SPA routing rewrite rules."
    }
  ];

  const versionHistory = [
    {
      version: "v1.8.0",
      date: "2026-07-30",
      title: "UI Security Shield, Persistent Passcodes & Unified Email Reports",
      highlights: "Redacts Supabase keys, masks PIN settings, syncs developer passcode to Supabase settings profile, implements custom start/end CSV date ranges, renders dynamic fancy CSV report spreadsheets, and unifies tabular reporting email with CSV attachments."
    },
    {
      version: "v1.7.0",
      date: "2026-07-30",
      title: "Email CSV Sharing & Backdated Medication Logging",
      highlights: "Integrates CSV attachment with standard emails, adds custom date range filters, formats fancy CSV layout, adds calendar backdating logs with custom time picker, and secures UI credentials."
    },
    {
      version: "v1.6.0",
      date: "2026-07-30",
      title: "Vercel Cloud Deployment & Reliable Email Delivery",
      highlights: "Adds fail-safe client-side email fallback on API failure, configures SPA rewrites for Vercel, updates high-res PWA manifest icons, and hooks Nodemailer fallback SMTP server."
    },
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
            <Terminal color="var(--primary)" size={20} /> Developer Hub (v{APP_CONFIG.meta.version})
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
          {/* Database keys tab button removed for UI security */}
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

        {/* TAB 4: CENTRAL CONFIG */}
        {activeTab === "config" && (
          <div>
            <p style={{ color: "var(--text-secondary)", marginBottom: "10px", fontSize: "0.85rem" }}>
              Live contents of central config <code>src/config/app.config.ts</code>:
            </p>
            <div style={{ background: "var(--bg-primary)", padding: "12px", borderRadius: "var(--radius-md)", border: "1px solid var(--border-color)", maxHeight: "320px", overflowY: "auto" }}>
              <pre style={{ fontSize: "0.75rem", color: "#38bdf8", whiteSpace: "pre-wrap", wordBreak: "break-all" }}>
                {JSON.stringify(safeConfig, null, 2)}
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

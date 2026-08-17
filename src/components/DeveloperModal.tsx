import React, { useState } from "react";
import { 
  Code, FileCode, Lock, Key, Terminal, History 
} from "lucide-react";
import { useApp } from "../context/AppContext";
import { APP_CONFIG } from "../config/app.config";

interface DeveloperModalProps {
  onClose?: () => void;
}

export const DeveloperModal: React.FC<DeveloperModalProps> = ({ onClose }) => {
  const { showToast, updateAdminPasscode } = useApp();

  const [activeTab, setActiveTab] = useState<"techstack" | "config" | "changelog" | "passcode">("techstack");

  // Password Management
  const [newPin, setNewPin] = useState("");

  const handleUpdatePin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPin.trim() || newPin.length < 4) {
      showToast("error", "Invalid Password", "Admin password must be at least 4 characters.");
      return;
    }
    await updateAdminPasscode(newPin.trim());
    showToast("success", "Password Updated", "Admin password updated successfully.");
    setNewPin("");
  };

  const handleLockSession = () => {
    showToast("info", "Admin Session Locked", "Admin settings locked.");
    if (onClose) onClose();
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
      tech: "React 19 + Vite 8 + TypeScript",
      cost: "100% Free & Open Source",
      description: "Blazing fast SPA architecture with PWA Web Manifest & Service Worker for mobile installation and offline operation."
    },
    {
      category: "Security & Access Control",
      tech: "PII Security Engine + Single Admin Authority",
      cost: "100% Free & Lightweight",
      description: "Unified single-authority Admin password, per-profile PIN encryption (PII_ENC:), exact-match verification, and strict role boundaries."
    },
    {
      category: "Design & Accessibility",
      tech: "Vanilla CSS Tokens + Glassmorphism",
      cost: "100% Free & Lightweight",
      description: "Custom CSS properties, HSL color palettes, responsive cards, and elderly-accessible high-contrast tap targets."
    },
    {
      category: "Cloud Database & Storage",
      tech: "Supabase PostgreSQL + 3-Layer Hybrid Maps",
      cost: "100% Lifetime Free Tier",
      description: "500MB PostgreSQL DB, Row Level Security, auto-generated REST APIs, and 3-layer persistent LocalStorage maps for zero-data-loss offline fallback."
    },
    {
      category: "Email & Notification Engine",
      tech: "Serverless Mailer + Daily Stock Digest",
      cost: "100% Free & Open Source",
      description: "Automated daily low-stock digest emails, caretaker email validation modal, and client-side mailto-client fail-safe backup."
    },
    {
      category: "Cloud Hosting & Deployment",
      tech: "Vercel (Serverless Edge)",
      cost: "100% Lifetime Free",
      description: "Hosted on Vercel Cloud Platform with serverless API functions and auto-configured SPA routing redirects."
    }
  ];

  const versionHistory = [
    {
      version: "v1.22.1",
      date: "2026-08-17",
      title: "Single Admin Password Authority, Intake Log Stock Restoration & 3-Layer State Maps",
      highlights: "Resolves 3-password collision bug (1234, 2580, 170507), unifies Admin password authority, restores pill stock (+1) when deleting taken dose logs, implements 3-layer hybrid map persistence for daily digest toggle, and creates Research/SECURITY_FINDINGS.md."
    },
    {
      version: "v1.22.0",
      date: "2026-08-17",
      title: "Automatic Caretaker Low-Stock Daily Digest & Caretaker Email Validation",
      highlights: "Introduces automatic daily low-stock email digest to caretaker, interactive toggle controls (Enable Daily Digest vs Auto-Emails Disabled), Caretaker Email validation prompt modal, and PostgreSQL & LocalStorage persistence."
    },
    {
      version: "v1.21.0",
      date: "2026-08-15",
      title: "Explicit Role-Based Passwords, Admin Log Deletion & Water Wave Animations",
      highlights: "Explicit Admin vs User password verification prompts, universal Admin password log deletion authorization across all vitals/meds, 1-click Reset to 1234, animated SVG water glass surface waves, and data refresh loading indicators."
    },
    {
      version: "v1.20.0",
      date: "2026-08-10",
      title: "Monthly Adherence Calendar Grid & Chevron Navigation",
      highlights: "Replaced ribbon with a full 7-column Sun-Sat 42-cell monthly adherence calendar grid, interactive chevron month switching, and Jump-to-Date reset."
    },
    {
      version: "v1.19.1",
      date: "2026-08-10",
      title: "Admin Panel Top Header Relocation & Visual Accentures",
      highlights: "Relocated Admin and Developer tabs to top header bar beside application logo, added glowing gold-orange accent borders for ADMIN session cues."
    },
    {
      version: "v1.19.0",
      date: "2026-08-10",
      title: "Dedicated ADMIN Profile Seeding & RBAC Isolation",
      highlights: "Permanent ADMIN user seeding, role demotion protection for non-admin profiles, and complete synchronization between ADMIN profile PIN and global Admin password."
    },
    {
      version: "v1.18.1",
      date: "2026-08-06",
      title: "Post-Reset 1234 Password Verification & Change Flow Fix",
      highlights: "Auto-populates current password with 1234 upon reset, evaluates encryption payloads, and enforces PIN encryption in profile modal on save."
    },
    {
      version: "v1.18.0",
      date: "2026-08-06",
      title: "Glucose Custom Dates, Unified Vitals Timeline & PII Credential Encryption",
      highlights: "Custom record dates for blood sugar, unified medication/glucose/BP schedule calendar timeline, search and share targeted day logs, AES/XOR PII PIN encryption, and in-app User Help Guide."
    },
    {
      version: "v1.17.0",
      date: "2026-08-06",
      title: "Instant Profile Re-Locking, Database Schema Sync & Profile Header Admin Hub",
      highlights: "Strict profile re-locking on switch, Developer settings isolation, full PostgreSQL profiles schema sync, and Aditya-exclusive Admin controls."
    },
    {
      version: "v1.16.0",
      date: "2026-08-06",
      title: "Per-Profile PIN Security & Change PIN Modal",
      highlights: "Introduces per-profile security PINs (default 1234), ChangePinModal for PIN updating, dynamic header lock/unlock toggle, and 3-layer persistent PIN maps."
    },
    {
      version: "v1.15.0",
      date: "2026-08-06",
      title: "Privacy Lock Screen Shield & Instant DB Refresh",
      highlights: "Implements PrivacyLockGate shield, masks locked health stats on family boards & cards, updates Supabase role/lock sync, and optimizes load speed to < 50ms via parallel caching."
    },
    {
      version: "v1.14.0",
      date: "2026-08-06",
      title: "Profile-Level Privacy Locking & Passcode Security",
      highlights: "Adds isLocked state to UserProfile, 🔒/🔓 lock visual badges, passcode gate authorization, and dedicated Admin security view."
    },
    {
      version: "v1.13.0",
      date: "2026-08-06",
      title: "Hierarchical Water Items Storage & Dynamic Glass UI",
      highlights: "Adds public.water_items PostgreSQL table, custom water container builder, YYYY-MM-DD backdated water logging, and dynamic liquid-filled glass container SVG."
    },
    {
      version: "v1.11.2",
      date: "2026-07-31",
      title: "Resilient DB Retries, Sample Cleanup & Safety Rules",
      highlights: "Adds resilient fallback retry logic in saveProfileDB to handle PostgREST schema cache misses (PGRST204), cleans up template profiles, and enforces data preservation rules."
    },
    {
      version: "v1.11.1",
      date: "2026-07-31",
      title: "Indian Season Detection & Offline Fallback Override",
      highlights: "Automates seasonal target calculation based on Indian weather calendar months, removing manual season selectors, and configures clean offline fallback behavior."
    },
    {
      version: "v1.11.0",
      date: "2026-07-31",
      title: "Scientific Hydration Target Calculator",
      highlights: "Introduces Redcliffe Labs weight-based water calculator (weight * 43.5 ml) with EFSA/IOM age/gender overrides and dynamic auto-calculate toggle controls in profile modal."
    },
    {
      version: "v1.10.0",
      date: "2026-07-31",
      title: "PostgreSQL Water Target Storage & Caretaker Email Sync",
      highlights: "Syncs water tracker targets under target_water column in profiles table, persists shared caretaker email under system-settings record, and enforces passcode authorization for water logs deletion."
    },
    {
      version: "v1.0.0",
      date: "2026-07-28",
      title: "Initial Production Release",
      highlights: "Core React + Vite + TypeScript + Supabase + PWA app scaffolding with ADA Glucose, ACC/AHA BP, and Pill Inventory management."
    }
  ];

  const viewContent = (
    <>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px", flexWrap: "wrap", gap: "8px" }}>
        <h2 style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "1.1rem" }}>
          <Terminal color="var(--primary)" size={20} /> Developer Hub (v{APP_CONFIG.meta.version})
        </h2>
        {onClose && (
          <button onClick={onClose} className="btn btn-secondary btn-sm" style={{ minHeight: "32px", padding: "4px 10px" }}>✕</button>
        )}
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
          <Lock size={15} /> Admin Password
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
              <Key size={16} color="var(--primary)" /> Change Admin Password
            </h3>
            <div className="form-group">
              <label className="form-label">New Admin Password</label>
              <input
                type="password"
                placeholder="Enter new admin password (e.g. 5678)"
                value={newPin}
                onChange={(e) => setNewPin(e.target.value)}
                className="form-input"
                required
              />
            </div>
            <button type="submit" className="btn btn-primary btn-sm" style={{ width: "100%" }}>Save New Password</button>
          </form>

          {onClose && (
            <button onClick={handleLockSession} className="btn btn-danger btn-sm" style={{ width: "100%" }}>
              <Lock size={15} /> Lock Developer Session Now
            </button>
          )}
        </div>
      )}

      {onClose && (
        <div style={{ marginTop: "16px", display: "flex", justifyContent: "flex-end" }}>
          <button onClick={onClose} className="btn btn-secondary btn-sm">Close Hub</button>
        </div>
      )}
    </>
  );

  if (onClose) {
    return (
      <div className="modal-overlay" onClick={onClose}>
        <div className="modal-content" style={{ maxWidth: "760px", width: "95%" }} onClick={e => e.stopPropagation()}>
          {viewContent}
        </div>
      </div>
    );
  }

  return (
    <div className="glass-card" style={{ padding: "20px" }}>
      {viewContent}
    </div>
  );
};

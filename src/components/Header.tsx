import React, { useState } from "react";
import { 
  Heart, Users, AlertTriangle, ShieldCheck, 
  Settings, Code, Phone, CheckCircle2, WifiOff, Lock
} from "lucide-react";
import { useApp } from "../context/AppContext";
import { APP_CONFIG } from "../config/app.config";
import { AdminAuthModal } from "./AdminAuthModal";

interface HeaderProps {
  onOpenProfileModal: () => void;
  onOpenSettingsModal: () => void;
  onOpenTechStackModal: () => void;
}

export const Header: React.FC<HeaderProps> = ({ 
  onOpenProfileModal, 
  onOpenSettingsModal, 
  onOpenTechStackModal 
}) => {
  const { 
    profiles, 
    activeProfile, 
    setActiveProfileId, 
    isOffline, 
    isSupabaseActive, 
    lowStockMeds 
  } = useApp();

  const [pendingAdminAction, setPendingAdminAction] = useState<"settings" | "techstack" | null>(null);

  // Check if admin is currently authenticated in session
  const isAdminAuthed = () => sessionStorage.getItem("vitalsguard_admin_authed") === "true";

  const handleOpenSettings = () => {
    if (isAdminAuthed()) {
      onOpenSettingsModal();
    } else {
      setPendingAdminAction("settings");
    }
  };

  const handleOpenTechStack = () => {
    if (isAdminAuthed()) {
      onOpenTechStackModal();
    } else {
      setPendingAdminAction("techstack");
    }
  };

  const handleAuthSuccess = () => {
    const action = pendingAdminAction;
    setPendingAdminAction(null);
    if (action === "settings") onOpenSettingsModal();
    if (action === "techstack") onOpenTechStackModal();
  };

  return (
    <header className="glass-card" style={{ marginBottom: "20px", borderRadius: "0 0 16px 16px" }}>
      <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", gap: "16px" }}>
        
        {/* Logo & Branding */}
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div style={{
            width: "44px",
            height: "44px",
            borderRadius: "12px",
            background: "linear-gradient(135deg, #ef4444, #3b82f6)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#ffffff",
            boxShadow: "0 4px 12px rgba(239, 68, 68, 0.4)"
          }}>
            <Heart size={26} fill="white" />
          </div>
          <div>
            <h1 style={{ fontSize: "1.35rem", display: "flex", alignItems: "center", gap: "8px" }}>
              {APP_CONFIG.meta.appName}
            </h1>
            <p style={{ fontSize: "0.825rem", color: "var(--text-secondary)" }}>
              {APP_CONFIG.meta.tagline}
            </p>
          </div>
        </div>

        {/* User Profiles Switcher & Status Badges */}
        <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "12px" }}>
          
          {/* Profile Selector */}
          <div style={{ display: "flex", alignItems: "center", gap: "8px", background: "var(--bg-primary)", padding: "4px 8px 4px 12px", borderRadius: "var(--radius-full)", border: "1px solid var(--border-color)" }}>
            <Users size={18} color="var(--primary)" />
            <select
              value={activeProfile?.id || ""}
              onChange={(e) => setActiveProfileId(e.target.value)}
              style={{
                background: "transparent",
                border: "none",
                color: "var(--text-primary)",
                fontWeight: "600",
                fontSize: "0.95rem",
                outline: "none",
                cursor: "pointer"
              }}
            >
              {profiles.map(p => (
                <option key={p.id} value={p.id} style={{ background: "var(--bg-card)", color: "var(--text-primary)" }}>
                  {p.name} ({p.role})
                </option>
              ))}
            </select>
            <button 
              onClick={onOpenProfileModal}
              title="Manage Profiles"
              style={{
                background: "var(--bg-card-hover)",
                border: "none",
                color: "var(--text-primary)",
                padding: "6px 10px",
                borderRadius: "var(--radius-full)",
                fontSize: "0.8rem",
                fontWeight: "600",
                cursor: "pointer"
              }}
            >
              + Edit Users
            </button>
          </div>

          {/* Emergency Doctor Call Button */}
          {activeProfile?.emergencyContact && (
            <a
              href={`tel:${activeProfile.emergencyContact}`}
              className="badge badge-danger"
              style={{ textDecoration: "none", cursor: "pointer", padding: "8px 12px" }}
              title={`Call Emergency: ${activeProfile.emergencyContact}`}
            >
              <Phone size={14} /> Call Dr / Emergency
            </a>
          )}

          {/* Low Stock Warning Counter Pill */}
          {lowStockMeds.length > 0 && (
            <span className="badge badge-warning" title={`${lowStockMeds.length} medications require refill`}>
              <AlertTriangle size={14} /> {lowStockMeds.length} Low Stock
            </span>
          )}

          {/* Database / Connection Status Pill */}
          {isOffline ? (
            <span className="badge badge-warning" title="Working offline in browser storage mode">
              <WifiOff size={14} /> Offline Mode
            </span>
          ) : isSupabaseActive ? (
            <span className="badge badge-success" title="Connected to Supabase PostgreSQL Database">
              <ShieldCheck size={14} /> Supabase Live
            </span>
          ) : (
            <span className="badge badge-primary" title="Local Browser Storage Active (Configure Supabase in Settings)">
              <CheckCircle2 size={14} /> Local Storage
            </span>
          )}

          {/* Admin Protected Tech Stack Trigger */}
          <button
            onClick={handleOpenTechStack}
            className="btn btn-secondary btn-sm"
            title="Admin Protected: Tech Stack & System Architecture"
          >
            <Code size={16} /> Tech Stack {isAdminAuthed() ? '' : <Lock size={12} style={{ color: "#f59e0b" }} />}
          </button>

          {/* Admin Protected Settings Trigger */}
          <button
            onClick={handleOpenSettings}
            className="btn btn-secondary btn-sm"
            title="Admin Protected: Database & System Settings"
          >
            <Settings size={16} /> Config {isAdminAuthed() ? '' : <Lock size={12} style={{ color: "#f59e0b" }} />}
          </button>

        </div>

      </div>

      {/* Admin Passcode Modal Gate */}
      {pendingAdminAction && (
        <AdminAuthModal
          onSuccess={handleAuthSuccess}
          onClose={() => setPendingAdminAction(null)}
          title={`Admin Passcode Required for ${pendingAdminAction === "settings" ? "System Config" : "Tech Stack"}`}
        />
      )}

    </header>
  );
};

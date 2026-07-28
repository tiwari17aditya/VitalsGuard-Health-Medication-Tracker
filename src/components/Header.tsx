import React, { useState } from "react";
import { 
  Heart, Users, AlertTriangle, ShieldCheck, 
  Phone, CheckCircle2, WifiOff, Wrench
} from "lucide-react";
import { useApp } from "../context/AppContext";
import { APP_CONFIG } from "../config/app.config";
import { AdminAuthModal } from "./AdminAuthModal";
import { DeveloperModal } from "./DeveloperModal";

interface HeaderProps {
  onOpenProfileModal: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenProfileModal }) => {
  const { 
    profiles, 
    activeProfile, 
    setActiveProfileId, 
    isOffline, 
    isSupabaseActive, 
    medications
  } = useApp();

  const [showAuthModal, setShowAuthModal] = useState<boolean>(false);
  const [showDevModal, setShowDevModal] = useState<boolean>(false);

  // Filter low stock meds ONLY for current active user profile
  const profileLowStockMeds = medications.filter(
    m => m.profileId === activeProfile?.id && m.stockCount <= m.minStockAlert
  );

  const isAdminAuthed = () => sessionStorage.getItem("vitalsguard_admin_authed") === "true";

  const handleDeveloperClick = () => {
    if (isAdminAuthed()) {
      setShowDevModal(true);
    } else {
      setShowAuthModal(true);
    }
  };

  const handleAuthSuccess = () => {
    setShowAuthModal(false);
    setShowDevModal(true);
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

          {/* Low Stock Warning Counter Pill (Only shows for current profile if meds exist) */}
          {profileLowStockMeds.length > 0 && (
            <span className="badge badge-warning" title={`${profileLowStockMeds.length} medications require refill`}>
              <AlertTriangle size={14} /> {profileLowStockMeds.length} Low Stock
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
            <span className="badge badge-primary" title="Local Browser Storage Active">
              <CheckCircle2 size={14} /> Local Storage
            </span>
          )}

          {/* Single Clean Developer Settings Button */}
          <button
            onClick={handleDeveloperClick}
            className="btn btn-secondary btn-sm"
            title="Developer Settings Hub (Protected by passcode)"
          >
            <Wrench size={15} /> Developer Settings
          </button>

        </div>

      </div>

      {/* Passcode Authentication Modal */}
      {showAuthModal && (
        <AdminAuthModal
          onSuccess={handleAuthSuccess}
          onClose={() => setShowAuthModal(false)}
          title="Developer Passcode Required"
        />
      )}

      {/* Developer Settings Hub Modal */}
      {showDevModal && (
        <DeveloperModal onClose={() => setShowDevModal(false)} />
      )}

    </header>
  );
};

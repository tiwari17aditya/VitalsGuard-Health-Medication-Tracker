import React, { useState } from "react";
import { 
  Shield, Users, Plus, Trash2, Edit2, Lock, Unlock, Wrench, KeyRound, Eye, EyeOff, Database 
} from "lucide-react";
import { useApp } from "../context/AppContext";
import type { UserProfile } from "../types";
import { AdminAuthModal } from "./AdminAuthModal";
import { DeveloperModal } from "./DeveloperModal";

interface AdminViewProps {
  onClose?: () => void;
}

export const AdminView: React.FC<AdminViewProps> = ({ onClose }) => {
  const { 
    profiles, 
    activeProfile, 
    addOrUpdateProfile, 
    deleteProfile, 
    setActiveProfileId,
    showToast
  } = useApp();

  const [editingProfile, setEditingProfile] = useState<Partial<UserProfile> | null>(null);
  const [pendingAction, setPendingAction] = useState<{ type: "add" | "delete" | "toggle_lock" | "select_profile" | "dev_settings"; deleteId?: string; targetProfile?: UserProfile } | null>(null);
  const [showDevModal, setShowDevModal] = useState<boolean>(false);
  const [showPinMap, setShowPinMap] = useState<Record<string, boolean>>({});

  const togglePinVisibility = (profileId: string) => {
    setShowPinMap(prev => ({ ...prev, [profileId]: !prev[profileId] }));
  };

  const handleSelectProfileClick = (p: UserProfile) => {
    if (p.id === activeProfile?.id) return;
    sessionStorage.setItem(`vitalsguard_unlocked_${p.id}`, "true");
    setActiveProfileId(p.id);
    showToast("info", "Admin Switch", `Switched active profile control to ${p.name}`);
  };

  const handleCreateNewClick = () => {
    startCreatingProfile();
  };

  const handleDeleteClick = (id: string) => {
    deleteProfile(id);
  };

  const handleToggleLockClick = (p: UserProfile) => {
    addOrUpdateProfile({ ...p, isLocked: !p.isLocked });
  };

  const handleSyncAllProfilesToDB = async () => {
    try {
      for (const p of profiles) {
        await addOrUpdateProfile(p);
      }
      showToast("success", "DB Schema Sync", `Successfully synced ${profiles.length} profiles to database schema.`);
    } catch (err: any) {
      showToast("error", "Sync Failed", err.message || "Failed to sync profiles to DB.");
    }
  };

  const handleDeveloperClick = () => {
    setPendingAction({ type: "dev_settings" });
  };

  const startCreatingProfile = () => {
    setEditingProfile({
      id: `profile-${Date.now()}`,
      name: "",
      role: "Member",
      age: 30,
      gender: "Male",
      weight: 70,
      season: "Spring/Autumn",
      targetGlucoseFasting: "70-110 mg/dL",
      targetGlucosePostMeal: "< 140 mg/dL",
      targetBP: "120/80 mmHg",
      targetWater: 2500,
      emergencyContact: "",
      doctorName: "",
      notes: "",
      isLocked: false
    });
  };

  const handleAuthSuccess = () => {
    const act = pendingAction;
    setPendingAction(null);
    if (act?.type === "add") {
      startCreatingProfile();
    } else if (act?.type === "delete" && act.deleteId) {
      deleteProfile(act.deleteId);
    } else if (act?.type === "toggle_lock" && act.targetProfile) {
      addOrUpdateProfile({ ...act.targetProfile, isLocked: !act.targetProfile.isLocked });
    } else if (act?.type === "select_profile" && act.targetProfile) {
      sessionStorage.setItem(`vitalsguard_unlocked_${act.targetProfile.id}`, "true");
      setActiveProfileId(act.targetProfile.id);
    } else if (act?.type === "dev_settings") {
      setShowDevModal(true);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProfile || !editingProfile.name) return;
    await addOrUpdateProfile(editingProfile as UserProfile);
    setEditingProfile(null);
  };

  const viewContent = (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      
      {/* Top Banner */}
      <div className="glass-card" style={{ borderLeft: "4px solid #f59e0b", padding: "18px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px" }}>
          <div>
            <h2 style={{ display: "flex", alignItems: "center", gap: "10px", color: "var(--text-primary)" }}>
              <Shield color="#f59e0b" size={24} /> Admin & Profile Security Hub
            </h2>
            <p style={{ color: "var(--text-secondary)", fontSize: "0.875rem", marginTop: "4px" }}>
              Welcome <strong>{activeProfile?.name}</strong>. Manage family profiles, toggle profile privacy locks, and update target goals.
            </p>
          </div>

          <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
            <button
              onClick={handleDeveloperClick}
              className="btn btn-secondary btn-sm"
              style={{ display: "flex", alignItems: "center", gap: "6px" }}
            >
              <Wrench size={15} /> Open Developer Vault
            </button>
            {onClose && (
              <button onClick={onClose} className="btn btn-secondary btn-sm" style={{ padding: "6px 12px", minHeight: "34px" }}>✕</button>
            )}
          </div>
        </div>
      </div>

      {/* Profile Management Cards Grid */}
      {!editingProfile ? (
        <div className="glass-card">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", flexWrap: "wrap", gap: "10px" }}>
            <h3 style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <Users size={20} color="var(--primary)" /> Registered User Profiles ({profiles.length})
            </h3>

            <div style={{ display: "flex", gap: "8px" }}>
              <button 
                onClick={handleSyncAllProfilesToDB} 
                className="btn btn-secondary btn-sm"
                title="Sync all profile records to Supabase PostgreSQL database schema"
              >
                <Database size={15} /> Sync Schema to DB
              </button>
              <button onClick={handleCreateNewClick} className="btn btn-success btn-sm">
                <Plus size={16} /> Add New User
              </button>
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {profiles.map(p => {
              const isCurrent = p.id === activeProfile?.id;
              const isPinVisible = Boolean(showPinMap[p.id]);
              const displayPin = p.pin || "1234";

              return (
                <div
                  key={p.id}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "14px 18px",
                    borderRadius: "var(--radius-md)",
                    background: isCurrent ? "rgba(59, 130, 246, 0.08)" : "var(--bg-primary)",
                    border: isCurrent ? "2px solid var(--primary)" : "1px solid var(--border-color)",
                    flexWrap: "wrap",
                    gap: "10px"
                  }}
                >
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                      <strong style={{ fontSize: "1.1rem" }}>{p.name}</strong>
                      {isCurrent && <span className="badge badge-primary" style={{ fontSize: "0.75rem" }}>Active</span>}
                      {p.isLocked ? (
                        <span className="badge badge-warning" style={{ fontSize: "0.75rem", display: "flex", alignItems: "center", gap: "4px" }}>
                          <Lock size={12} /> Locked
                        </span>
                      ) : (
                        <span className="badge badge-success" style={{ fontSize: "0.75rem", display: "flex", alignItems: "center", gap: "4px" }}>
                          <Unlock size={12} /> Unlocked
                        </span>
                      )}

                      {/* Admin PIN Control Pill */}
                      <span 
                        className="badge badge-secondary" 
                        style={{ fontSize: "0.75rem", display: "inline-flex", alignItems: "center", gap: "4px", cursor: "pointer" }}
                        onClick={() => togglePinVisibility(p.id)}
                        title="Click to toggle PIN visibility for Admin"
                      >
                        <KeyRound size={12} color="var(--primary)" />
                        <span>PIN: {isPinVisible ? <strong>{displayPin}</strong> : "••••"}</span>
                        {isPinVisible ? <EyeOff size={12} /> : <Eye size={12} />}
                      </span>
                    </div>

                    <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", marginTop: "4px" }}>
                      Role: <strong>{p.role}</strong> • Target Water: <strong>{p.targetWater || 2000} ml</strong> • Target BP: <strong>{p.targetBP || "120/80 mmHg"}</strong> • Sugar: <strong>{p.targetGlucoseFasting || "70-100"}</strong>
                    </p>
                  </div>

                  <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                    {!isCurrent && (
                      <button
                        onClick={() => handleSelectProfileClick(p)}
                        className="btn btn-primary btn-sm"
                        title="Admin Control: Switch active profile immediately"
                      >
                        Take Admin Control
                      </button>
                    )}

                    {/* Lock / Unlock Toggle Button */}
                    <button
                      onClick={() => handleToggleLockClick(p)}
                      className="btn btn-secondary btn-sm"
                      style={{ color: p.isLocked ? "#f59e0b" : "var(--primary)", display: "flex", alignItems: "center", gap: "4px" }}
                      title={p.isLocked ? "Unlock Profile Privacy" : "Lock Profile Privacy"}
                    >
                      {p.isLocked ? <><Lock size={14} /> Unlock</> : <><Unlock size={14} /> Lock</>}
                    </button>

                    <button
                      onClick={() => setEditingProfile(p)}
                      className="btn btn-secondary btn-sm"
                      title="Edit Profile Details & PIN"
                    >
                      <Edit2 size={14} /> Edit
                    </button>

                    {profiles.length > 1 && (
                      <button
                        onClick={() => handleDeleteClick(p.id)}
                        className="btn btn-secondary btn-sm"
                        style={{ color: "#ef4444" }}
                        title="Delete Profile"
                      >
                        <Trash2 size={14} /> Delete
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* Profile Edit / Create Form */
        <div className="glass-card">
          <h3 style={{ marginBottom: "16px" }}>
            {editingProfile.id ? `Edit Profile: ${editingProfile.name || ""}` : "Create New User Profile"}
          </h3>

          <form onSubmit={handleSave}>
            <div className="form-group">
              <label className="form-label">Full Name</label>
              <input
                type="text"
                placeholder="e.g. Aditya, Mom, Dad"
                value={editingProfile.name || ""}
                onChange={(e) => setEditingProfile({ ...editingProfile, name: e.target.value })}
                className="form-input"
                required
              />
            </div>

            <div className="grid-3" style={{ gap: "12px" }}>
              <div className="form-group">
                <label className="form-label">Role / Relationship</label>
                <input
                  type="text"
                  placeholder="e.g. Admin, Self, Parent"
                  value={editingProfile.role || ""}
                  onChange={(e) => setEditingProfile({ ...editingProfile, role: e.target.value })}
                  className="form-input"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label" style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                  <KeyRound size={14} /> Security PIN
                </label>
                <input
                  type="password"
                  placeholder="e.g. 1234"
                  value={editingProfile.pin || ""}
                  onChange={(e) => setEditingProfile({ ...editingProfile, pin: e.target.value })}
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Profile Privacy Lock</label>
                <select
                  value={editingProfile.isLocked ? "true" : "false"}
                  onChange={(e) => setEditingProfile({ ...editingProfile, isLocked: e.target.value === "true" })}
                  className="form-input"
                  style={{ background: "var(--bg-primary)", color: "var(--text-primary)" }}
                >
                  <option value="false">🔓 Unlocked (Free Access)</option>
                  <option value="true">🔒 Locked (PIN Protected)</option>
                </select>
              </div>
            </div>

            <div className="grid-3" style={{ gap: "12px" }}>
              <div className="form-group">
                <label className="form-label">Target Water Goal (ml)</label>
                <input
                  type="number"
                  placeholder="e.g. 2500"
                  value={editingProfile.targetWater || 2000}
                  onChange={(e) => setEditingProfile({ ...editingProfile, targetWater: Number(e.target.value) })}
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Target Glucose (Fasting)</label>
                <input
                  type="text"
                  placeholder="e.g. 70-110 mg/dL"
                  value={editingProfile.targetGlucoseFasting || ""}
                  onChange={(e) => setEditingProfile({ ...editingProfile, targetGlucoseFasting: e.target.value })}
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Target Blood Pressure</label>
                <input
                  type="text"
                  placeholder="e.g. 120/80 mmHg"
                  value={editingProfile.targetBP || ""}
                  onChange={(e) => setEditingProfile({ ...editingProfile, targetBP: e.target.value })}
                  className="form-input"
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Emergency Phone Number</label>
              <input
                type="text"
                placeholder="e.g. +1 (555) 234-5678"
                value={editingProfile.emergencyContact || ""}
                onChange={(e) => setEditingProfile({ ...editingProfile, emergencyContact: e.target.value })}
                className="form-input"
              />
            </div>

            <div style={{ display: "flex", gap: "10px", marginTop: "20px" }}>
              <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>
                Save Profile Configuration
              </button>
              <button type="button" onClick={() => setEditingProfile(null)} className="btn btn-secondary">
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Admin Auth Modal */}
      {pendingAction && (
        <AdminAuthModal
          onSuccess={handleAuthSuccess}
          onClose={() => setPendingAction(null)}
          title={
            pendingAction.type === "select_profile"
              ? `Unlock Profile: ${pendingAction.targetProfile?.name}`
              : pendingAction.type === "dev_settings"
              ? "Developer Passcode Required"
              : "Admin Passcode Verification Required"
          }
          expectedPin={
            pendingAction.type === "select_profile"
              ? (pendingAction.targetProfile?.pin || "1234")
              : undefined
          }
          isMasterOnly={pendingAction.type === "dev_settings"}
          subtitle={
            pendingAction.type === "select_profile"
              ? `Enter ${pendingAction.targetProfile?.name}'s PIN (default: 1234) or Admin Passcode to switch.`
              : pendingAction.type === "dev_settings"
              ? "Enter Admin Passcode to launch Developer Settings Hub."
              : undefined
          }
        />
      )}

      {/* Developer Vault Modal */}
      {showDevModal && (
        <DeveloperModal onClose={() => setShowDevModal(false)} />
      )}

    </div>
  );

  if (onClose) {
    return (
      <div className="modal-overlay" onClick={onClose}>
        <div className="modal-content" style={{ maxWidth: "880px", width: "95%", maxHeight: "90vh", overflowY: "auto" }} onClick={e => e.stopPropagation()}>
          {viewContent}
        </div>
      </div>
    );
  }

  return viewContent;
};

import React, { useState, useEffect } from "react";
import { Users, Plus, Trash2, Edit2, Lock, Unlock, KeyRound, RotateCcw, Mail, BellRing } from "lucide-react";
import { useApp } from "../context/AppContext";
import type { UserProfile } from "../types";
import { AdminAuthModal } from "./AdminAuthModal";
import { encryptPII } from "../utils/piiSecurity";

// Scientific water target calculator helper
const calculateAutoWaterTarget = (
  gender: string,
  weight: number,
  season: string,
  age: number
): number => {
  if (age < 4) return 1300;
  if (age >= 4 && age < 9) return 1700;
  if (age >= 9 && age < 14) return gender.toLowerCase() === "male" ? 2400 : 2100;
  let target = weight * 43.5;
  if (gender.toLowerCase() === "male") target += 600;
  else if (gender.toLowerCase() === "other") target += 300;
  if (season.toLowerCase() === "summer") target += 500;
  else if (season.toLowerCase() === "winter") target -= 200;
  const rounded = Math.round(target / 50) * 50;
  return Math.min(6000, Math.max(1000, rounded));
};

interface ProfileModalProps {
  onClose: () => void;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({ onClose }) => {
  const { profiles, activeProfile, addOrUpdateProfile, deleteProfile, setActiveProfileId, showToast, updateAdminPasscode } = useApp();

  const [editingProfile, setEditingProfile] = useState<Partial<UserProfile> | null>(null);
  const [pendingAction, setPendingAction] = useState<{ type: "add" | "delete" | "toggle_lock" | "select_profile"; deleteId?: string; targetProfile?: UserProfile } | null>(null);
  const [useAutoWater, setUseAutoWater] = useState<boolean>(true);

  const handleResetProfilePinToDefault = async (p: UserProfile) => {
    try {
      const defaultEncryptedPin = encryptPII("1234");
      await addOrUpdateProfile({ ...p, pin: defaultEncryptedPin });
      if (p.id === "admin") {
        await updateAdminPasscode("1234");
      }
      showToast("success", "Password Reset to 1234", `Reset password for ${p.name} back to default 1234.`);
    } catch (err: any) {
      showToast("error", "Reset Failed", err.message || "Failed to reset password.");
    }
  };

  useEffect(() => {
    if (!editingProfile || !useAutoWater) return;
    const weight = editingProfile.weight || 60;
    const gender = editingProfile.gender || "Female";
    const season = editingProfile.season || "Spring/Autumn";
    const age = editingProfile.age || 40;
    const calculatedTarget = calculateAutoWaterTarget(gender, weight, season, age);
    if (editingProfile.targetWater !== calculatedTarget) {
      setEditingProfile(prev => prev ? { ...prev, targetWater: calculatedTarget } : null);
    }
  }, [
    editingProfile?.weight,
    editingProfile?.gender,
    editingProfile?.season,
    editingProfile?.age,
    useAutoWater
  ]);

  useEffect(() => {
    if (editingProfile && editingProfile.id) {
      const weight = editingProfile.weight || 60;
      const gender = editingProfile.gender || "Female";
      const season = editingProfile.season || "Spring/Autumn";
      const age = editingProfile.age || 40;
      const calc = calculateAutoWaterTarget(gender, weight, season, age);
      if (editingProfile.targetWater && editingProfile.targetWater !== calc) {
        setUseAutoWater(false);
      } else {
        setUseAutoWater(true);
      }
    } else if (editingProfile) {
      setUseAutoWater(true);
    }
  }, [editingProfile?.id]);

  const handleSelectProfileClick = (p: UserProfile) => {
    if (p.id === activeProfile?.id) {
      onClose();
      return;
    }
    if (p.isLocked) {
      setPendingAction({ type: "select_profile", targetProfile: p });
    } else {
      setActiveProfileId(p.id);
      onClose();
    }
  };

  const handleCreateNewClick = () => {
    setPendingAction({ type: "add" });
  };

  const handleDeleteClick = (id: string) => {
    setPendingAction({ type: "delete", deleteId: id });
  };

  const handleToggleLockClick = (p: UserProfile) => {
    setPendingAction({ type: "toggle_lock", targetProfile: p });
  };

  const startCreatingProfile = () => {
    setEditingProfile({
      id: `profile-${Date.now()}`,
      name: "",
      role: "Parent",
      age: 40,
      gender: "Female",
      weight: 60,
      season: "Spring/Autumn",
      targetGlucoseFasting: "70-110 mg/dL",
      targetGlucosePostMeal: "< 140 mg/dL",
      targetBP: "120/80 mmHg",
      targetWater: 2000,
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
      sessionStorage.removeItem("vitalsguard_admin_authed");
    } else if (act?.type === "toggle_lock" && act.targetProfile) {
      addOrUpdateProfile({ ...act.targetProfile, isLocked: !act.targetProfile.isLocked });
    } else if (act?.type === "select_profile" && act.targetProfile) {
      sessionStorage.setItem(`vitalsguard_unlocked_${act.targetProfile.id}`, "true");
      setActiveProfileId(act.targetProfile.id);
      onClose();
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProfile || !editingProfile.name) return;
    const encryptedPin = encryptPII(editingProfile.pin || "1234");
    await addOrUpdateProfile({ ...editingProfile, pin: encryptedPin } as UserProfile);
    setEditingProfile(null);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
          <h2 style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <Users color="var(--primary)" /> Multi-User Management
          </h2>
          <button onClick={onClose} className="btn btn-secondary btn-sm">✕</button>
        </div>

        {!editingProfile ? (
          <div>
            <p style={{ color: "var(--text-secondary)", marginBottom: "16px" }}>
              Switch or manage family member profiles. <em>(Adding, deleting, or locking users requires Admin Passcode)</em>
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "20px" }}>
              {profiles.map(p => (
                <div
                  key={p.id}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "12px 14px",
                    borderRadius: "var(--radius-md)",
                    background: p.id === activeProfile?.id ? "var(--primary-light)" : "var(--bg-primary)",
                    border: p.id === activeProfile?.id ? "2px solid var(--primary)" : "1px solid var(--border-color)",
                    flexWrap: "wrap",
                    gap: "8px"
                  }}
                >
                  <div>
                    <h4 style={{ fontSize: "1.05rem", display: "flex", alignItems: "center", gap: "6px" }}>
                      {p.name} {p.isLocked ? <span title="Locked Profile"><Lock size={14} color="#f59e0b" /></span> : <span title="Unlocked Profile"><Unlock size={14} color="#10b981" /></span>}
                    </h4>
                    <p style={{ fontSize: "0.825rem", color: "var(--text-secondary)" }}>
                      {p.role} • BP: {p.targetBP || "N/A"} • Water: {p.targetWater ? `${p.targetWater}ml` : "2000ml"} • Sugar: {p.targetGlucoseFasting || "N/A"} / {p.targetGlucosePostMeal || "N/A"}
                    </p>
                  </div>

                  <div style={{ display: "flex", gap: "6px" }}>
                    <button
                      onClick={() => handleSelectProfileClick(p)}
                      className="btn btn-primary btn-sm"
                    >
                      Select Profile
                    </button>
                    <button
                      onClick={() => handleToggleLockClick(p)}
                      className="btn btn-secondary btn-sm"
                      style={{ color: p.isLocked ? "#f59e0b" : "var(--primary)" }}
                      title={p.isLocked ? "Unlock Profile (Passcode Protected)" : "Lock Profile (Passcode Protected)"}
                    >
                      {p.isLocked ? <Lock size={14} /> : <Unlock size={14} />}
                    </button>
                    <button
                      onClick={() => setEditingProfile(p)}
                      className="btn btn-secondary btn-sm"
                      title="Edit Profile"
                    >
                      <Edit2 size={14} />
                    </button>
                    <button
                      onClick={() => handleResetProfilePinToDefault(p)}
                      className="btn btn-secondary btn-sm"
                      style={{ color: "#f59e0b" }}
                      title="Reset password back to default 1234"
                    >
                      <RotateCcw size={14} />
                    </button>
                    {profiles.length > 1 && (
                      <button
                        onClick={() => handleDeleteClick(p.id)}
                        className="btn btn-secondary btn-sm"
                        style={{ color: "#ef4444" }}
                        title="Delete Profile (Passcode Protected)"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <button onClick={handleCreateNewClick} className="btn btn-success" style={{ width: "100%" }}>
              <Plus size={18} /> Add New Family User <Lock size={14} style={{ opacity: 0.8 }} />
            </button>
          </div>
        ) : (
          <form onSubmit={handleSave}>
            <h3 style={{ marginBottom: "14px" }}>
              {editingProfile.id ? "Edit User Profile" : "Add User Profile"}
            </h3>

            <div className="form-group">
              <label className="form-label">Full Name</label>
              <input
                type="text"
                placeholder="e.g. Mom (Sarah), Dad (James)"
                value={editingProfile.name || ""}
                onChange={(e) => setEditingProfile({ ...editingProfile, name: e.target.value })}
                className="form-input"
                required
              />
            </div>

            <div className="grid-2">
              <div className="form-group">
                <label className="form-label">Relationship / Role</label>
                <input
                  type="text"
                  placeholder="e.g. Mother, Father, Self"
                  value={editingProfile.role || ""}
                  onChange={(e) => setEditingProfile({ ...editingProfile, role: e.target.value })}
                  className="form-input"
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Age</label>
                <input
                  type="number"
                  placeholder="e.g. 62"
                  value={editingProfile.age || ""}
                  onChange={(e) => setEditingProfile({ ...editingProfile, age: Number(e.target.value) })}
                  className="form-input"
                />
              </div>
            </div>

            <div className="grid-3" style={{ gap: "12px", marginBottom: "14px" }}>
              <div className="form-group">
                <label className="form-label">Gender</label>
                <select
                  value={editingProfile.gender || "Female"}
                  onChange={(e) => setEditingProfile({ ...editingProfile, gender: e.target.value })}
                  className="form-input"
                  style={{ background: "var(--bg-primary)", color: "var(--text-primary)" }}
                >
                  <option value="Female">Female</option>
                  <option value="Male">Male</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Weight (kg)</label>
                <input
                  type="number"
                  placeholder="e.g. 60"
                  value={editingProfile.weight || ""}
                  onChange={(e) => setEditingProfile({ ...editingProfile, weight: Number(e.target.value) })}
                  className="form-input"
                />
              </div>
              <div className="form-group">
                <label className="form-label">Current Season</label>
                <select
                  value={editingProfile.season || "Spring/Autumn"}
                  onChange={(e) => setEditingProfile({ ...editingProfile, season: e.target.value })}
                  className="form-input"
                  style={{ background: "var(--bg-primary)", color: "var(--text-primary)" }}
                >
                  <option value="Spring/Autumn">Spring/Autumn</option>
                  <option value="Summer">Summer (Hot)</option>
                  <option value="Winter">Winter (Cold)</option>
                </select>
              </div>
            </div>

            <div className="grid-2">
              <div className="form-group">
                <label className="form-label">Target Glucose (Fasting)</label>
                <input
                  type="text"
                  placeholder="e.g. 70-100 mg/dL"
                  value={editingProfile.targetGlucoseFasting || ""}
                  onChange={(e) => setEditingProfile({ ...editingProfile, targetGlucoseFasting: e.target.value })}
                  className="form-input"
                />
              </div>
              <div className="form-group">
                <label className="form-label">Target Glucose (Post-Meal)</label>
                <input
                  type="text"
                  placeholder="e.g. < 140 mg/dL"
                  value={editingProfile.targetGlucosePostMeal || ""}
                  onChange={(e) => setEditingProfile({ ...editingProfile, targetGlucosePostMeal: e.target.value })}
                  className="form-input"
                />
              </div>
            </div>

             <div className="grid-2">
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
              <div className="form-group">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
                  <label className="form-label" style={{ marginBottom: 0 }}>Daily Water Goal (ml)</label>
                  <label style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "0.775rem", cursor: "pointer", color: "var(--primary)" }}>
                    <input
                      type="checkbox"
                      checked={useAutoWater}
                      onChange={(e) => setUseAutoWater(e.target.checked)}
                      style={{ cursor: "pointer" }}
                    />
                    Auto-Calculate
                  </label>
                </div>
                <input
                  type="number"
                  placeholder="e.g. 2000"
                  value={editingProfile.targetWater || ""}
                  onChange={(e) => setEditingProfile({ ...editingProfile, targetWater: e.target.value ? Number(e.target.value) : undefined })}
                  className="form-input"
                  disabled={useAutoWater}
                  style={useAutoWater ? { opacity: 0.7, cursor: "not-allowed", backgroundColor: "var(--bg-secondary)" } : undefined}
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

            <div className="form-group">
              <label className="form-label">Doctor Name & Hospital</label>
              <input
                type="text"
                placeholder="e.g. Dr. Smith (Cardiology)"
                value={editingProfile.doctorName || ""}
                onChange={(e) => setEditingProfile({ ...editingProfile, doctorName: e.target.value })}
                className="form-input"
              />
            </div>

            <div className="grid-2">
              <div className="form-group">
                <label className="form-label" style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                  <Mail size={14} color="var(--primary)" /> Caretaker Email Address
                </label>
                <input
                  type="email"
                  placeholder="e.g. caretaker@example.com"
                  value={editingProfile.caretakerEmail || ""}
                  onChange={(e) => setEditingProfile({ ...editingProfile, caretakerEmail: e.target.value })}
                  className="form-input"
                />
              </div>
              <div className="form-group">
                <label className="form-label" style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                  <BellRing size={14} color="#f59e0b" /> Low Stock Caretaker Notification Mode
                </label>
                <select
                  value={editingProfile.lowStockCaretakerNotifyEnabled ? "true" : "false"}
                  onChange={(e) => setEditingProfile({ ...editingProfile, lowStockCaretakerNotifyEnabled: e.target.value === "true" })}
                  className="form-input"
                  style={{ background: "var(--bg-primary)", color: "var(--text-primary)" }}
                >
                  <option value="false">📅 Daily Email Digest (Everyday for low stock)</option>
                  <option value="true">⚡ Immediate Email Alert (Instant on low stock)</option>
                </select>
              </div>
            </div>

            <div className="grid-2">
              <div className="form-group">
                <label className="form-label" style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                  <KeyRound size={14} /> Security PIN (Default: 1234)
                </label>
                <input
                  type="password"
                  placeholder="Enter 4-digit PIN (e.g. 1234)"
                  value={editingProfile.pin || ""}
                  onChange={(e) => setEditingProfile({ ...editingProfile, pin: e.target.value })}
                  className="form-input"
                />
              </div>
              <div className="form-group">
                <label className="form-label" style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                  <Lock size={14} /> Privacy Lock Status
                </label>
                <select
                  value={editingProfile.isLocked ? "true" : "false"}
                  onChange={(e) => setEditingProfile({ ...editingProfile, isLocked: e.target.value === "true" })}
                  className="form-input"
                  style={{ background: "var(--bg-primary)", color: "var(--text-primary)" }}
                >
                  <option value="false">🔓 Unlocked (Public to Family)</option>
                  <option value="true">🔒 Locked (PIN Protected)</option>
                </select>
              </div>
            </div>

            <div style={{ display: "flex", gap: "10px", marginTop: "20px" }}>
              <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>
                Save Profile
              </button>
              <button type="button" onClick={() => setEditingProfile(null)} className="btn btn-secondary">
                Back
              </button>
            </div>
          </form>
        )}

        {/* Passcode Authentication Modal Gate */}
        {pendingAction && (
          <AdminAuthModal
            onSuccess={handleAuthSuccess}
            onClose={() => setPendingAction(null)}
            authMode={pendingAction.type === "select_profile" ? "user" : "admin"}
            targetProfileName={pendingAction.targetProfile?.name}
            targetProfileId={pendingAction.targetProfile?.id}
            title={
              pendingAction.type === "select_profile"
                ? `Unlock Profile: ${pendingAction.targetProfile?.name}`
                : `Passcode Required to ${pendingAction.type === "add" ? "Add New User" : pendingAction.type === "delete" ? "Delete User" : "Toggle Profile Lock"}`
            }
            expectedPin={
              pendingAction.type === "select_profile"
                ? (pendingAction.targetProfile?.pin || "1234")
                : undefined
            }
            subtitle={
              pendingAction.type === "select_profile"
                ? `Enter ${pendingAction.targetProfile?.name}'s User Password to switch control.`
                : "Restricted Admin Action: Enter Admin Password to proceed."
            }
          />
        )}

      </div>
    </div>
  );
};

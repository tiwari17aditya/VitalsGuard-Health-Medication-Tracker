import React, { useState, useEffect } from "react";
import { Users, Plus, Trash2, Edit2, Lock } from "lucide-react";
import { useApp } from "../context/AppContext";
import type { UserProfile } from "../types";
import { AdminAuthModal } from "./AdminAuthModal";

// Scientific water target calculator helper
const calculateAutoWaterTarget = (
  gender: string,
  weight: number,
  season: string,
  age: number
): number => {
  // Base: 35ml per kg of weight
  let target = weight * 35;

  // Age adjustments
  if (age < 14) {
    target *= 0.8;
  } else if (age > 60) {
    target *= 0.85;
  }

  // Gender adjustments
  if (gender.toLowerCase() === "male") {
    target += 300;
  } else if (gender.toLowerCase() === "other") {
    target += 150;
  }

  // Season adjustments
  if (season.toLowerCase() === "summer") {
    target += 500;
  } else if (season.toLowerCase() === "winter") {
    target -= 200;
  }

  // Bound target between 1000ml and 5000ml, rounded to nearest 50ml
  const rounded = Math.round(target / 50) * 50;
  return Math.min(5000, Math.max(1000, rounded));
};

interface ProfileModalProps {
  onClose: () => void;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({ onClose }) => {
  const { profiles, activeProfile, addOrUpdateProfile, deleteProfile, setActiveProfileId } = useApp();

  const [editingProfile, setEditingProfile] = useState<Partial<UserProfile> | null>(null);
  const [pendingAction, setPendingAction] = useState<{ type: "add" | "delete"; deleteId?: string } | null>(null);
  const [useAutoWater, setUseAutoWater] = useState<boolean>(true);

  // Auto calculate water target when metrics change
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

  // Adjust useAutoWater toggle when editing profile loads
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

  const isAdminAuthed = () => sessionStorage.getItem("vitalsguard_admin_authed") === "true";

  const handleCreateNewClick = () => {
    if (isAdminAuthed()) {
      startCreatingProfile();
    } else {
      setPendingAction({ type: "add" });
    }
  };

  const handleDeleteClick = (id: string) => {
    setPendingAction({ type: "delete", deleteId: id });
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
      notes: ""
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
    }
  };



  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProfile || !editingProfile.name) return;

    await addOrUpdateProfile(editingProfile as UserProfile);
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
              Switch or manage family member profiles. <em>(Adding or deleting users requires Admin Passcode)</em>
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
                    <h4 style={{ fontSize: "1.05rem" }}>{p.name}</h4>
                    <p style={{ fontSize: "0.825rem", color: "var(--text-secondary)" }}>
                      {p.role} • BP: {p.targetBP || "N/A"} • Water: {p.targetWater ? `${p.targetWater}ml` : "2000ml"} • Sugar: {p.targetGlucoseFasting || "N/A"} / {p.targetGlucosePostMeal || "N/A"}
                    </p>
                  </div>

                  <div style={{ display: "flex", gap: "6px" }}>
                    <button
                      onClick={() => { setActiveProfileId(p.id); onClose(); }}
                      className="btn btn-primary btn-sm"
                    >
                      Select Profile
                    </button>
                    <button
                      onClick={() => setEditingProfile(p)}
                      className="btn btn-secondary btn-sm"
                      title="Edit Profile"
                    >
                      <Edit2 size={14} />
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
              <Plus size={18} /> Add New Family User {isAdminAuthed() ? '' : <Lock size={14} style={{ opacity: 0.8 }} />}
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
            title={`Passcode Required to ${pendingAction.type === "add" ? "Add New User" : "Delete User"}`}
          />
        )}

      </div>
    </div>
  );
};

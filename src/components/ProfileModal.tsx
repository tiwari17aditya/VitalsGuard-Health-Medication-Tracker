import React, { useState } from "react";
import { Users, Plus, Trash2, Edit2, Lock } from "lucide-react";
import { useApp } from "../context/AppContext";
import type { UserProfile } from "../types";
import { AdminAuthModal } from "./AdminAuthModal";

interface ProfileModalProps {
  onClose: () => void;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({ onClose }) => {
  const { profiles, activeProfile, addOrUpdateProfile, deleteProfile, setActiveProfileId } = useApp();

  const [editingProfile, setEditingProfile] = useState<Partial<UserProfile> | null>(null);
  const [pendingAction, setPendingAction] = useState<{ type: "add" | "delete"; deleteId?: string } | null>(null);

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
                <label className="form-label">Daily Water Goal (ml)</label>
                <input
                  type="number"
                  placeholder="e.g. 2000"
                  value={editingProfile.targetWater || ""}
                  onChange={(e) => setEditingProfile({ ...editingProfile, targetWater: e.target.value ? Number(e.target.value) : undefined })}
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

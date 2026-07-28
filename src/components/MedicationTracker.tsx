import React, { useState } from "react";
import { Pill, Plus, CheckCircle, AlertTriangle, RefreshCw, Trash2, Clock } from "lucide-react";
import { useApp } from "../context/AppContext";
import type { Medication, FoodRelation } from "../types";

export const MedicationTracker: React.FC = () => {
  const { 
    activeProfile, 
    medications, 
    medicationLogs,
    takeMedication, 
    refillStock, 
    addOrUpdateMedication, 
    deleteMedication,
    sendRefillAlertEmail
  } = useApp();

  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [refillMedId, setRefillMedId] = useState<string | null>(null);
  const [addedPills, setAddedPills] = useState<number>(30);

  // Time picker state for taking dose (defaults to current HH:MM)
  const getCurrentHHMM = () => {
    const now = new Date();
    return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  };
  const [takeTime, setTakeTime] = useState<string>(getCurrentHHMM());

  // New Medication Form State
  const [name, setName] = useState("");
  const [dosage, setDosage] = useState("500 mg");
  const [frequency, setFrequency] = useState("Once Daily");
  const [stockCount, setStockCount] = useState(30);
  const [minStockAlert, setMinStockAlert] = useState(5);
  const [instructions, setInstructions] = useState("");
  const [foodRelation, setFoodRelation] = useState<FoodRelation>("After Food");

  if (!activeProfile) return null;

  const profileMeds = medications.filter(m => m.profileId === activeProfile.id);
  const profileLogs = medicationLogs.filter(l => l.profileId === activeProfile.id);

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const newMed: Medication = {
      id: `med-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      profileId: activeProfile.id,
      name,
      dosage,
      frequency,
      times: ["08:00"],
      stockCount,
      minStockAlert,
      instructions,
      foodRelation,
      active: true
    };

    await addOrUpdateMedication(newMed);
    setShowAddModal(false);
    setName("");
    setInstructions("");
  };

  const handleRefillSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!refillMedId || addedPills <= 0) return;
    await refillStock(refillMedId, addedPills);
    setRefillMedId(null);
  };

  return (
    <div className="glass-card">
      
      {/* Top Controls Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px", flexWrap: "wrap", gap: "12px" }}>
        <div>
          <h2 style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <Pill size={22} color="var(--primary)" /> Medication Inventory & Dose Timestamps
          </h2>
          <p style={{ fontSize: "0.875rem", color: "var(--text-secondary)" }}>
            Managing active prescriptions, exact intake times & stock count for {activeProfile.name}
          </p>
        </div>

        {/* Global Intake Time Selector */}
        <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap", width: "100%" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "6px", background: "var(--bg-primary)", padding: "6px 12px", borderRadius: "var(--radius-md)", border: "1px solid var(--border-color)", flex: "1 1 auto" }}>
            <Clock size={16} color="var(--primary)" />
            <span style={{ fontSize: "0.85rem", color: "var(--text-secondary)", fontWeight: "600" }}>Intake Time:</span>
            <input
              type="time"
              value={takeTime}
              onChange={(e) => setTakeTime(e.target.value)}
              className="form-input"
              style={{ width: "auto", padding: "2px 6px", fontSize: "0.9rem" }}
              title="Select exact time medication was taken"
            />
          </div>

          <button
            onClick={() => sendRefillAlertEmail(activeProfile.id)}
            className="btn btn-secondary btn-sm"
            style={{ flex: "1 1 auto" }}
            title="Dispatch email notification for low stock meds"
          >
            <AlertTriangle size={16} color="var(--warning)" /> Send Refill Mail Alert
          </button>

          <button
            onClick={() => setShowAddModal(true)}
            className="btn btn-primary btn-sm"
            style={{ flex: "1 1 auto" }}
          >
            <Plus size={16} /> Add Medication
          </button>
        </div>
      </div>

      {/* Medication Cards Grid */}
      {profileMeds.length === 0 ? (
        <div style={{ textAlign: "center", padding: "40px 20px", background: "var(--bg-primary)", borderRadius: "var(--radius-md)" }}>
          <Pill size={48} color="var(--text-muted)" style={{ marginBottom: "12px" }} />
          <h3>No medications configured for {activeProfile.name}</h3>
          <p style={{ color: "var(--text-secondary)", marginBottom: "16px" }}>
            Click "Add Medication" to register daily prescriptions and track remaining stock.
          </p>
          <button onClick={() => setShowAddModal(true)} className="btn btn-primary btn-sm">
            + Add First Medication
          </button>
        </div>
      ) : (
        <div className="grid-2">
          {profileMeds.map(med => {
            const isLow = med.stockCount <= med.minStockAlert;
            const stockPercent = Math.min(100, Math.round((med.stockCount / 30) * 100));

            const lastLog = profileLogs.find(l => l.medicationId === med.id && l.status === "taken");
            const lastTakenFormatted = lastLog ? new Date(lastLog.timestamp).toLocaleString([], { 
              month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' 
            }) : null;

            return (
              <div 
                key={med.id} 
                style={{
                  background: "var(--bg-primary)",
                  border: isLow ? "2px solid #ef4444" : "1px solid var(--border-color)",
                  borderRadius: "var(--radius-md)",
                  padding: "16px",
                  position: "relative",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between"
                }}
              >
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "8px", flexWrap: "wrap", gap: "6px" }}>
                    <div>
                      <h3 style={{ fontSize: "1.1rem", display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap" }}>
                        {med.name}
                        <span className="badge badge-primary">{med.dosage}</span>
                      </h3>
                      <p style={{ fontSize: "0.825rem", color: "var(--text-secondary)", marginTop: "2px" }}>
                        {med.frequency} • {med.foodRelation}
                      </p>
                    </div>

                    {isLow ? (
                      <span className="badge badge-danger">
                        <AlertTriangle size={12} /> Low Stock ({med.stockCount})
                      </span>
                    ) : (
                      <span className="badge badge-success">
                        In Stock ({med.stockCount})
                      </span>
                    )}
                  </div>

                  <div style={{ marginBottom: "12px", fontSize: "0.825rem", color: lastTakenFormatted ? "var(--success)" : "var(--text-muted)", display: "flex", alignItems: "center", gap: "6px" }}>
                    <Clock size={14} />
                    {lastTakenFormatted ? (
                      <span><strong>Last Taken:</strong> {lastTakenFormatted}</span>
                    ) : (
                      <span>No dose logged yet today</span>
                    )}
                  </div>

                  {med.instructions && (
                    <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginBottom: "14px", background: "var(--bg-card)", padding: "8px 12px", borderRadius: "var(--radius-sm)" }}>
                      💡 {med.instructions}
                    </p>
                  )}

                  <div style={{ marginBottom: "16px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.825rem", color: "var(--text-secondary)", marginBottom: "4px" }}>
                      <span>Inventory Level</span>
                      <span style={{ fontWeight: "bold", color: isLow ? "#ef4444" : "var(--text-primary)" }}>
                        {med.stockCount} Pills Left
                      </span>
                    </div>
                    <div style={{ width: "100%", height: "8px", background: "var(--bg-card-hover)", borderRadius: "var(--radius-full)", overflow: "hidden" }}>
                      <div 
                        style={{ 
                          width: `${stockPercent}%`, 
                          height: "100%", 
                          background: isLow ? "#ef4444" : "linear-gradient(90deg, #10b981, #3b82f6)",
                          transition: "width 0.3s ease"
                        }} 
                      />
                    </div>
                  </div>
                </div>

                <div style={{ display: "flex", gap: "8px", marginTop: "12px", flexWrap: "wrap" }}>
                  <button
                    onClick={() => takeMedication(med.id, takeTime)}
                    className="btn btn-success"
                    style={{ flex: "1 1 100%" }}
                    disabled={med.stockCount <= 0}
                    title={`Log dose taken at ${takeTime}`}
                  >
                    <CheckCircle size={18} /> Take Dose at {takeTime} (-1 Pill)
                  </button>

                  <button
                    onClick={() => { setRefillMedId(med.id); setAddedPills(30); }}
                    className="btn btn-secondary btn-sm"
                    style={{ flex: "1 1 auto" }}
                  >
                    <RefreshCw size={14} /> Refill
                  </button>

                  <button
                    onClick={() => deleteMedication(med.id)}
                    className="btn btn-secondary btn-sm"
                    style={{ color: "#ef4444", flex: "0 0 auto" }}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>

              </div>
            );
          })}
        </div>
      )}

      {/* ADD MEDICATION MODAL */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h2 style={{ marginBottom: "16px" }}>Add Medication for {activeProfile.name}</h2>
            
            <form onSubmit={handleAddSubmit}>
              <div className="form-group">
                <label className="form-label">Medication Name</label>
                <input
                  type="text"
                  placeholder="e.g. Metformin, Amlodipine..."
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="form-input"
                  required
                />
              </div>

              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Dosage</label>
                  <input
                    type="text"
                    placeholder="e.g. 500 mg, 5 mg"
                    value={dosage}
                    onChange={(e) => setDosage(e.target.value)}
                    className="form-input"
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Frequency</label>
                  <input
                    type="text"
                    placeholder="e.g. Twice Daily"
                    value={frequency}
                    onChange={(e) => setFrequency(e.target.value)}
                    className="form-input"
                    required
                  />
                </div>
              </div>

              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Current Stock Count</label>
                  <input
                    type="number"
                    min="1"
                    value={stockCount}
                    onChange={(e) => setStockCount(Number(e.target.value))}
                    className="form-input"
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Min Stock Alert Threshold</label>
                  <input
                    type="number"
                    min="1"
                    value={minStockAlert}
                    onChange={(e) => setMinStockAlert(Number(e.target.value))}
                    className="form-input"
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Relation to Food</label>
                <select
                  value={foodRelation}
                  onChange={(e) => setFoodRelation(e.target.value as FoodRelation)}
                  className="form-select"
                >
                  <option value="Before Food">Before Food</option>
                  <option value="After Food">After Food</option>
                  <option value="With Food">With Food</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Instructions / Doctor Notes</label>
                <textarea
                  placeholder="e.g. Take with water after breakfast..."
                  value={instructions}
                  onChange={(e) => setInstructions(e.target.value)}
                  className="form-textarea"
                  rows={2}
                />
              </div>

              <div style={{ display: "flex", gap: "10px", marginTop: "20px" }}>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>
                  Save Prescription
                </button>
                <button type="button" onClick={() => setShowAddModal(false)} className="btn btn-secondary">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* REFILL STOCK MODAL */}
      {refillMedId && (
        <div className="modal-overlay" onClick={() => setRefillMedId(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h2 style={{ marginBottom: "16px" }}>Refill Stock Inventory</h2>
            <form onSubmit={handleRefillSubmit}>
              <div className="form-group">
                <label className="form-label">Number of Pills Added</label>
                <input
                  type="number"
                  min="1"
                  max="500"
                  value={addedPills}
                  onChange={(e) => setAddedPills(Number(e.target.value))}
                  className="form-input"
                  required
                />
              </div>

              <div style={{ display: "flex", gap: "10px", marginTop: "20px" }}>
                <button type="submit" className="btn btn-success" style={{ flex: 1 }}>
                  Confirm Refill
                </button>
                <button type="button" onClick={() => setRefillMedId(null)} className="btn btn-secondary">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

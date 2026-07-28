import React, { useState } from "react";
import { Pill, Plus, CheckCircle, AlertTriangle, RefreshCw, Trash2 } from "lucide-react";
import { useApp } from "../context/AppContext";
import type { Medication, FoodRelation } from "../types";

export const MedicationTracker: React.FC = () => {
  const { 
    activeProfile, 
    medications, 
    takeMedication, 
    refillStock, 
    addOrUpdateMedication, 
    deleteMedication,
    sendRefillAlertEmail
  } = useApp();

  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [refillMedId, setRefillMedId] = useState<string | null>(null);
  const [addedPills, setAddedPills] = useState<number>(30);

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
    // Reset Form
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
            <Pill size={22} color="var(--primary)" /> Medication Inventory & Adherence
          </h2>
          <p style={{ fontSize: "0.875rem", color: "var(--text-secondary)" }}>
            Managing active prescriptions & remaining stock for {activeProfile.name}
          </p>
        </div>

        <div style={{ display: "flex", gap: "8px" }}>
          <button
            onClick={() => sendRefillAlertEmail(activeProfile.id)}
            className="btn btn-secondary btn-sm"
            title="Dispatch email notification for low stock meds"
          >
            <AlertTriangle size={16} color="var(--warning)" /> Send Refill Mail Alert
          </button>

          <button
            onClick={() => setShowAddModal(true)}
            className="btn btn-primary btn-sm"
          >
            <Plus size={16} /> Add New Medication
          </button>
        </div>
      </div>

      {/* Medication Cards Grid */}
      {profileMeds.length === 0 ? (
        <div style={{ textAlign: "center", padding: "40px 20px", background: "var(--bg-primary)", borderRadius: "var(--radius-md)" }}>
          <Pill size={48} color="var(--text-muted)" style={{ marginBottom: "12px" }} />
          <h3>No medications configured for {activeProfile.name}</h3>
          <p style={{ color: "var(--text-secondary)", marginBottom: "16px" }}>
            Click "Add New Medication" to register daily prescriptions and track remaining stock.
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

            return (
              <div 
                key={med.id} 
                style={{
                  background: "var(--bg-primary)",
                  border: isLow ? "2px solid #ef4444" : "1px solid var(--border-color)",
                  borderRadius: "var(--radius-md)",
                  padding: "18px",
                  position: "relative",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between"
                }}
              >
                <div>
                  {/* Card Title Header */}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "8px" }}>
                    <div>
                      <h3 style={{ fontSize: "1.15rem", display: "flex", alignItems: "center", gap: "8px" }}>
                        {med.name}
                        <span className="badge badge-primary">{med.dosage}</span>
                      </h3>
                      <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", marginTop: "2px" }}>
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

                  {/* Instructions */}
                  {med.instructions && (
                    <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginBottom: "14px", background: "var(--bg-card)", padding: "8px 12px", borderRadius: "var(--radius-sm)" }}>
                      💡 {med.instructions}
                    </p>
                  )}

                  {/* Stock Inventory Bar */}
                  <div style={{ marginBottom: "16px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.825rem", color: "var(--text-secondary)", marginBottom: "4px" }}>
                      <span>Inventory Level</span>
                      <span style={{ fontWeight: "bold", color: isLow ? "#ef4444" : "var(--text-primary)" }}>
                        {med.stockCount} Pills Left (Alert at &le; {med.minStockAlert})
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

                {/* Bottom Action Controls */}
                <div style={{ display: "flex", gap: "8px", marginTop: "12px" }}>
                  <button
                    onClick={() => takeMedication(med.id)}
                    className="btn btn-success"
                    style={{ flex: 1 }}
                    disabled={med.stockCount <= 0}
                  >
                    <CheckCircle size={18} /> Take Dose (-1 Pill)
                  </button>

                  <button
                    onClick={() => { setRefillMedId(med.id); setAddedPills(30); }}
                    className="btn btn-secondary btn-sm"
                    title="Add stock inventory"
                  >
                    <RefreshCw size={16} /> Refill
                  </button>

                  <button
                    onClick={() => deleteMedication(med.id)}
                    className="btn btn-secondary btn-sm"
                    style={{ color: "#ef4444" }}
                    title="Delete prescription"
                  >
                    <Trash2 size={16} />
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

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
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
                    placeholder="e.g. Twice Daily, Once Daily"
                    value={frequency}
                    onChange={(e) => setFrequency(e.target.value)}
                    className="form-input"
                    required
                  />
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
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
                <label className="form-label">Number of Pills / Tablets Added</label>
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

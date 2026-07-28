import React, { useState } from "react";
import { Activity, Heart, Plus, Calendar, Clock } from "lucide-react";
import { useApp } from "../context/AppContext";
import type { MealType } from "../types";

export const VitalsTracker: React.FC = () => {
  const { activeProfile, glucoseLogs, addGlucoseLog, bpLogs, addBPLog } = useApp();

  const [activeSubTab, setActiveSubTab] = useState<"glucose" | "bp">("glucose");

  const getCurrentHHMM = () => {
    const now = new Date();
    return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  };

  // Form states for Glucose
  const [glucoseVal, setGlucoseVal] = useState<number>(105);
  const [mealType, setMealType] = useState<MealType>("fasting");
  const [glucoseNotes, setGlucoseNotes] = useState<string>("");
  const [glucoseTime, setGlucoseTime] = useState<string>(getCurrentHHMM());

  // Form states for Blood Pressure
  const [systolic, setSystolic] = useState<number>(120);
  const [diastolic, setDiastolic] = useState<number>(80);
  const [pulse, setPulse] = useState<number>(72);
  const [bpNotes, setBpNotes] = useState<string>("");
  const [bpTime, setBpTime] = useState<string>(getCurrentHHMM());

  if (!activeProfile) return null;

  const profileGlucose = glucoseLogs.filter(g => g.profileId === activeProfile.id);
  const profileBP = bpLogs.filter(b => b.profileId === activeProfile.id);

  const handleGlucoseSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!glucoseVal || glucoseVal <= 0) return;
    await addGlucoseLog(glucoseVal, mealType, glucoseNotes, glucoseTime);
    setGlucoseNotes("");
  };

  const handleBPSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!systolic || !diastolic) return;
    await addBPLog(systolic, diastolic, pulse, bpNotes, bpTime);
    setBpNotes("");
  };

  return (
    <div className="glass-card">
      
      {/* Tab Controls */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px", flexWrap: "wrap", gap: "12px" }}>
        <div style={{ display: "flex", gap: "8px" }}>
          <button
            onClick={() => setActiveSubTab("glucose")}
            className={`btn ${activeSubTab === "glucose" ? "btn-primary" : "btn-secondary"}`}
          >
            <Activity size={18} /> Diabetes & Blood Sugar
          </button>
          <button
            onClick={() => setActiveSubTab("bp")}
            className={`btn ${activeSubTab === "bp" ? "btn-primary" : "btn-secondary"}`}
          >
            <Heart size={18} /> Blood Pressure (BP)
          </button>
        </div>

        <div style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>
          Targets for <strong>{activeProfile.name}</strong>: Glucose <code>{activeProfile.targetGlucoseFasting || "70-110 mg/dL"}</code> • BP <code>{activeProfile.targetBP || "120/80 mmHg"}</code>
        </div>
      </div>

      {/* SUB-TAB 1: GLUCOSE TRACKER */}
      {activeSubTab === "glucose" && (
        <div className="grid-2">
          
          {/* Form */}
          <div style={{ background: "var(--bg-primary)", padding: "20px", borderRadius: "var(--radius-md)", border: "1px solid var(--border-color)" }}>
            <h3 style={{ marginBottom: "16px", display: "flex", alignItems: "center", gap: "8px" }}>
              <Plus size={18} color="var(--primary)" /> Log Glucose Reading
            </h3>

            <form onSubmit={handleGlucoseSubmit}>
              <div className="form-group">
                <label className="form-label">Blood Sugar Value (mg/dL)</label>
                <input
                  type="number"
                  min="20"
                  max="600"
                  value={glucoseVal}
                  onChange={(e) => setGlucoseVal(Number(e.target.value))}
                  className="form-input"
                  style={{ fontSize: "1.2rem", fontWeight: "bold" }}
                  required
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div className="form-group">
                  <label className="form-label">Meal Routine</label>
                  <select
                    value={mealType}
                    onChange={(e) => setMealType(e.target.value as MealType)}
                    className="form-select"
                  >
                    <option value="fasting">Fasting (Morning)</option>
                    <option value="post_meal">Post Meal (After Breakfast/Lunch)</option>
                    <option value="before_meal">Before Meal</option>
                    <option value="bedtime">Bedtime (Night)</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label" style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                    <Clock size={14} /> Intake / Record Time
                  </label>
                  <input
                    type="time"
                    value={glucoseTime}
                    onChange={(e) => setGlucoseTime(e.target.value)}
                    className="form-input"
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Notes (Food eaten, symptoms)</label>
                <input
                  type="text"
                  placeholder="e.g. Ate 2 rotis + dal, feeling active"
                  value={glucoseNotes}
                  onChange={(e) => setGlucoseNotes(e.target.value)}
                  className="form-input"
                />
              </div>

              <button type="submit" className="btn btn-primary" style={{ width: "100%", marginTop: "12px" }}>
                Save Glucose Reading at {glucoseTime}
              </button>
            </form>
          </div>

          {/* Table History with Timestamps */}
          <div style={{ background: "var(--bg-primary)", padding: "20px", borderRadius: "var(--radius-md)", border: "1px solid var(--border-color)" }}>
            <h3 style={{ marginBottom: "16px", display: "flex", alignItems: "center", gap: "8px" }}>
              <Calendar size={18} color="var(--primary)" /> Glucose History & Doctor Timestamps
            </h3>

            {profileGlucose.length === 0 ? (
              <p style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>No blood glucose logs yet.</p>
            ) : (
              <div style={{ maxHeight: "320px", overflowY: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.875rem" }}>
                  <thead>
                    <tr style={{ borderBottom: "1px solid var(--border-color)", textTransform: "uppercase", fontSize: "0.75rem", color: "var(--text-secondary)" }}>
                      <th style={{ padding: "8px", textAlign: "left" }}>Exact Date & Time</th>
                      <th style={{ padding: "8px", textAlign: "left" }}>Reading</th>
                      <th style={{ padding: "8px", textAlign: "left" }}>Routine</th>
                      <th style={{ padding: "8px", textAlign: "left" }}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {profileGlucose.map(g => (
                      <tr key={g.id} style={{ borderBottom: "1px solid var(--border-color)" }}>
                        <td style={{ padding: "8px", fontSize: "0.8rem" }}>
                          {new Date(g.timestamp).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </td>
                        <td style={{ padding: "8px", fontWeight: "bold" }}>{g.value} mg/dL</td>
                        <td style={{ padding: "8px", textTransform: "capitalize" }}>{g.mealType.replace('_', ' ')}</td>
                        <td style={{ padding: "8px" }}>
                          <span className={`badge ${g.status.includes('High') || g.status.includes('Low') ? 'badge-danger' : 'badge-success'}`}>
                            {g.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

        </div>
      )}

      {/* SUB-TAB 2: BLOOD PRESSURE TRACKER */}
      {activeSubTab === "bp" && (
        <div className="grid-2">
          
          {/* Form */}
          <div style={{ background: "var(--bg-primary)", padding: "20px", borderRadius: "var(--radius-md)", border: "1px solid var(--border-color)" }}>
            <h3 style={{ marginBottom: "16px", display: "flex", alignItems: "center", gap: "8px" }}>
              <Plus size={18} color="var(--primary)" /> Log Blood Pressure (BP)
            </h3>

            <form onSubmit={handleBPSubmit}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "10px" }}>
                <div className="form-group">
                  <label className="form-label">Systolic (SYS)</label>
                  <input
                    type="number"
                    min="50"
                    max="300"
                    value={systolic}
                    onChange={(e) => setSystolic(Number(e.target.value))}
                    className="form-input"
                    style={{ fontSize: "1.1rem", fontWeight: "bold" }}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Diastolic (DIA)</label>
                  <input
                    type="number"
                    min="30"
                    max="200"
                    value={diastolic}
                    onChange={(e) => setDiastolic(Number(e.target.value))}
                    className="form-input"
                    style={{ fontSize: "1.1rem", fontWeight: "bold" }}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Pulse (BPM)</label>
                  <input
                    type="number"
                    min="40"
                    max="220"
                    value={pulse}
                    onChange={(e) => setPulse(Number(e.target.value))}
                    className="form-input"
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label" style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                  <Clock size={14} /> Intake / Measurement Time
                </label>
                <input
                  type="time"
                  value={bpTime}
                  onChange={(e) => setBpTime(e.target.value)}
                  className="form-input"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Notes</label>
                <input
                  type="text"
                  placeholder="e.g. Taken after 15 min rest in morning"
                  value={bpNotes}
                  onChange={(e) => setBpNotes(e.target.value)}
                  className="form-input"
                />
              </div>

              <button type="submit" className="btn btn-primary" style={{ width: "100%", marginTop: "12px" }}>
                Save BP Reading at {bpTime}
              </button>
            </form>
          </div>

          {/* Table History with Timestamps */}
          <div style={{ background: "var(--bg-primary)", padding: "20px", borderRadius: "var(--radius-md)", border: "1px solid var(--border-color)" }}>
            <h3 style={{ marginBottom: "16px", display: "flex", alignItems: "center", gap: "8px" }}>
              <Calendar size={18} color="var(--primary)" /> BP History & Doctor Timestamps
            </h3>

            {profileBP.length === 0 ? (
              <p style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>No blood pressure logs yet.</p>
            ) : (
              <div style={{ maxHeight: "320px", overflowY: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.875rem" }}>
                  <thead>
                    <tr style={{ borderBottom: "1px solid var(--border-color)", textTransform: "uppercase", fontSize: "0.75rem", color: "var(--text-secondary)" }}>
                      <th style={{ padding: "8px", textAlign: "left" }}>Exact Date & Time</th>
                      <th style={{ padding: "8px", textAlign: "left" }}>Reading</th>
                      <th style={{ padding: "8px", textAlign: "left" }}>Pulse</th>
                      <th style={{ padding: "8px", textAlign: "left" }}>AHA Category</th>
                    </tr>
                  </thead>
                  <tbody>
                    {profileBP.map(b => (
                      <tr key={b.id} style={{ borderBottom: "1px solid var(--border-color)" }}>
                        <td style={{ padding: "8px", fontSize: "0.8rem" }}>
                          {new Date(b.timestamp).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </td>
                        <td style={{ padding: "8px", fontWeight: "bold" }}>{b.systolic}/{b.diastolic} mmHg</td>
                        <td style={{ padding: "8px" }}>{b.pulse} bpm</td>
                        <td style={{ padding: "8px" }}>
                          <span className={`badge ${b.category.includes('Crisis') || b.category.includes('Stage 2') ? 'badge-danger' : 'badge-success'}`}>
                            {b.category}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

        </div>
      )}

    </div>
  );
};

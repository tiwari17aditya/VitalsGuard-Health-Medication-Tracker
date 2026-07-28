import React, { useState } from "react";
import { Activity, Droplet, HeartPulse, Plus, Calendar, Info } from "lucide-react";
import { useApp } from "../context/AppContext";
import type { MealType } from "../types";
import { APP_CONFIG } from "../config/app.config";

export const VitalsTracker: React.FC = () => {
  const { activeProfile, glucoseLogs, addGlucoseLog, bpLogs, addBPLog } = useApp();

  // Tab State: "glucose" vs "bp"
  const [vitalsTab, setVitalsTab] = useState<"glucose" | "bp">("glucose");

  // Form States - Glucose
  const [glucoseVal, setGlucoseVal] = useState<number>(105);
  const [mealType, setMealType] = useState<MealType>("fasting");
  const [glucoseNotes, setGlucoseNotes] = useState<string>("");

  // Form States - BP
  const [systolic, setSystolic] = useState<number>(120);
  const [diastolic, setDiastolic] = useState<number>(80);
  const [pulse, setPulse] = useState<number>(72);
  const [bpNotes, setBpNotes] = useState<string>("");

  if (!activeProfile) return null;

  const profileGlucose = glucoseLogs.filter(g => g.profileId === activeProfile.id);
  const profileBP = bpLogs.filter(b => b.profileId === activeProfile.id);

  const handleGlucoseSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (glucoseVal <= 0) return;
    await addGlucoseLog(glucoseVal, mealType, glucoseNotes);
    setGlucoseNotes("");
  };

  const handleBPSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (systolic <= 0 || diastolic <= 0) return;
    await addBPLog(systolic, diastolic, pulse, bpNotes);
    setBpNotes("");
  };

  return (
    <div className="glass-card">
      
      {/* Vitals Tab Controls */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px", flexWrap: "wrap", gap: "12px" }}>
        <div style={{ display: "flex", gap: "8px" }}>
          <button
            onClick={() => setVitalsTab("glucose")}
            className={`btn ${vitalsTab === "glucose" ? "btn-primary" : "btn-secondary"}`}
          >
            <Droplet size={18} /> Diabetes & Blood Sugar
          </button>
          <button
            onClick={() => setVitalsTab("bp")}
            className={`btn ${vitalsTab === "bp" ? "btn-primary" : "btn-secondary"}`}
          >
            <HeartPulse size={18} /> Blood Pressure (BP)
          </button>
        </div>

        <div className="badge badge-primary">
          Target: {vitalsTab === "glucose" ? activeProfile.targetGlucoseFasting || "70-110 mg/dL" : activeProfile.targetBP || "120/80 mmHg"}
        </div>
      </div>

      {vitalsTab === "glucose" ? (
        <div>
          {/* Glucose Form & Visual Summary Grid */}
          <div className="grid-2" style={{ marginBottom: "24px" }}>
            
            {/* Quick Log Form */}
            <form onSubmit={handleGlucoseSubmit} style={{ background: "var(--bg-primary)", padding: "16px", borderRadius: "var(--radius-md)", border: "1px solid var(--border-color)" }}>
              <h3 style={{ marginBottom: "12px", display: "flex", alignItems: "center", gap: "8px" }}>
                <Plus size={18} color="var(--primary)" /> Log Glucose Reading
              </h3>

              <div className="form-group">
                <label className="form-label">Blood Sugar Value (mg/dL)</label>
                <input
                  type="number"
                  min="20"
                  max="600"
                  value={glucoseVal}
                  onChange={(e) => setGlucoseVal(Number(e.target.value))}
                  className="form-input"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Meal Routine</label>
                <select
                  value={mealType}
                  onChange={(e) => setMealType(e.target.value as MealType)}
                  className="form-select"
                >
                  <option value="fasting">Fasting (Morning before food)</option>
                  <option value="post_meal">Post-Meal (2 Hours after food)</option>
                  <option value="bedtime">Bedtime</option>
                  <option value="random">Random Check</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Notes (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Ate sweets, felt dizzy..."
                  value={glucoseNotes}
                  onChange={(e) => setGlucoseNotes(e.target.value)}
                  className="form-input"
                />
              </div>

              <button type="submit" className="btn btn-primary" style={{ width: "100%" }}>
                Save Glucose Reading
              </button>
            </form>

            {/* Medical Classification Reference Card */}
            <div style={{ background: "var(--bg-primary)", padding: "16px", borderRadius: "var(--radius-md)", border: "1px solid var(--border-color)" }}>
              <h3 style={{ marginBottom: "12px", display: "flex", alignItems: "center", gap: "8px" }}>
                <Info size={18} color="var(--accent)" /> ADA Glucose Reference Standards
              </h3>
              
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {APP_CONFIG.medicalStandards.bloodGlucose.ranges.fasting.map(r => (
                  <div key={r.name} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 12px", borderRadius: "var(--radius-sm)", background: r.badgeBg }}>
                    <span style={{ fontWeight: "600", color: r.color }}>{r.name}</span>
                    <span style={{ fontSize: "0.875rem", fontWeight: "bold" }}>{r.min} - {r.max} mg/dL</span>
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* Historical Logs Table */}
          <h3 style={{ marginBottom: "12px", display: "flex", alignItems: "center", gap: "8px" }}>
            <Calendar size={18} /> Glucose Log History for {activeProfile.name}
          </h3>

          <div className="table-wrapper">
            <table className="table">
              <thead>
                <tr>
                  <th>Date & Time</th>
                  <th>Value</th>
                  <th>Meal Routine</th>
                  <th>Status</th>
                  <th>Notes</th>
                </tr>
              </thead>
              <tbody>
                {profileGlucose.length === 0 ? (
                  <tr>
                    <td colSpan={5} style={{ textAlign: "center", color: "var(--text-muted)", padding: "24px" }}>
                      No blood glucose readings logged yet for {activeProfile.name}.
                    </td>
                  </tr>
                ) : (
                  profileGlucose.slice(0, 10).map(log => (
                    <tr key={log.id}>
                      <td>{new Date(log.timestamp).toLocaleString()}</td>
                      <td style={{ fontSize: "1.1rem", fontWeight: "bold" }}>{log.value} mg/dL</td>
                      <td style={{ textTransform: "capitalize" }}>{log.mealType.replace("_", " ")}</td>
                      <td>
                        <span className={`badge ${log.status.includes("Low") || log.status.includes("High") ? "badge-danger" : "badge-success"}`}>
                          {log.status}
                        </span>
                      </td>
                      <td>{log.notes || "-"}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div>
          {/* BP Form & Visual Summary Grid */}
          <div className="grid-2" style={{ marginBottom: "24px" }}>
            
            {/* Quick Log BP Form */}
            <form onSubmit={handleBPSubmit} style={{ background: "var(--bg-primary)", padding: "16px", borderRadius: "var(--radius-md)", border: "1px solid var(--border-color)" }}>
              <h3 style={{ marginBottom: "12px", display: "flex", alignItems: "center", gap: "8px" }}>
                <Plus size={18} color="var(--primary)" /> Log Blood Pressure Reading
              </h3>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div className="form-group">
                  <label className="form-label">Systolic (Top SYS)</label>
                  <input
                    type="number"
                    min="50"
                    max="300"
                    value={systolic}
                    onChange={(e) => setSystolic(Number(e.target.value))}
                    className="form-input"
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Diastolic (Bottom DIA)</label>
                  <input
                    type="number"
                    min="30"
                    max="200"
                    value={diastolic}
                    onChange={(e) => setDiastolic(Number(e.target.value))}
                    className="form-input"
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Heart Pulse (bpm)</label>
                <input
                  type="number"
                  min="30"
                  max="220"
                  value={pulse}
                  onChange={(e) => setPulse(Number(e.target.value))}
                  className="form-input"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Notes (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. After morning walk..."
                  value={bpNotes}
                  onChange={(e) => setBpNotes(e.target.value)}
                  className="form-input"
                />
              </div>

              <button type="submit" className="btn btn-primary" style={{ width: "100%" }}>
                Save Blood Pressure Reading
              </button>
            </form>

            {/* ACC/AHA BP Category Reference */}
            <div style={{ background: "var(--bg-primary)", padding: "16px", borderRadius: "var(--radius-md)", border: "1px solid var(--border-color)" }}>
              <h3 style={{ marginBottom: "12px", display: "flex", alignItems: "center", gap: "8px" }}>
                <Activity size={18} color="var(--primary)" /> AHA Blood Pressure Categories
              </h3>
              
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {APP_CONFIG.medicalStandards.bloodPressure.categories.map(c => (
                  <div key={c.name} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 12px", borderRadius: "var(--radius-sm)", background: c.badgeBg }}>
                    <span style={{ fontWeight: "600", color: c.color }}>{c.name}</span>
                    <span style={{ fontSize: "0.85rem", fontWeight: "bold" }}>SYS &lt; {c.sysMax} / DIA &lt; {c.diaMax}</span>
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* BP History Table */}
          <h3 style={{ marginBottom: "12px", display: "flex", alignItems: "center", gap: "8px" }}>
            <Calendar size={18} /> Blood Pressure History for {activeProfile.name}
          </h3>

          <div className="table-wrapper">
            <table className="table">
              <thead>
                <tr>
                  <th>Date & Time</th>
                  <th>Reading (SYS / DIA)</th>
                  <th>Pulse</th>
                  <th>Category</th>
                  <th>Notes</th>
                </tr>
              </thead>
              <tbody>
                {profileBP.length === 0 ? (
                  <tr>
                    <td colSpan={5} style={{ textAlign: "center", color: "var(--text-muted)", padding: "24px" }}>
                      No blood pressure logs recorded yet for {activeProfile.name}.
                    </td>
                  </tr>
                ) : (
                  profileBP.slice(0, 10).map(log => (
                    <tr key={log.id}>
                      <td>{new Date(log.timestamp).toLocaleString()}</td>
                      <td style={{ fontSize: "1.1rem", fontWeight: "bold" }}>{log.systolic} / {log.diastolic} mmHg</td>
                      <td>{log.pulse} bpm</td>
                      <td>
                        <span className={`badge ${log.category.includes("Crisis") || log.category.includes("Stage 2") ? "badge-danger" : log.category === "Normal" ? "badge-success" : "badge-warning"}`}>
                          {log.category}
                        </span>
                      </td>
                      <td>{log.notes || "-"}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  );
};

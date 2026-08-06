import React, { useState, useMemo } from "react";
import { Activity, Heart, Plus, Calendar, Clock, Trash2, TrendingUp, AlertTriangle, CheckCircle2, Filter } from "lucide-react";
import { useApp } from "../context/AppContext";
import type { MealType } from "../types";
import { AdminAuthModal } from "./AdminAuthModal";

export const VitalsTracker: React.FC = () => {
  const { activeProfile, glucoseLogs, addGlucoseLog, deleteGlucoseLog, bpLogs, addBPLog } = useApp();

  const [activeSubTab, setActiveSubTab] = useState<"glucose" | "bp">("glucose");

  const getCurrentHHMM = () => {
    const now = new Date();
    return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  };

  const getTodayYMD = () => {
    return new Date().toISOString().split("T")[0];
  };

  // Form states for Glucose
  const [glucoseVal, setGlucoseVal] = useState<number>(105);
  const [mealType, setMealType] = useState<MealType>("fasting");
  const [glucoseNotes, setGlucoseNotes] = useState<string>("");
  const [glucoseTime, setGlucoseTime] = useState<string>(getCurrentHHMM());
  const [glucoseDate, setGlucoseDate] = useState<string>(getTodayYMD());
  const [glucoseFilter, setGlucoseFilter] = useState<string>("all");

  // Admin Auth state for deleting glucose logs
  const [pendingDeleteLogId, setPendingDeleteLogId] = useState<string | null>(null);

  // Form states for Blood Pressure
  const [systolic, setSystolic] = useState<number>(120);
  const [diastolic, setDiastolic] = useState<number>(80);
  const [pulse, setPulse] = useState<number>(72);
  const [bpNotes, setBpNotes] = useState<string>("");
  const [bpTime, setBpTime] = useState<string>(getCurrentHHMM());

  const profileGlucose = useMemo(() => {
    if (!activeProfile) return [];
    return glucoseLogs.filter(g => g.profileId === activeProfile.id);
  }, [glucoseLogs, activeProfile?.id]);

  const profileBP = useMemo(() => {
    if (!activeProfile) return [];
    return bpLogs.filter(b => b.profileId === activeProfile.id);
  }, [bpLogs, activeProfile?.id]);

  // Filtered Glucose logs
  const displayedGlucoseLogs = useMemo(() => {
    if (glucoseFilter === "all") return profileGlucose;
    return profileGlucose.filter(g => g.mealType === glucoseFilter);
  }, [profileGlucose, glucoseFilter]);

  if (!activeProfile) return null;

  // KPI Calculations for Diabetes
  const fastingLogs = profileGlucose.filter(g => g.mealType === "fasting");
  const postMealLogs = profileGlucose.filter(g => g.mealType === "post_meal");
  
  const avgFasting = fastingLogs.length > 0
    ? Math.round(fastingLogs.reduce((sum, g) => sum + g.value, 0) / fastingLogs.length)
    : null;

  const avgPostMeal = postMealLogs.length > 0
    ? Math.round(postMealLogs.reduce((sum, g) => sum + g.value, 0) / postMealLogs.length)
    : null;

  const normalCount = profileGlucose.filter(g => !g.status.includes("High") && !g.status.includes("Low")).length;
  const targetPct = profileGlucose.length > 0 ? Math.round((normalCount / profileGlucose.length) * 100) : 100;
  const alertCount = profileGlucose.filter(g => g.value < 70 || g.value > 200).length;

  const handleGlucoseSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!glucoseVal || glucoseVal <= 0) return;
    await addGlucoseLog(glucoseVal, mealType, glucoseNotes, glucoseTime, glucoseDate);
    setGlucoseNotes("");
  };

  const handleDeleteGlucoseClick = (logId: string) => {
    if (activeProfile.isLocked && sessionStorage.getItem(`vitalsguard_unlocked_${activeProfile.id}`) !== "true") {
      setPendingDeleteLogId(logId);
    } else {
      deleteGlucoseLog(logId);
    }
  };

  const handleAuthDeleteSuccess = () => {
    if (pendingDeleteLogId) {
      deleteGlucoseLog(pendingDeleteLogId);
      setPendingDeleteLogId(null);
    }
  };

  const handleBPSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!systolic || !diastolic) return;
    await addBPLog(systolic, diastolic, pulse, bpNotes, bpTime);
    setBpNotes("");
  };

  return (
    <div className="glass-card">
      
      {/* Sub-Tab Navigation Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px", flexWrap: "wrap", gap: "12px" }}>
        <div className="sub-tabs-container">
          <button
            id="subtab-glucose-btn"
            onClick={() => setActiveSubTab("glucose")}
            className={`btn sub-tab-btn ${activeSubTab === "glucose" ? "btn-primary" : "btn-secondary"}`}
          >
            <Activity size={18} /> Diabetes & Blood Sugar
          </button>
          <button
            id="subtab-bp-btn"
            onClick={() => setActiveSubTab("bp")}
            className={`btn sub-tab-btn ${activeSubTab === "bp" ? "btn-primary" : "btn-secondary"}`}
          >
            <Heart size={18} /> Blood Pressure (BP)
          </button>
        </div>

        <div style={{ fontSize: "0.85rem", color: "var(--text-secondary)", width: "100%", marginTop: "4px" }}>
          Targets for <strong>{activeProfile.name}</strong>: Glucose <code>{activeProfile.targetGlucoseFasting || "70-110 mg/dL"}</code> • BP <code>{activeProfile.targetBP || "120/80 mmHg"}</code>
        </div>
      </div>

      {/* SUB-TAB 1: GLUCOSE / DIABETES TRACKER */}
      {activeSubTab === "glucose" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          
          {/* Diabetes Summary KPI Cards */}
          <div className="grid-4">
            <div className="glass-card" style={{ padding: "14px", display: "flex", alignItems: "center", gap: "12px", background: "var(--bg-primary)" }}>
              <div style={{ width: "40px", height: "40px", borderRadius: "10px", background: "rgba(59, 130, 246, 0.15)", display: "flex", alignItems: "center", justifyContent: "center", color: "#3b82f6" }}>
                <TrendingUp size={20} />
              </div>
              <div>
                <span style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>Avg Fasting</span>
                <p style={{ fontSize: "1rem", fontWeight: "bold" }}>
                  {avgFasting ? `${avgFasting} mg/dL` : "No data"}
                </p>
              </div>
            </div>

            <div className="glass-card" style={{ padding: "14px", display: "flex", alignItems: "center", gap: "12px", background: "var(--bg-primary)" }}>
              <div style={{ width: "40px", height: "40px", borderRadius: "10px", background: "rgba(168, 85, 247, 0.15)", display: "flex", alignItems: "center", justifyContent: "center", color: "#a855f7" }}>
                <Activity size={20} />
              </div>
              <div>
                <span style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>Avg Post-Meal</span>
                <p style={{ fontSize: "1rem", fontWeight: "bold" }}>
                  {avgPostMeal ? `${avgPostMeal} mg/dL` : "No data"}
                </p>
              </div>
            </div>

            <div className="glass-card" style={{ padding: "14px", display: "flex", alignItems: "center", gap: "12px", background: "var(--bg-primary)" }}>
              <div style={{ width: "40px", height: "40px", borderRadius: "10px", background: "rgba(16, 185, 129, 0.15)", display: "flex", alignItems: "center", justifyContent: "center", color: "#10b981" }}>
                <CheckCircle2 size={20} />
              </div>
              <div>
                <span style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>In-Target Range</span>
                <p style={{ fontSize: "1rem", fontWeight: "bold", color: targetPct >= 75 ? "#10b981" : "#f59e0b" }}>
                  {profileGlucose.length > 0 ? `${targetPct}%` : "100%"}
                </p>
              </div>
            </div>

            <div className="glass-card" style={{ padding: "14px", display: "flex", alignItems: "center", gap: "12px", background: "var(--bg-primary)" }}>
              <div style={{ width: "40px", height: "40px", borderRadius: "10px", background: alertCount > 0 ? "rgba(239, 68, 68, 0.15)" : "rgba(100, 116, 139, 0.15)", display: "flex", alignItems: "center", justifyContent: "center", color: alertCount > 0 ? "#ef4444" : "#94a3b8" }}>
                <AlertTriangle size={20} />
              </div>
              <div>
                <span style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>Out-of-Range Alerts</span>
                <p style={{ fontSize: "1rem", fontWeight: "bold", color: alertCount > 0 ? "#ef4444" : "var(--text-primary)" }}>
                  {alertCount} {alertCount === 1 ? "Event" : "Events"}
                </p>
              </div>
            </div>
          </div>

          <div className="grid-2">
            {/* Form */}
            <div style={{ background: "var(--bg-primary)", padding: "18px", borderRadius: "var(--radius-md)", border: "1px solid var(--border-color)" }}>
              <h3 style={{ marginBottom: "16px", display: "flex", alignItems: "center", gap: "8px" }}>
                <Plus size={18} color="var(--primary)" /> Log Blood Glucose Reading
              </h3>

              <form onSubmit={handleGlucoseSubmit}>
                <div className="form-group">
                  <label className="form-label" htmlFor="glucose-val-input">Blood Sugar Value (mg/dL)</label>
                  <input
                    id="glucose-val-input"
                    type="number"
                    min="20"
                    max="600"
                    value={glucoseVal}
                    onChange={(e) => setGlucoseVal(Number(e.target.value))}
                    className="form-input"
                    style={{ fontSize: "1.2rem", fontWeight: "bold" }}
                    required
                  />
                  <div style={{ display: "flex", gap: "6px", marginTop: "8px" }}>
                    {[85, 105, 135, 175].map(val => (
                      <button
                        key={val}
                        type="button"
                        className="btn btn-secondary"
                        style={{ padding: "3px 8px", fontSize: "0.75rem", flex: 1 }}
                        onClick={() => setGlucoseVal(val)}
                      >
                        {val} mg/dL
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid-2" style={{ marginBottom: "14px" }}>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label" htmlFor="glucose-meal-type-select">Meal Routine</label>
                    <select
                      id="glucose-meal-type-select"
                      value={mealType}
                      onChange={(e) => setMealType(e.target.value as MealType)}
                      className="form-select"
                    >
                      <option value="fasting">Fasting (Morning)</option>
                      <option value="post_meal">Post Meal (After Food)</option>
                      <option value="before_meal">Before Meal</option>
                      <option value="bedtime">Bedtime (Night)</option>
                      <option value="random">Random Reading</option>
                    </select>
                  </div>

                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label" htmlFor="glucose-date-input" style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                      <Calendar size={14} /> Record Date
                    </label>
                    <input
                      id="glucose-date-input"
                      type="date"
                      value={glucoseDate}
                      onChange={(e) => setGlucoseDate(e.target.value)}
                      className="form-input"
                      required
                    />
                  </div>
                </div>

                <div className="grid-2" style={{ marginBottom: "14px" }}>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label" htmlFor="glucose-time-input" style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                      <Clock size={14} /> Record Time
                    </label>
                    <input
                      id="glucose-time-input"
                      type="time"
                      value={glucoseTime}
                      onChange={(e) => setGlucoseTime(e.target.value)}
                      className="form-input"
                      required
                    />
                  </div>

                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label" htmlFor="glucose-notes-input">Notes / Food Details</label>
                    <input
                      id="glucose-notes-input"
                      type="text"
                      placeholder="e.g. Ate 2 rotis + dal"
                      value={glucoseNotes}
                      onChange={(e) => setGlucoseNotes(e.target.value)}
                      className="form-input"
                    />
                  </div>
                </div>

                <button id="save-glucose-log-btn" type="submit" className="btn btn-primary" style={{ width: "100%", marginTop: "8px" }}>
                  Save Glucose Reading ({glucoseVal} mg/dL)
                </button>
              </form>
            </div>

            {/* Glucose History Log Table */}
            <div style={{ background: "var(--bg-primary)", padding: "18px", borderRadius: "var(--radius-md)", border: "1px solid var(--border-color)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px", flexWrap: "wrap", gap: "8px" }}>
                <h3 style={{ display: "flex", alignItems: "center", gap: "8px", margin: 0 }}>
                  <Calendar size={18} color="var(--primary)" /> Glucose History
                </h3>

                {/* Routine Filter */}
                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <Filter size={14} color="var(--text-secondary)" />
                  <select
                    id="glucose-filter-select"
                    value={glucoseFilter}
                    onChange={(e) => setGlucoseFilter(e.target.value)}
                    className="form-select"
                    style={{ padding: "4px 8px", fontSize: "0.8rem", width: "auto" }}
                  >
                    <option value="all">All Routines ({profileGlucose.length})</option>
                    <option value="fasting">Fasting</option>
                    <option value="post_meal">Post Meal</option>
                    <option value="before_meal">Before Meal</option>
                    <option value="bedtime">Bedtime</option>
                  </select>
                </div>
              </div>

              {displayedGlucoseLogs.length === 0 ? (
                <p style={{ color: "var(--text-muted)", fontSize: "0.9rem", textAlign: "center", padding: "20px 0" }}>
                  No blood glucose logs recorded matching this filter.
                </p>
              ) : (
                <div className="table-wrapper" style={{ maxHeight: "340px", overflowY: "auto" }}>
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Date & Time</th>
                        <th>Reading</th>
                        <th>Routine</th>
                        <th>Status</th>
                        <th style={{ textAlign: "center" }}>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {displayedGlucoseLogs.map(g => {
                        const isAlert = g.value < 70 || g.value > 200;
                        return (
                          <tr key={g.id}>
                            <td style={{ fontSize: "0.8rem" }}>
                              <div>{new Date(g.timestamp).toLocaleDateString([], { month: 'short', day: 'numeric' })}</div>
                              <div style={{ color: "var(--text-secondary)", fontSize: "0.75rem" }}>
                                {new Date(g.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </div>
                            </td>
                            <td style={{ fontWeight: "bold" }}>
                              <span style={{ color: isAlert ? "#ef4444" : "var(--text-primary)" }}>
                                {g.value} mg/dL
                              </span>
                            </td>
                            <td style={{ textTransform: "capitalize", fontSize: "0.85rem" }}>
                              {g.mealType.replace('_', ' ')}
                              {g.notes && <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>{g.notes}</div>}
                            </td>
                            <td>
                              <span className={`badge ${isAlert ? 'badge-danger' : 'badge-success'}`}>
                                {g.status}
                              </span>
                            </td>
                            <td style={{ textAlign: "center" }}>
                              <button
                                id={`delete-glucose-log-${g.id}`}
                                title="Delete Glucose Log"
                                onClick={() => handleDeleteGlucoseClick(g.id)}
                                className="btn btn-icon btn-danger"
                                style={{ padding: "4px 8px" }}
                              >
                                <Trash2 size={14} />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 2: BLOOD PRESSURE TRACKER */}
      {activeSubTab === "bp" && (
        <div className="grid-2">
          
          {/* Form */}
          <div style={{ background: "var(--bg-primary)", padding: "18px", borderRadius: "var(--radius-md)", border: "1px solid var(--border-color)" }}>
            <h3 style={{ marginBottom: "16px", display: "flex", alignItems: "center", gap: "8px" }}>
              <Plus size={18} color="var(--primary)" /> Log Blood Pressure (BP)
            </h3>

            <form onSubmit={handleBPSubmit}>
              <div className="grid-2" style={{ marginBottom: "14px" }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label" htmlFor="bp-sys-input">Systolic (SYS)</label>
                  <input
                    id="bp-sys-input"
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
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label" htmlFor="bp-dia-input">Diastolic (DIA)</label>
                  <input
                    id="bp-dia-input"
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
              </div>

              <div className="grid-2" style={{ marginBottom: "14px" }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label" htmlFor="bp-pulse-input">Pulse (BPM)</label>
                  <input
                    id="bp-pulse-input"
                    type="number"
                    min="40"
                    max="220"
                    value={pulse}
                    onChange={(e) => setPulse(Number(e.target.value))}
                    className="form-input"
                    required
                  />
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label" htmlFor="bp-time-input" style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                    <Clock size={14} /> Record Time
                  </label>
                  <input
                    id="bp-time-input"
                    type="time"
                    value={bpTime}
                    onChange={(e) => setBpTime(e.target.value)}
                    className="form-input"
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="bp-notes-input">Notes</label>
                <input
                  id="bp-notes-input"
                  type="text"
                  placeholder="e.g. Taken after 15 min rest in morning"
                  value={bpNotes}
                  onChange={(e) => setBpNotes(e.target.value)}
                  className="form-input"
                />
              </div>

              <button id="save-bp-log-btn" type="submit" className="btn btn-primary" style={{ width: "100%", marginTop: "12px" }}>
                Save BP Reading at {bpTime}
              </button>
            </form>
          </div>

          {/* Table History with Timestamps */}
          <div style={{ background: "var(--bg-primary)", padding: "18px", borderRadius: "var(--radius-md)", border: "1px solid var(--border-color)" }}>
            <h3 style={{ marginBottom: "16px", display: "flex", alignItems: "center", gap: "8px" }}>
              <Calendar size={18} color="var(--primary)" /> BP History
            </h3>

            {profileBP.length === 0 ? (
              <p style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>No blood pressure logs recorded yet.</p>
            ) : (
              <div className="table-wrapper" style={{ maxHeight: "320px", overflowY: "auto" }}>
                <table className="table">
                  <thead>
                    <tr>
                      <th>Date & Time</th>
                      <th>Reading</th>
                      <th>Pulse</th>
                      <th>Category</th>
                    </tr>
                  </thead>
                  <tbody>
                    {profileBP.map(b => (
                      <tr key={b.id}>
                        <td style={{ fontSize: "0.8rem" }}>
                          {new Date(b.timestamp).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </td>
                        <td style={{ fontWeight: "bold" }}>{b.systolic}/{b.diastolic} mmHg</td>
                        <td>{b.pulse} bpm</td>
                        <td>
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

      {/* Admin PIN Authentication Modal for Log Deletion */}
      {pendingDeleteLogId && (
        <AdminAuthModal
          onClose={() => setPendingDeleteLogId(null)}
          onSuccess={handleAuthDeleteSuccess}
        />
      )}

    </div>
  );
};

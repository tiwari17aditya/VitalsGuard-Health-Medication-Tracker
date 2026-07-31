import React, { useState, useMemo, useCallback } from "react";
import { 
  Pill, Plus, CheckCircle, AlertTriangle, RefreshCw, Trash2, Clock, 
  Edit, Eye, EyeOff, Calendar, Ban, CheckCircle2, XCircle
} from "lucide-react";
import { useApp } from "../context/AppContext";
import type { Medication, FoodRelation } from "../types";
import { AdminAuthModal } from "./AdminAuthModal";

const DAYS_OF_WEEK = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export const MedicationTracker: React.FC = () => {
  const { 
    activeProfile, 
    medications, 
    medicationLogs,
    takeMedication,
    skipMedication,
    deleteMedicationLog,
    refillStock, 
    addOrUpdateMedication, 
    deleteMedication,
    sendRefillAlertEmail
  } = useApp();

  const [showModal, setShowModal] = useState<boolean>(false);
  const [editingMed, setEditingMed] = useState<Medication | null>(null);
  const [refillMedId, setRefillMedId] = useState<string | null>(null);
  const [addedPills, setAddedPills] = useState<number>(30);
  const [viewFilter, setViewFilter] = useState<"today" | "all">("today");

  // Time picker state for taking dose (defaults to current HH:MM)
  const getCurrentHHMM = () => {
    const now = new Date();
    return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  };
  const [takeTime, setTakeTime] = useState<string>(getCurrentHHMM());

  // Medication Form State
  const [name, setName] = useState("");
  const [dosage, setDosage] = useState("500 mg");
  const [scheduleType, setScheduleType] = useState<"daily" | "weekly" | "monthly" | "specific_days" | "as_needed">("daily");
  const [daysOfWeek, setDaysOfWeek] = useState<string[]>(["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]);
  const [durationBasis, setDurationBasis] = useState<"forever" | "7_days" | "14_days" | "30_days" | "custom">("forever");
  const [stockCount, setStockCount] = useState(30);
  const [minStockAlert, setMinStockAlert] = useState(5);
  const [instructions, setInstructions] = useState("");
  const [foodRelation, setFoodRelation] = useState<FoodRelation>("After Food");
  const [trackingEnabled, setTrackingEnabled] = useState<boolean>(true);
  
  const [pendingDeleteAction, setPendingDeleteAction] = useState<{
    type: "medication" | "log";
    targetId: string;
  } | null>(null);

  const isAdminAuthed = () => sessionStorage.getItem("vitalsguard_admin_authed") === "true";

  const handleDeleteMedicationClick = (medId: string) => {
    if (isAdminAuthed()) {
      deleteMedication(medId);
    } else {
      setPendingDeleteAction({ type: "medication", targetId: medId });
    }
  };

  const handleDeleteLogClick = (logId: string) => {
    if (isAdminAuthed()) {
      deleteMedicationLog(logId);
    } else {
      setPendingDeleteAction({ type: "log", targetId: logId });
    }
  };

  const handleAuthDeleteSuccess = () => {
    const act = pendingDeleteAction;
    setPendingDeleteAction(null);
    if (!act) return;

    if (act.type === "medication") {
      deleteMedication(act.targetId);
    } else if (act.type === "log") {
      deleteMedicationLog(act.targetId);
    }
  };

  const profileMeds = useMemo(() => activeProfile ? medications.filter(m => m.profileId === activeProfile.id) : [], [medications, activeProfile]);
  const profileLogs = useMemo(() => activeProfile ? medicationLogs.filter(l => l.profileId === activeProfile.id) : [], [medicationLogs, activeProfile]);

  // Helper to check if a medication is scheduled for today
  const isScheduledToday = useCallback((med: Medication): boolean => {
    if (med.trackingEnabled === false) return false;
    const type = med.scheduleType || "daily";
    if (type === "daily" || type === "as_needed") return true;

    // Get current day 3-letter string (e.g., "Mon", "Wed", "Fri", "Sun")
    const now = new Date();
    const dayIndex = now.getDay(); // 0 is Sun, 1 is Mon...
    const mapDayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const todayName = mapDayNames[dayIndex];

    if (type === "specific_days" || type === "weekly") {
      const scheduledDays = med.daysOfWeek || ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
      return scheduledDays.includes(todayName);
    }

    if (type === "monthly") {
      return now.getDate() === 1;
    }
    return true;
  }, []);

  // Filtered medications according to selected view tab
  const displayedMeds = useMemo(() => {
    return profileMeds.filter(m => {
      if (viewFilter === "today") {
        return isScheduledToday(m);
      }
      return true;
    });
  }, [profileMeds, viewFilter, isScheduledToday]);

  if (!activeProfile) return null;

  const openAddModal = () => {
    setEditingMed(null);
    setName("");
    setDosage("500 mg");
    setScheduleType("daily");
    setDaysOfWeek(["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]);
    setDurationBasis("forever");
    setStockCount(30);
    setMinStockAlert(5);
    setInstructions("");
    setFoodRelation("After Food");
    setTrackingEnabled(true);
    setShowModal(true);
  };

  const openEditModal = (med: Medication) => {
    setEditingMed(med);
    setName(med.name);
    setDosage(med.dosage);
    setScheduleType(med.scheduleType || "daily");
    setDaysOfWeek(med.daysOfWeek || ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]);
    setDurationBasis(med.durationBasis || "forever");
    setStockCount(med.stockCount);
    setMinStockAlert(med.minStockAlert);
    setInstructions(med.instructions || "");
    setFoodRelation(med.foodRelation || "After Food");
    setTrackingEnabled(med.trackingEnabled ?? true);
    setShowModal(true);
  };

  const toggleDayOfWeek = (day: string) => {
    setDaysOfWeek(prev => 
      prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]
    );
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    // Generate descriptive frequency string
    let freqString = "Daily";
    if (scheduleType === "specific_days") {
      freqString = daysOfWeek.length > 0 ? daysOfWeek.join(", ") : "Specific Days";
    } else if (scheduleType === "weekly") {
      freqString = `Weekly (${daysOfWeek.join(", ")})`;
    } else if (scheduleType === "monthly") {
      freqString = "Monthly";
    } else if (scheduleType === "as_needed") {
      freqString = "As Needed (PRN)";
    }

    const targetId = editingMed ? editingMed.id : `med-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;

    const medData: Medication = {
      id: targetId,
      profileId: activeProfile.id,
      name,
      dosage,
      frequency: freqString,
      scheduleType,
      daysOfWeek,
      durationBasis,
      times: editingMed ? editingMed.times : ["08:00"],
      stockCount,
      minStockAlert,
      instructions,
      foodRelation,
      active: true,
      trackingEnabled
    };

    await addOrUpdateMedication(medData);
    setShowModal(false);
  };

  const handleToggleTracking = async (med: Medication) => {
    const updated = {
      ...med,
      trackingEnabled: !(med.trackingEnabled ?? true)
    };
    await addOrUpdateMedication(updated);
  };

  const handleRefillSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!refillMedId || addedPills <= 0) return;
    await refillStock(refillMedId, addedPills);
    setRefillMedId(null);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      
      {/* Top Main Section Card */}
      <div className="glass-card">
        
        {/* Top Controls Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px", flexWrap: "wrap", gap: "12px" }}>
          <div>
            <h2 style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <Pill size={22} color="var(--primary)" /> Medication Inventory & Schedule Tracking
            </h2>
            <p style={{ fontSize: "0.875rem", color: "var(--text-secondary)" }}>
              Prescriptions, specific day schedules & dose timestamps for {activeProfile.name}
            </p>
          </div>

          {/* Action Bar */}
          <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap", width: "100%" }}>
            
            {/* Global Intake Time Selector */}
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
              onClick={openAddModal}
              className="btn btn-primary btn-sm"
              style={{ flex: "1 1 auto" }}
            >
              <Plus size={16} /> Add Medication
            </button>
          </div>
        </div>

        {/* Filter View Selector Tabs (Today's Schedule vs All Prescriptions) */}
        <div style={{ display: "flex", gap: "8px", marginBottom: "16px", flexWrap: "wrap", alignItems: "center" }}>
          <span style={{ fontSize: "0.85rem", color: "var(--text-secondary)", fontWeight: "600", marginRight: "4px" }}>
            Filter Schedule View:
          </span>
          <button
            onClick={() => setViewFilter("today")}
            className={`btn btn-sm ${viewFilter === "today" ? "btn-primary" : "btn-secondary"}`}
          >
            <Calendar size={15} /> Today's Scheduled Meds ({profileMeds.filter(m => isScheduledToday(m)).length})
          </button>
          <button
            onClick={() => setViewFilter("all")}
            className={`btn btn-sm ${viewFilter === "all" ? "btn-primary" : "btn-secondary"}`}
          >
            <Pill size={15} /> All Prescriptions ({profileMeds.length})
          </button>
        </div>

        {/* Medication Cards Grid */}
        {profileMeds.length === 0 ? (
          <div style={{ textAlign: "center", padding: "40px 20px", background: "var(--bg-primary)", borderRadius: "var(--radius-md)" }}>
            <Pill size={48} color="var(--text-muted)" style={{ marginBottom: "12px" }} />
            <h3>No medications configured for {activeProfile.name}</h3>
            <p style={{ color: "var(--text-secondary)", marginBottom: "16px" }}>
              Click "Add Medication" to register daily or specific-day prescriptions.
            </p>
            <button onClick={openAddModal} className="btn btn-primary btn-sm">
              + Add First Medication
            </button>
          </div>
        ) : displayedMeds.length === 0 ? (
          <div style={{ textAlign: "center", padding: "30px 20px", background: "var(--bg-primary)", borderRadius: "var(--radius-md)" }}>
            <Calendar size={40} color="var(--primary)" style={{ marginBottom: "10px" }} />
            <h3>No medications scheduled for today ({new Date().toLocaleDateString('en-US', { weekday: 'long' })})</h3>
            <p style={{ color: "var(--text-secondary)", marginBottom: "14px", fontSize: "0.9rem" }}>
              Some medications are set for specific days (e.g. Mon, Wed, Fri, Sun).
            </p>
            <button onClick={() => setViewFilter("all")} className="btn btn-secondary btn-sm">
              View All Prescriptions ({profileMeds.length})
            </button>
          </div>
        ) : (
          <div className="grid-2">
            {displayedMeds.map(med => {
              const isLow = med.stockCount <= med.minStockAlert;
              const stockPercent = Math.min(100, Math.round((med.stockCount / 30) * 100));
              const isTracking = med.trackingEnabled ?? true;

              const lastLog = profileLogs.find(l => l.medicationId === med.id && l.status === "taken");
              const lastTakenFormatted = lastLog ? new Date(lastLog.timestamp).toLocaleString([], { 
                month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' 
              }) : null;

              const todayLog = profileLogs.find(l => 
                l.medicationId === med.id && 
                l.status === "taken" && 
                new Date(l.timestamp).toDateString() === new Date().toDateString()
              );
              const takenTodayTime = todayLog ? new Date(todayLog.timestamp).toLocaleTimeString([], { 
                hour: '2-digit', minute: '2-digit' 
              }) : null;

              return (
                <div 
                  key={med.id} 
                  style={{
                    background: "var(--bg-primary)",
                    border: !isTracking ? "1px dashed var(--text-muted)" : isLow ? "2px solid #ef4444" : "1px solid var(--border-color)",
                    borderRadius: "var(--radius-md)",
                    padding: "16px",
                    position: "relative",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                    opacity: isTracking ? 1 : 0.65
                  }}
                >
                  <div>
                    {/* Card Header & Badges */}
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "8px", flexWrap: "wrap", gap: "6px" }}>
                      <div>
                        <h3 style={{ fontSize: "1.1rem", display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap" }}>
                          {med.name}
                          <span className="badge badge-primary">{med.dosage}</span>
                          {!isTracking && (
                            <span className="badge badge-warning" style={{ fontSize: "0.725rem" }}>
                              <EyeOff size={11} /> Tracking Off
                            </span>
                          )}
                        </h3>
                        <p style={{ fontSize: "0.825rem", color: "var(--text-secondary)", marginTop: "2px" }}>
                          📅 <strong>{med.frequency}</strong> • {med.foodRelation}
                        </p>
                      </div>

                      <div style={{ display: "flex", gap: "4px", alignItems: "center" }}>
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
                    </div>

                    {/* Schedule Pills Display */}
                    {med.daysOfWeek && med.daysOfWeek.length > 0 && (
                      <div style={{ display: "flex", gap: "4px", flexWrap: "wrap", marginBottom: "10px" }}>
                        {DAYS_OF_WEEK.map(day => {
                          const isSelectedDay = med.daysOfWeek?.includes(day);
                          return (
                            <span
                              key={day}
                              style={{
                                fontSize: "0.7rem",
                                padding: "2px 6px",
                                borderRadius: "4px",
                                background: isSelectedDay ? "var(--primary-light)" : "rgba(100,116,139,0.1)",
                                color: isSelectedDay ? "var(--primary)" : "var(--text-muted)",
                                border: isSelectedDay ? "1px solid rgba(59, 130, 246, 0.4)" : "1px solid transparent",
                                fontWeight: isSelectedDay ? "bold" : "normal"
                              }}
                            >
                              {day}
                            </span>
                          );
                        })}
                      </div>
                    )}

                    {/* Doctor Timestamp */}
                    <div style={{ marginBottom: "10px", fontSize: "0.825rem", color: lastTakenFormatted ? "var(--success)" : "var(--text-muted)", display: "flex", alignItems: "center", gap: "6px" }}>
                      <Clock size={14} />
                      {lastTakenFormatted ? (
                        <span><strong>Last Taken:</strong> {lastTakenFormatted}</span>
                      ) : (
                        <span>No dose logged yet today</span>
                      )}
                    </div>

                    {med.instructions && (
                      <p style={{ fontSize: "0.825rem", color: "var(--text-muted)", marginBottom: "12px", background: "var(--bg-card)", padding: "6px 10px", borderRadius: "var(--radius-sm)" }}>
                        💡 {med.instructions}
                      </p>
                    )}

                    {/* Pill Count Bar */}
                    <div style={{ marginBottom: "14px" }}>
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

                  {/* Card Action Buttons */}
                  <div style={{ display: "flex", flexDirection: "column", gap: "6px", marginTop: "10px" }}>
                    
                    {/* Primary Take & Skip buttons or Taken Today Banner */}
                    {todayLog ? (
                      <div style={{
                        background: "rgba(16, 185, 129, 0.12)",
                        border: "1px solid rgba(16, 185, 129, 0.35)",
                        color: "#10b981",
                        borderRadius: "var(--radius-sm)",
                        padding: "10px 12px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: "8px",
                        fontWeight: "bold",
                        fontSize: "0.9rem",
                        minHeight: "40px"
                      }}>
                        <CheckCircle2 size={18} color="#10b981" /> Taken Today at {takenTodayTime}
                      </div>
                    ) : (
                      <div style={{ display: "flex", gap: "6px" }}>
                        <button
                          onClick={() => takeMedication(med.id, takeTime)}
                          className="btn btn-success"
                          style={{ flex: 2, minHeight: "40px", fontSize: "0.875rem" }}
                          disabled={med.stockCount <= 0 || !isTracking}
                          title={`Log dose taken at ${takeTime}`}
                        >
                          <CheckCircle size={16} /> Take Dose ({takeTime})
                        </button>

                        <button
                          onClick={() => skipMedication(med.id, "Skipped by user")}
                          className="btn btn-secondary btn-sm"
                          style={{ flex: 1, minHeight: "40px", fontSize: "0.8rem", color: "var(--warning)" }}
                          disabled={!isTracking}
                          title="Mark dose as skipped"
                        >
                          <Ban size={14} /> Skip
                        </button>
                      </div>
                    )}

                    {/* Secondary Management buttons */}
                    <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                      
                      {/* Edit Button */}
                      <button
                        onClick={() => openEditModal(med)}
                        className="btn btn-secondary btn-sm"
                        style={{ flex: "1 1 auto" }}
                        title="Edit prescription details"
                      >
                        <Edit size={14} /> Edit
                      </button>

                      {/* Not Track / Pause Toggle Button */}
                      <button
                        onClick={() => handleToggleTracking(med)}
                        className="btn btn-secondary btn-sm"
                        style={{ flex: "1 1 auto" }}
                        title={isTracking ? "Pause medication tracking" : "Resume medication tracking"}
                      >
                        {isTracking ? <EyeOff size={14} /> : <Eye size={14} />} 
                        {isTracking ? "Pause Track" : "Resume Track"}
                      </button>

                      {/* Refill Button */}
                      <button
                        onClick={() => { setRefillMedId(med.id); setAddedPills(30); }}
                        className="btn btn-secondary btn-sm"
                        style={{ flex: "1 1 auto" }}
                      >
                        <RefreshCw size={14} /> Refill
                      </button>

                      {/* Delete Button */}
                      <button
                        onClick={() => handleDeleteMedicationClick(med.id)}
                        className="btn btn-secondary btn-sm"
                        style={{ color: "#ef4444", flex: "0 0 auto" }}
                        title="Delete prescription"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>

                  </div>

                </div>
              );
            })}
          </div>
        )}

      </div>

      {/* RESTORED & ENHANCED CURRENT MEDICATION DONE TABLE */}
      <div className="glass-card">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px", flexWrap: "wrap", gap: "8px" }}>
          <div>
            <h3 style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <CheckCircle2 size={20} color="var(--success)" /> Current Medication Intake History Table
            </h3>
            <p style={{ fontSize: "0.825rem", color: "var(--text-secondary)" }}>
              Recent medication logs & dose compliance records for {activeProfile.name}
            </p>
          </div>
          <span className="badge badge-primary" style={{ fontSize: "0.8rem" }}>
            Total Recorded Logs: {profileLogs.length}
          </span>
        </div>

        {profileLogs.length === 0 ? (
          <div style={{ padding: "20px", textAlign: "center", background: "var(--bg-primary)", borderRadius: "var(--radius-md)", color: "var(--text-muted)" }}>
            No medication doses recorded yet for {activeProfile.name}. Take a dose to see it in this table.
          </div>
        ) : (
          <div className="table-wrapper">
            <table className="table">
              <thead>
                <tr>
                  <th>Time Logged</th>
                  <th>Medication</th>
                  <th>Dosage</th>
                  <th>Status</th>
                  <th>Food Relation</th>
                  <th>Quantity</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {profileLogs.slice(0, 15).map(log => {
                  const targetMed = medications.find(m => m.id === log.medicationId);
                  const isTaken = log.status === "taken";
                  const logDate = new Date(log.timestamp);
                  const formattedTime = logDate.toLocaleString([], {
                    month: "short", day: "numeric", hour: "2-digit", minute: "2-digit"
                  });

                  return (
                    <tr key={log.id}>
                      <td style={{ fontWeight: "600", fontSize: "0.85rem" }}>
                        <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                          <Clock size={13} color="var(--text-muted)" /> {formattedTime}
                        </span>
                      </td>
                      <td style={{ fontWeight: "bold" }}>
                        {targetMed ? targetMed.name : "Unknown Medication"}
                      </td>
                      <td>
                        <span className="badge badge-primary" style={{ fontSize: "0.75rem" }}>
                          {targetMed ? targetMed.dosage : "—"}
                        </span>
                      </td>
                      <td>
                        {isTaken ? (
                          <span className="badge badge-success" style={{ fontSize: "0.75rem" }}>
                            <CheckCircle2 size={12} /> Taken
                          </span>
                        ) : (
                          <span className="badge badge-warning" style={{ fontSize: "0.75rem" }}>
                            <XCircle size={12} /> Skipped
                          </span>
                        )}
                      </td>
                      <td style={{ fontSize: "0.825rem", color: "var(--text-secondary)" }}>
                        {targetMed ? targetMed.foodRelation : "—"}
                      </td>
                      <td style={{ fontSize: "0.85rem" }}>
                        {log.quantityTaken || 1} Pill(s)
                      </td>
                      <td>
                        <button
                          onClick={() => handleDeleteLogClick(log.id)}
                          className="btn btn-secondary btn-sm"
                          style={{ padding: "2px 6px", minHeight: "28px", color: "#ef4444", fontSize: "0.75rem" }}
                          title="Undo / delete intake log"
                        >
                          <Trash2 size={12} /> Delete
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

      {/* ADD / EDIT MEDICATION MODAL */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" style={{ maxWidth: "600px" }} onClick={e => e.stopPropagation()}>
            <h2 style={{ marginBottom: "16px" }}>
              {editingMed ? `Edit Prescription: ${editingMed.name}` : `Add Medication for ${activeProfile.name}`}
            </h2>
            
            <form onSubmit={handleFormSubmit}>
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
              </div>

              {/* Schedule Type Dropdown */}
              <div className="form-group">
                <label className="form-label">How are you taking this medication?</label>
                <select
                  value={scheduleType}
                  onChange={(e) => setScheduleType(e.target.value as any)}
                  className="form-select"
                >
                  <option value="daily">Everyday (Daily Basis)</option>
                  <option value="specific_days">Specific Days of Week (e.g. Mon, Wed, Fri, Sun)</option>
                  <option value="weekly">Weekly Basis</option>
                  <option value="monthly">Monthly Basis</option>
                  <option value="as_needed">As Needed / Forever Basis (PRN)</option>
                </select>
              </div>

              {/* Interactive Specific Days Picker Pills */}
              {(scheduleType === "specific_days" || scheduleType === "weekly") && (
                <div className="form-group">
                  <label className="form-label">Select Specific Days of Week:</label>
                  <div className="day-picker-container">
                    {DAYS_OF_WEEK.map(day => {
                      const isActive = daysOfWeek.includes(day);
                      return (
                        <button
                          key={day}
                          type="button"
                          onClick={() => toggleDayOfWeek(day)}
                          className={`day-pill ${isActive ? "active" : ""}`}
                        >
                          {isActive ? "✓ " : ""}{day}
                        </button>
                      );
                    })}
                  </div>
                  <p style={{ fontSize: "0.775rem", color: "var(--text-muted)", marginTop: "4px" }}>
                    Selected Days: {daysOfWeek.length > 0 ? daysOfWeek.join(", ") : "None selected"}
                  </p>
                </div>
              )}

              {/* Duration / Schedule Basis Dropdown */}
              <div className="form-group">
                <label className="form-label">Schedule Duration / Basis</label>
                <select
                  value={durationBasis}
                  onChange={(e) => setDurationBasis(e.target.value as any)}
                  className="form-select"
                >
                  <option value="forever">Forever / Ongoing (Continuous Treatment)</option>
                  <option value="7_days">7 Days Course</option>
                  <option value="14_days">14 Days Course</option>
                  <option value="30_days">30 Days Course</option>
                  <option value="custom">Custom Duration</option>
                </select>
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

              {/* Tracking Toggle Switch */}
              <div className="form-group" style={{ flexDirection: "row", alignItems: "center", gap: "10px", margin: "10px 0" }}>
                <input
                  type="checkbox"
                  id="trackingEnabled"
                  checked={trackingEnabled}
                  onChange={(e) => setTrackingEnabled(e.target.checked)}
                  style={{ width: "18px", height: "18px", cursor: "pointer" }}
                />
                <label htmlFor="trackingEnabled" style={{ fontSize: "0.9rem", cursor: "pointer", color: "var(--text-primary)" }}>
                  <strong>Enable Daily Tracking & Low Stock Reminders</strong>
                </label>
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
                  {editingMed ? "Save Changes" : "Save Prescription"}
                </button>
                <button type="button" onClick={() => setShowModal(false)} className="btn btn-secondary">
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

      {pendingDeleteAction && (
        <AdminAuthModal
          onClose={() => setPendingDeleteAction(null)}
          onSuccess={handleAuthDeleteSuccess}
          title="Admin Passcode Required to Delete"
        />
      )}

    </div>
  );
};

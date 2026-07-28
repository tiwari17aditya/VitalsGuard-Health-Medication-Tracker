import React, { useState } from "react";
import { Calendar as CalendarIcon, CheckCircle2, Clock, ChevronLeft, ChevronRight } from "lucide-react";
import { useApp } from "../context/AppContext";

export const MedicationCalendar: React.FC = () => {
  const { activeProfile, medications, medicationLogs } = useApp();

  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [selectedDateStr, setSelectedDateStr] = useState<string>(new Date().toISOString().split("T")[0]);

  if (!activeProfile) return null;

  const profileMeds = medications.filter(m => m.profileId === activeProfile.id);

  // Generate calendar days for current month view
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfWeek = new Date(year, month, 1).getDay();

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  // Helper to get adherence status for a given day string "YYYY-MM-DD"
  const getDayStatus = (dateStr: string) => {
    const dayLogs = medicationLogs.filter(l => l.profileId === activeProfile.id && l.timestamp.startsWith(dateStr));
    const takenCount = dayLogs.filter(l => l.status === "taken").length;
    if (dayLogs.length === 0) return "none";
    if (takenCount >= profileMeds.length && profileMeds.length > 0) return "full";
    if (takenCount > 0) return "partial";
    return "missed";
  };

  // Selected Day Timeline Logs
  const selectedDayLogs = medicationLogs.filter(
    l => l.profileId === activeProfile.id && l.timestamp.startsWith(selectedDateStr)
  );

  return (
    <div className="glass-card">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px", flexWrap: "wrap" }}>
        <div>
          <h2 style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <CalendarIcon size={22} color="var(--primary)" /> Medication Schedule Calendar
          </h2>
          <p style={{ fontSize: "0.875rem", color: "var(--text-secondary)" }}>
            Monthly visual adherence tracking for {activeProfile.name}
          </p>
        </div>

        {/* Month Navigation Controls */}
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <button onClick={handlePrevMonth} className="btn btn-secondary btn-sm">
            <ChevronLeft size={16} /> Prev
          </button>
          <span style={{ fontSize: "1.1rem", fontWeight: "700", minWidth: "140px", textAlign: "center" }}>
            {monthNames[month]} {year}
          </span>
          <button onClick={handleNextMonth} className="btn btn-secondary btn-sm">
            Next <ChevronRight size={16} />
          </button>
        </div>
      </div>

      <div className="grid-2">
        
        {/* Calendar Grid View */}
        <div style={{ background: "var(--bg-primary)", padding: "16px", borderRadius: "var(--radius-md)", border: "1px solid var(--border-color)" }}>
          
          {/* Day Headers */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", textAlign: "center", fontWeight: "bold", fontSize: "0.85rem", color: "var(--text-muted)", marginBottom: "10px" }}>
            <span>Sun</span><span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span>
          </div>

          {/* Days Cells */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "6px" }}>
            {/* Empty Offset Cells */}
            {Array.from({ length: firstDayOfWeek }).map((_, i) => (
              <div key={`empty-${i}`} style={{ height: "42px" }} />
            ))}

            {/* Days of Month */}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const dayNum = i + 1;
              const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(dayNum).padStart(2, "0")}`;
              const isSelected = dateStr === selectedDateStr;
              const isToday = dateStr === new Date().toISOString().split("T")[0];
              const status = getDayStatus(dateStr);

              let badgeBg = "transparent";
              if (status === "full") badgeBg = "rgba(16, 185, 129, 0.25)";
              else if (status === "partial") badgeBg = "rgba(245, 158, 11, 0.25)";
              else if (status === "missed") badgeBg = "rgba(239, 68, 68, 0.25)";

              return (
                <button
                  key={dateStr}
                  onClick={() => setSelectedDateStr(dateStr)}
                  style={{
                    height: "44px",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    borderRadius: "var(--radius-sm)",
                    background: isSelected ? "var(--primary)" : badgeBg || "var(--bg-card)",
                    color: isSelected ? "#ffffff" : "var(--text-primary)",
                    border: isToday ? "2px solid var(--primary)" : "1px solid var(--border-color)",
                    cursor: "pointer",
                    fontWeight: isToday || isSelected ? "bold" : "normal"
                  }}
                >
                  <span style={{ fontSize: "0.95rem" }}>{dayNum}</span>
                  {status !== "none" && (
                    <span style={{ fontSize: "0.65rem", textTransform: "uppercase", opacity: 0.9 }}>
                      {status === "full" ? "✓ Done" : status === "partial" ? "• Part" : "✕ Miss"}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          <div style={{ display: "flex", gap: "12px", marginTop: "16px", fontSize: "0.775rem", color: "var(--text-secondary)", justifyContent: "center" }}>
            <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
              <span style={{ width: "10px", height: "10px", borderRadius: "50%", background: "#10b981" }} /> All Taken
            </span>
            <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
              <span style={{ width: "10px", height: "10px", borderRadius: "50%", background: "#f59e0b" }} /> Partial Doses
            </span>
            <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
              <span style={{ width: "10px", height: "10px", borderRadius: "50%", background: "#ef4444" }} /> Missed / Pending
            </span>
          </div>

        </div>

        {/* Selected Day Details Timeline */}
        <div style={{ background: "var(--bg-primary)", padding: "16px", borderRadius: "var(--radius-md)", border: "1px solid var(--border-color)" }}>
          <h3 style={{ marginBottom: "12px", display: "flex", alignItems: "center", gap: "8px" }}>
            <Clock size={18} color="var(--primary)" /> Timeline for {new Date(selectedDateStr).toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" })}
          </h3>

          {profileMeds.length === 0 ? (
            <p style={{ color: "var(--text-muted)" }}>No medications assigned to this user profile.</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {profileMeds.map(med => {
                const log = selectedDayLogs.find(l => l.medicationId === med.id && l.status === "taken");
                const isTaken = Boolean(log);

                return (
                  <div
                    key={med.id}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      padding: "12px",
                      borderRadius: "var(--radius-sm)",
                      background: isTaken ? "rgba(16, 185, 129, 0.1)" : "var(--bg-card)",
                      border: isTaken ? "1px solid rgba(16, 185, 129, 0.3)" : "1px solid var(--border-color)"
                    }}
                  >
                    <div>
                      <h4 style={{ fontSize: "0.95rem" }}>{med.name} ({med.dosage})</h4>
                      <p style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>
                        Scheduled: {med.frequency} • {med.foodRelation}
                      </p>
                    </div>

                    <div>
                      {isTaken ? (
                        <span className="badge badge-success">
                          <CheckCircle2 size={14} /> Taken at {new Date(log!.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      ) : (
                        <span className="badge badge-warning">
                          <Clock size={14} /> Pending / Missed
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

      </div>

    </div>
  );
};

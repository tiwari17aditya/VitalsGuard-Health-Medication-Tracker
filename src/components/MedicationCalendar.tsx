import React, { useState } from "react";
import { Calendar, CheckCircle2, XCircle, Clock, Activity, Heart, Pill, ChevronLeft, ChevronRight } from "lucide-react";
import { useApp } from "../context/AppContext";

export const MedicationCalendar: React.FC = () => {
  const { activeProfile, medications, medicationLogs, glucoseLogs, bpLogs, takeMedication } = useApp();

  const [selectedDateStr, setSelectedDateStr] = useState<string>(
    new Date().toISOString().split("T")[0]
  );

  const [displayDate, setDisplayDate] = useState<Date>(() => {
    return new Date(new Date().getFullYear(), new Date().getMonth(), 1);
  });

  if (!activeProfile) return null;

  const profileMeds = medications.filter(m => m.profileId === activeProfile.id);
  const profileLogs = medicationLogs.filter(l => l.profileId === activeProfile.id);
  const profileGlucose = glucoseLogs.filter(g => g.profileId === activeProfile.id);
  const profileBP = bpLogs.filter(b => b.profileId === activeProfile.id);

  // Helper to format Date objects as local YYYY-MM-DD
  const getLocalDateString = (date: Date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  // Helper to check if medication is scheduled on a given date
  const isMedScheduledOnDate = (m: any, dateStr: string) => {
    if (m.trackingEnabled === false) return false;
    const type = m.scheduleType || "daily";
    if (type === "daily" || type === "as_needed") return true;

    const targetDate = new Date(dateStr + "T12:00:00");
    const mapDayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const targetDayName = mapDayNames[targetDate.getDay()];

    if (type === "specific_days" || type === "weekly") {
      const scheduledDays = m.daysOfWeek || ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
      return scheduledDays.includes(targetDayName);
    }
    return true;
  };

  // Helper to construct the monthly calendar grid cells (42 cells to prevent layout shifting)
  const generateMonthGrid = (viewDate: Date) => {
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();

    const firstDay = new Date(year, month, 1);
    const startDayOfWeek = firstDay.getDay();

    const totalDays = new Date(year, month + 1, 0).getDate();
    const prevMonthTotalDays = new Date(year, month, 0).getDate();

    const cells: { dateStr: string; dayNum: number; isCurrentMonth: boolean; date: Date }[] = [];

    // Previous month leading padding days
    for (let i = startDayOfWeek - 1; i >= 0; i--) {
      const d = prevMonthTotalDays - i;
      const prevDate = new Date(year, month - 1, d);
      cells.push({
        dateStr: getLocalDateString(prevDate),
        dayNum: d,
        isCurrentMonth: false,
        date: prevDate
      });
    }

    // Target month days
    for (let d = 1; d <= totalDays; d++) {
      const currDate = new Date(year, month, d);
      cells.push({
        dateStr: getLocalDateString(currDate),
        dayNum: d,
        isCurrentMonth: true,
        date: currDate
      });
    }

    // Next month trailing padding days
    const totalCells = 42;
    const nextDaysNeeded = totalCells - cells.length;
    for (let d = 1; d <= nextDaysNeeded; d++) {
      const nextDate = new Date(year, month + 1, d);
      cells.push({
        dateStr: getLocalDateString(nextDate),
        dayNum: d,
        isCurrentMonth: false,
        date: nextDate
      });
    }

    return cells;
  };

  const gridCells = generateMonthGrid(displayDate);
  const weekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  const handlePrevMonth = () => {
    setDisplayDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setDisplayDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  const handleGoToday = () => {
    const today = new Date();
    const todayStr = getLocalDateString(today);
    setSelectedDateStr(todayStr);
    setDisplayDate(new Date(today.getFullYear(), today.getMonth(), 1));
  };

  const handleDateSelect = (dateStr: string) => {
    setSelectedDateStr(dateStr);
    const d = new Date(dateStr + "T12:00:00");
    setDisplayDate(new Date(d.getFullYear(), d.getMonth(), 1));
  };

  const handleJumpToDate = (dateStr: string) => {
    setSelectedDateStr(dateStr);
    const d = new Date(dateStr + "T12:00:00");
    setDisplayDate(new Date(d.getFullYear(), d.getMonth(), 1));
  };

  // Selected date logs and scheduled meds
  const selectedDateMedLogs = profileLogs.filter(l => l.timestamp.startsWith(selectedDateStr));
  const scheduledMedsForSelectedDate = profileMeds.filter(m => isMedScheduledOnDate(m, selectedDateStr));
  const selectedDateGlucoseLogs = profileGlucose.filter(g => g.timestamp.startsWith(selectedDateStr));
  const selectedDateBPLogs = profileBP.filter(b => b.timestamp.startsWith(selectedDateStr));

  const todayStr = getLocalDateString(new Date());
  const monthName = displayDate.toLocaleDateString("en-US", { month: "long", year: "numeric" });

  return (
    <div className="glass-card">
      
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px", flexWrap: "wrap", gap: "12px" }}>
        <div>
          <h2 style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <Calendar size={22} color="var(--primary)" /> Adherence Calendar & Health Timeline
          </h2>
          <p style={{ fontSize: "0.875rem", color: "var(--text-secondary)" }}>
            Daily history & unified records for medications, blood sugar, and blood pressure ({activeProfile.name})
          </p>
        </div>

        {/* Date Selector to Jump to Custom Date */}
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span style={{ fontSize: "0.85rem", color: "var(--text-secondary)", fontWeight: "600" }}>Jump to Date:</span>
          <input
            id="calendar-date-picker-input"
            type="date"
            value={selectedDateStr}
            onChange={(e) => {
              if (e.target.value) {
                handleJumpToDate(e.target.value);
              }
            }}
            className="form-input"
            style={{ width: "auto", padding: "4px 8px", fontSize: "0.9rem" }}
          />
        </div>
      </div>

      {/* Month Navigation and Grid */}
      <div className="calendar-container" style={{ marginBottom: "24px" }}>
        <div className="calendar-header">
          <div className="calendar-nav">
            <button
              id="calendar-prev-month-btn"
              type="button"
              className="calendar-nav-btn"
              onClick={handlePrevMonth}
              title="Previous Month"
            >
              <ChevronLeft size={20} />
            </button>
            <span className="calendar-month-title">{monthName}</span>
            <button
              id="calendar-next-month-btn"
              type="button"
              className="calendar-nav-btn"
              onClick={handleNextMonth}
              title="Next Month"
            >
              <ChevronRight size={20} />
            </button>
          </div>

          <button
            id="calendar-today-btn"
            type="button"
            className="btn btn-primary"
            style={{ padding: "6px 12px", minHeight: "36px", fontSize: "0.85rem" }}
            onClick={handleGoToday}
          >
            Today
          </button>
        </div>

        <div className="calendar-grid">
          {/* Weekday headers */}
          {weekdays.map(day => (
            <div key={day} className="calendar-weekday">
              {day}
            </div>
          ))}

          {/* Grid cells */}
          {gridCells.map(cell => {
            const isSelected = cell.dateStr === selectedDateStr;
            const isToday = cell.dateStr === todayStr;
            
            const dayMeds = profileMeds.filter(m => isMedScheduledOnDate(m, cell.dateStr));
            const dayMedLogs = profileLogs.filter(l => l.timestamp.startsWith(cell.dateStr));
            const dayGlucoseCount = profileGlucose.filter(g => g.timestamp.startsWith(cell.dateStr)).length;
            const dayBPCount = profileBP.filter(b => b.timestamp.startsWith(cell.dateStr)).length;

            const takenCount = dayMedLogs.filter(l => l.status === "taken").length;
            const isComplete = dayMeds.length > 0 && takenCount >= dayMeds.length;

            let cellClass = "calendar-cell";
            if (isSelected) cellClass += " selected";
            if (!cell.isCurrentMonth) cellClass += " padded";
            if (isToday) cellClass += " today";

            return (
              <button
                key={cell.dateStr}
                id={`calendar-grid-cell-${cell.dateStr}`}
                type="button"
                className={cellClass}
                onClick={() => handleDateSelect(cell.dateStr)}
              >
                <span className="calendar-day-num">{cell.dayNum}</span>
                
                <div className="calendar-cell-indicators">
                  <span className="calendar-badge-text">
                    {isComplete ? "✅ All" : takenCount > 0 ? `💊 ${takenCount}` : "—"}
                  </span>
                  {(dayGlucoseCount > 0 || dayBPCount > 0) && (
                    <span className="calendar-vitals-text">
                      {dayGlucoseCount > 0 ? `🩸${dayGlucoseCount} ` : ""}{dayBPCount > 0 ? `❤️${dayBPCount}` : ""}
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>


      {/* Detailed Log Timeline for Selected Date */}
      <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
        
        {/* SECTION 1: PRESCRIPTION SCHEDULE FOR SELECTED DATE */}
        <div style={{ background: "var(--bg-primary)", padding: "20px", borderRadius: "var(--radius-md)", border: "1px solid var(--border-color)" }}>
          <h3 style={{ marginBottom: "16px", fontSize: "1.05rem", display: "flex", alignItems: "center", gap: "8px" }}>
            <Pill size={18} color="var(--primary)" /> Prescription Schedule for: <strong>{new Date(selectedDateStr + "T12:00:00").toLocaleDateString("en-US", { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}</strong>
          </h3>

          {scheduledMedsForSelectedDate.length === 0 ? (
            <p style={{ color: "var(--text-muted)" }}>No medications scheduled for this profile on this date.</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {scheduledMedsForSelectedDate.map(m => {
                const medLog = selectedDateMedLogs.find(l => l.medicationId === m.id && l.status === "taken");
                const isTaken = Boolean(medLog);
                const exactTimeFormatted = medLog ? new Date(medLog.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : null;

                const defaultTime = m.times && m.times[0] ? m.times[0] : "08:00";

                return (
                  <div
                    key={m.id}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      padding: "14px 16px",
                      borderRadius: "var(--radius-md)",
                      background: "var(--bg-card)",
                      border: "1px solid var(--border-color)",
                      flexWrap: "wrap",
                      gap: "12px"
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "12px", minWidth: "200px" }}>
                      {isTaken ? (
                        <CheckCircle2 size={24} color="#10b981" />
                      ) : (
                        <XCircle size={24} color="#f59e0b" />
                      )}
                      <div>
                        <h4 style={{ fontSize: "1rem" }}>{m.name} ({m.dosage})</h4>
                        <p style={{ fontSize: "0.825rem", color: "var(--text-secondary)" }}>
                          Schedule: {m.frequency} • {m.foodRelation}
                        </p>
                      </div>
                    </div>

                    <div>
                      {isTaken ? (
                        <span className="badge badge-success" style={{ display: "inline-flex", alignItems: "center", gap: "4px", fontSize: "0.85rem" }}>
                          <Clock size={14} /> Taken at {exactTimeFormatted}
                        </span>
                      ) : (
                        <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "4px", background: "var(--bg-primary)", padding: "4px 8px", borderRadius: "var(--radius-sm)", border: "1px solid var(--border-color)" }}>
                            <Clock size={13} color="var(--text-muted)" />
                            <input
                              type="time"
                              defaultValue={defaultTime}
                              id={`time-picker-${m.id}-${selectedDateStr}`}
                              className="form-input"
                              style={{ width: "auto", padding: "0px 4px", fontSize: "0.8rem", border: "none", background: "transparent", height: "20px" }}
                              title="Set intake time for the pill took"
                            />
                          </div>
                          <button
                            id={`take-med-btn-${m.id}`}
                            onClick={() => {
                              const timeInput = document.getElementById(`time-picker-${m.id}-${selectedDateStr}`) as HTMLInputElement;
                              const timeVal = timeInput ? timeInput.value : defaultTime;
                              takeMedication(m.id, timeVal, selectedDateStr);
                            }}
                            className="btn btn-success btn-sm"
                            style={{ padding: "4px 8px", minHeight: "28px", fontSize: "0.8rem", background: "#10b981", color: "white" }}
                            disabled={m.stockCount <= 0}
                            title="Log this missed pill as taken for this date"
                          >
                            Take Pill
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* SECTION 2: DIABETES & BLOOD SUGAR READINGS FOR SELECTED DATE */}
        <div style={{ background: "var(--bg-primary)", padding: "20px", borderRadius: "var(--radius-md)", border: "1px solid var(--border-color)" }}>
          <h3 style={{ marginBottom: "14px", fontSize: "1.05rem", display: "flex", alignItems: "center", gap: "8px" }}>
            <Activity size={18} color="#3b82f6" /> Blood Sugar & Diabetes Logs for this Day ({selectedDateGlucoseLogs.length})
          </h3>

          {selectedDateGlucoseLogs.length === 0 ? (
            <p style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>No blood glucose readings logged on {selectedDateStr}.</p>
          ) : (
            <div className="table-wrapper">
              <table className="table">
                <thead>
                  <tr>
                    <th>Time</th>
                    <th>Reading (mg/dL)</th>
                    <th>Meal Routine</th>
                    <th>Medical Status</th>
                    <th>Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedDateGlucoseLogs.map(g => {
                    const isAlert = g.value < 70 || g.value > 200;
                    return (
                      <tr key={g.id}>
                        <td style={{ fontSize: "0.85rem", fontWeight: "bold" }}>
                          {new Date(g.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </td>
                        <td style={{ fontWeight: "bold", fontSize: "1rem", color: isAlert ? "#ef4444" : "#3b82f6" }}>
                          {g.value} mg/dL
                        </td>
                        <td style={{ textTransform: "capitalize", fontSize: "0.85rem" }}>
                          {g.mealType.replace('_', ' ')}
                        </td>
                        <td>
                          <span className={`badge ${isAlert ? 'badge-danger' : 'badge-success'}`}>
                            {g.status}
                          </span>
                        </td>
                        <td style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>
                          {g.notes || "—"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* SECTION 3: BLOOD PRESSURE READINGS FOR SELECTED DATE */}
        <div style={{ background: "var(--bg-primary)", padding: "20px", borderRadius: "var(--radius-md)", border: "1px solid var(--border-color)" }}>
          <h3 style={{ marginBottom: "14px", fontSize: "1.05rem", display: "flex", alignItems: "center", gap: "8px" }}>
            <Heart size={18} color="#ef4444" /> Blood Pressure & Pulse Logs for this Day ({selectedDateBPLogs.length})
          </h3>

          {selectedDateBPLogs.length === 0 ? (
            <p style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>No blood pressure readings logged on {selectedDateStr}.</p>
          ) : (
            <div className="table-wrapper">
              <table className="table">
                <thead>
                  <tr>
                    <th>Time</th>
                    <th>SYS / DIA (mmHg)</th>
                    <th>Pulse (bpm)</th>
                    <th>AHA Category</th>
                    <th>Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedDateBPLogs.map(b => (
                    <tr key={b.id}>
                      <td style={{ fontSize: "0.85rem", fontWeight: "bold" }}>
                        {new Date(b.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td style={{ fontWeight: "bold", fontSize: "1rem", color: "#ef4444" }}>
                        {b.systolic} / {b.diastolic} mmHg
                      </td>
                      <td style={{ fontSize: "0.85rem" }}>
                        {b.pulse} bpm
                      </td>
                      <td>
                        <span className={`badge ${b.category.includes('Crisis') || b.category.includes('Stage 2') ? 'badge-danger' : 'badge-success'}`}>
                          {b.category}
                        </span>
                      </td>
                      <td style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>
                        {b.notes || "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>

    </div>
  );
};

import React, { useState } from "react";
import { Calendar, CheckCircle2, XCircle, Clock } from "lucide-react";
import { useApp } from "../context/AppContext";

export const MedicationCalendar: React.FC = () => {
  const { activeProfile, medications, medicationLogs } = useApp();

  const [selectedDateStr, setSelectedDateStr] = useState<string>(
    new Date().toISOString().split("T")[0]
  );

  if (!activeProfile) return null;

  const profileMeds = medications.filter(m => m.profileId === activeProfile.id);
  const profileLogs = medicationLogs.filter(l => l.profileId === activeProfile.id);

  // Generate 14 days dates array
  const datesList: { dateStr: string; dayName: string; dayNum: number }[] = [];
  const today = new Date();
  for (let i = 6; i >= -7; i--) {
    const d = new Date();
    d.setDate(today.getDate() - i);
    datesList.push({
      dateStr: d.toISOString().split("T")[0],
      dayName: d.toLocaleDateString("en-US", { weekday: "short" }),
      dayNum: d.getDate()
    });
  }

  // Selected date logs
  const selectedDateLogs = profileLogs.filter(l => l.timestamp.startsWith(selectedDateStr));

  return (
    <div className="glass-card">
      
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px", flexWrap: "wrap", gap: "12px" }}>
        <div>
          <h2 style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <Calendar size={22} color="var(--primary)" /> Adherence Calendar & Dose Timeline
          </h2>
          <p style={{ fontSize: "0.875rem", color: "var(--text-secondary)" }}>
            Daily history & exact intake timestamps for doctor compliance review ({activeProfile.name})
          </p>
        </div>
      </div>

      {/* Date Picker Ribbon */}
      <div style={{ display: "flex", gap: "10px", overflowX: "auto", paddingBottom: "12px", marginBottom: "20px" }}>
        {datesList.map(item => {
          const isSelected = item.dateStr === selectedDateStr;
          const dayLogs = profileLogs.filter(l => l.timestamp.startsWith(item.dateStr));
          const takenCount = dayLogs.filter(l => l.status === "taken").length;
          const isComplete = profileMeds.length > 0 && takenCount >= profileMeds.length;

          return (
            <button
              key={item.dateStr}
              onClick={() => setSelectedDateStr(item.dateStr)}
              style={{
                flex: "0 0 70px",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                padding: "10px 8px",
                borderRadius: "var(--radius-md)",
                background: isSelected ? "var(--primary)" : "var(--bg-primary)",
                color: isSelected ? "#ffffff" : "var(--text-primary)",
                border: isSelected ? "2px solid var(--primary)" : "1px solid var(--border-color)",
                cursor: "pointer",
                transition: "all 0.2s ease"
              }}
            >
              <span style={{ fontSize: "0.75rem", opacity: 0.8, textTransform: "uppercase" }}>{item.dayName}</span>
              <span style={{ fontSize: "1.2rem", fontWeight: "bold", margin: "2px 0" }}>{item.dayNum}</span>
              
              <span style={{ fontSize: "0.7rem", marginTop: "4px" }}>
                {isComplete ? "✅ All" : takenCount > 0 ? `💊 ${takenCount}` : "—"}
              </span>
            </button>
          );
        })}
      </div>

      {/* Detailed Log Timeline for Selected Date */}
      <div style={{ background: "var(--bg-primary)", padding: "20px", borderRadius: "var(--radius-md)", border: "1px solid var(--border-color)" }}>
        <h3 style={{ marginBottom: "16px", fontSize: "1.05rem" }}>
          Prescription Schedule for Date: <strong>{new Date(selectedDateStr).toLocaleDateString("en-US", { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}</strong>
        </h3>

        {profileMeds.length === 0 ? (
          <p style={{ color: "var(--text-muted)" }}>No medications registered for this profile.</p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {profileMeds.map(m => {
              const medLog = selectedDateLogs.find(l => l.medicationId === m.id && l.status === "taken");
              const isTaken = Boolean(medLog);
              const exactTimeFormatted = medLog ? new Date(medLog.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : null;

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
                    border: "1px solid var(--border-color)"
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
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

                  {/* Exact Doctor Timestamp */}
                  <div>
                    {isTaken ? (
                      <span className="badge badge-success" style={{ display: "inline-flex", alignItems: "center", gap: "4px", fontSize: "0.85rem" }}>
                        <Clock size={14} /> Taken at {exactTimeFormatted}
                      </span>
                    ) : (
                      <span className="badge badge-warning" style={{ fontSize: "0.85rem" }}>
                        ⏳ Pending Intake
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
  );
};

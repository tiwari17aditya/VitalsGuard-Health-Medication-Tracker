import React, { useState } from "react";
import { FileText, Mail, Download, Printer, Send, AlertTriangle, User } from "lucide-react";
import { useApp } from "../context/AppContext";

export const ReportsManager: React.FC = () => {
  const { 
    activeProfile, 
    medications, 
    medicationLogs, 
    glucoseLogs, 
    bpLogs, 
    caretakerEmail, 
    setCaretakerEmail, 
    sendDailyCheckEmail, 
    sendRefillAlertEmail,
    showToast
  } = useApp();

  const [reportRange, setReportRange] = useState<"daily" | "weekly" | "monthly">("weekly");
  const [emailInput, setEmailInput] = useState<string>(caretakerEmail);

  if (!activeProfile) return null;

  const profileMeds = medications.filter(m => m.profileId === activeProfile.id);
  const profileGlucose = glucoseLogs.filter(g => g.profileId === activeProfile.id);
  const profileBP = bpLogs.filter(b => b.profileId === activeProfile.id);
  const profileLogs = medicationLogs.filter(l => l.profileId === activeProfile.id);

  // Compute adherence stats
  const totalMedsCount = profileMeds.length;
  const takenLogsCount = profileLogs.filter(l => l.status === "taken").length;
  const adherencePercent = totalMedsCount > 0 ? Math.min(100, Math.round((takenLogsCount / (totalMedsCount * 7)) * 100)) : 100;

  // Average glucose
  const avgGlucose = profileGlucose.length > 0 
    ? Math.round(profileGlucose.reduce((acc, g) => acc + g.value, 0) / profileGlucose.length) 
    : 0;

  // Average BP
  const avgSYS = profileBP.length > 0 ? Math.round(profileBP.reduce((acc, b) => acc + b.systolic, 0) / profileBP.length) : 0;
  const avgDIA = profileBP.length > 0 ? Math.round(profileBP.reduce((acc, b) => acc + b.diastolic, 0) / profileBP.length) : 0;

  // Export CSV Function
  const handleExportCSV = () => {
    const csvRows: string[] = [];
    csvRows.push(`CarePulse Health Report for ${activeProfile.name}`);
    csvRows.push(`Generated Date,${new Date().toLocaleString()}`);
    csvRows.push(`Caretaker Email,${caretakerEmail}`);
    csvRows.push("");
    
    csvRows.push("--- BLOOD GLUCOSE LOGS ---");
    csvRows.push("Timestamp,Value (mg/dL),Meal Routine,Status,Notes");
    profileGlucose.forEach(g => {
      csvRows.push(`"${new Date(g.timestamp).toLocaleString()}",${g.value},"${g.mealType}","${g.status}","${g.notes || ''}"`);
    });

    csvRows.push("");
    csvRows.push("--- BLOOD PRESSURE LOGS ---");
    csvRows.push("Timestamp,Systolic (mmHg),Diastolic (mmHg),Pulse (bpm),Category,Notes");
    profileBP.forEach(b => {
      csvRows.push(`"${new Date(b.timestamp).toLocaleString()}",${b.systolic},${b.diastolic},${b.pulse},"${b.category}","${b.notes || ''}"`);
    });

    const csvContent = "data:text/csv;charset=utf-8," + csvRows.join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `carepulse_report_${activeProfile.name.replace(/\s+/g, "_")}_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showToast("success", "CSV Exported", "Report file downloaded successfully.");
  };

  // Direct Print PDF Function
  const handlePrintPDF = () => {
    window.print();
  };

  const handleSaveEmailConfig = (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailInput.includes("@")) {
      showToast("error", "Invalid Email", "Please enter a valid email address.");
      return;
    }
    setCaretakerEmail(emailInput);
  };

  return (
    <div className="glass-card">
      
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px", flexWrap: "wrap", gap: "12px" }}>
        <div>
          <h2 style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <FileText size={22} color="var(--primary)" /> Caretaker Email & PDF Health Reports
          </h2>
          <p style={{ fontSize: "0.875rem", color: "var(--text-secondary)" }}>
            End-of-day compliance mails, weekly & monthly summaries for {activeProfile.name}
          </p>
        </div>

        {/* Quick Action Export Buttons */}
        <div style={{ display: "flex", gap: "8px" }}>
          <button onClick={handleExportCSV} className="btn btn-secondary btn-sm">
            <Download size={16} /> Export CSV
          </button>
          <button onClick={handlePrintPDF} className="btn btn-primary btn-sm">
            <Printer size={16} /> Print PDF Report
          </button>
        </div>
      </div>

      <div className="grid-2">
        
        {/* Caretaker Email Setup Form */}
        <div style={{ background: "var(--bg-primary)", padding: "18px", borderRadius: "var(--radius-md)", border: "1px solid var(--border-color)" }}>
          <h3 style={{ marginBottom: "12px", display: "flex", alignItems: "center", gap: "8px" }}>
            <Mail size={18} color="var(--primary)" /> Caretaker Email Configuration
          </h3>

          <form onSubmit={handleSaveEmailConfig}>
            <div className="form-group">
              <label className="form-label">Caretaker Email Address (Receives Digests)</label>
              <input
                type="email"
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                className="form-input"
                placeholder="your.email@example.com"
                required
              />
            </div>
            <button type="submit" className="btn btn-secondary btn-sm" style={{ width: "100%", marginBottom: "16px" }}>
              Save Caretaker Email
            </button>
          </form>

          <hr style={{ borderColor: "var(--border-color)", margin: "16px 0" }} />

          <h4 style={{ marginBottom: "10px" }}>Instant Dispatch Actions:</h4>
          
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            <button
              onClick={() => sendDailyCheckEmail(activeProfile.id)}
              className="btn btn-success"
              style={{ width: "100%", justifyContent: "flex-start" }}
            >
              <Send size={18} /> Send End-of-Day Check Email Now
            </button>

            <button
              onClick={() => sendRefillAlertEmail(activeProfile.id)}
              className="btn btn-secondary"
              style={{ width: "100%", justifyContent: "flex-start" }}
            >
              <AlertTriangle size={18} color="var(--warning)" /> Send Refill Warning Email
            </button>
          </div>
        </div>

        {/* Live Summary Preview Card */}
        <div style={{ background: "var(--bg-primary)", padding: "18px", borderRadius: "var(--radius-md)", border: "1px solid var(--border-color)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
            <h3 style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <User size={18} color="var(--accent)" /> Summary for {activeProfile.name}
            </h3>
            
            <select
              value={reportRange}
              onChange={(e) => setReportRange(e.target.value as any)}
              className="form-select"
              style={{ width: "auto", padding: "4px 8px", fontSize: "0.85rem" }}
            >
              <option value="daily">Today (Daily Check)</option>
              <option value="weekly">This Week (7 Days)</option>
              <option value="monthly">This Month (30 Days)</option>
            </select>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            
            {/* Stat Item 1 */}
            <div style={{ background: "var(--bg-card)", padding: "12px", borderRadius: "var(--radius-sm)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span>Medication Adherence</span>
              <span className={`badge ${adherencePercent >= 80 ? "badge-success" : "badge-danger"}`} style={{ fontSize: "1rem" }}>
                {adherencePercent}% Adherence
              </span>
            </div>

            {/* Stat Item 2 */}
            <div style={{ background: "var(--bg-card)", padding: "12px", borderRadius: "var(--radius-sm)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span>Average Fasting Glucose</span>
              <span className="badge badge-primary" style={{ fontSize: "1rem" }}>
                {avgGlucose > 0 ? `${avgGlucose} mg/dL` : "No data"}
              </span>
            </div>

            {/* Stat Item 3 */}
            <div style={{ background: "var(--bg-card)", padding: "12px", borderRadius: "var(--radius-sm)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span>Average Blood Pressure</span>
              <span className="badge badge-primary" style={{ fontSize: "1rem" }}>
                {avgSYS > 0 ? `${avgSYS}/${avgDIA} mmHg` : "No data"}
              </span>
            </div>

            {/* Stat Item 4 */}
            <div style={{ background: "var(--bg-card)", padding: "12px", borderRadius: "var(--radius-sm)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span>Low Stock Prescriptions</span>
              <span className="badge badge-warning" style={{ fontSize: "1rem" }}>
                {profileMeds.filter(m => m.stockCount <= m.minStockAlert).length} Meds
              </span>
            </div>

          </div>

          <div style={{ marginTop: "16px", padding: "10px", background: "var(--bg-card-hover)", borderRadius: "var(--radius-sm)", fontSize: "0.8rem", color: "var(--text-secondary)" }}>
            ℹ️ Scheduled GitHub Actions workflow <code>.github/workflows/daily_reports.yml</code> can be enabled to auto-trigger these digest emails every night at 8:00 PM.
          </div>

        </div>

      </div>

    </div>
  );
};

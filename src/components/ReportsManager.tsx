import React, { useState } from "react";
import { 
  FileText, Mail, Download, Printer, AlertTriangle, User, CheckCircle2, AlertCircle, Eye,
  Folder, FileJson, FileSpreadsheet, Calendar
} from "lucide-react";
import { useApp } from "../context/AppContext";
import { isValidEmail, sendEmailNotification, generateTabularReportHTML, generateRefillAlertHTML } from "../services/emailService";
import { getDailyLogsGrouped, downloadDailyLogJSON, downloadDailyLogCSV } from "../services/logService";

export const ReportsManager: React.FC = () => {
  const { 
    activeProfile, 
    medications, 
    medicationLogs, 
    glucoseLogs, 
    bpLogs, 
    auditLogs,
    caretakerEmail, 
    setCaretakerEmail, 
    showToast
  } = useApp();

  const [reportRange, setReportRange] = useState<"Daily" | "Weekly" | "Monthly">("Weekly");
  const [emailInput, setEmailInput] = useState<string>(caretakerEmail || "addytiwari5@gmail.com");
  const [isSending, setIsSending] = useState<boolean>(false);
  const [showPreviewModal, setShowPreviewModal] = useState<boolean>(false);

  if (!activeProfile) return null;

  const isEmailValid = isValidEmail(emailInput);

  const profileMeds = medications.filter(m => m.profileId === activeProfile.id);
  const profileGlucose = glucoseLogs.filter(g => g.profileId === activeProfile.id);
  const profileBP = bpLogs.filter(b => b.profileId === activeProfile.id);
  const profileLogs = medicationLogs.filter(l => l.profileId === activeProfile.id);

  // Group all activity logs & UI interaction audit logs into date-based daily log files
  const dailyLogsMap = getDailyLogsGrouped(activeProfile, medications, medicationLogs, glucoseLogs, bpLogs, auditLogs);

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

  const handleSaveEmailConfig = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValidEmail(emailInput)) {
      showToast("error", "Invalid Email Address", `"${emailInput}" is not a valid email address format.`);
      return;
    }
    setCaretakerEmail(emailInput.trim());
  };

  // Dispatch Tabular HTML Email Report via Resend API
  const handleSendTabularReport = async () => {
    if (!isValidEmail(emailInput)) {
      showToast("error", "Invalid Recipient Email", `Cannot send email. "${emailInput}" is invalid.`);
      return;
    }

    setIsSending(true);
    const todayStr = new Date().toISOString().split("T")[0];
    const logsToday = medicationLogs.filter(l => l.profileId === activeProfile.id && l.timestamp.startsWith(todayStr));

    const htmlContent = generateTabularReportHTML(activeProfile, profileMeds, logsToday, profileGlucose, profileBP, reportRange);

    const res = await sendEmailNotification({
      to: emailInput.trim(),
      subject: `📋 VitalsGuard ${reportRange} Tabular Health Report: ${activeProfile.name} (${new Date().toLocaleDateString()})`,
      htmlContent,
      type: "tabular_report"
    });

    setIsSending(false);

    if (res.success) {
      showToast("success", "Email Dispatched!", res.message);
    } else {
      showToast("error", "Email Failed", res.message);
    }
  };

  const handleSendRefillAlert = async () => {
    if (!isValidEmail(emailInput)) {
      showToast("error", "Invalid Recipient Email", "Please enter a valid email address first.");
      return;
    }

    const lowMeds = profileMeds.filter(m => m.stockCount <= m.minStockAlert);
    if (lowMeds.length === 0) {
      showToast("info", "Stock Healthy", `All medications for ${activeProfile.name} have sufficient stock.`);
      return;
    }

    setIsSending(true);
    const htmlContent = generateRefillAlertHTML(activeProfile, lowMeds);
    const res = await sendEmailNotification({
      to: emailInput.trim(),
      subject: `⚠️ Urgent Refill Needed for ${activeProfile.name} - VitalsGuard Alert`,
      htmlContent,
      type: "refill_alert"
    });

    setIsSending(false);

    if (res.success) {
      showToast("warning", "Refill Warning Email Sent", res.message);
    } else {
      showToast("error", "Email Failed", res.message);
    }
  };

  const handleExportCSV = () => {
    const csvRows: string[] = [];
    csvRows.push(`VitalsGuard Health Report for ${activeProfile.name}`);
    csvRows.push(`Generated Date,${new Date().toLocaleString()}`);
    csvRows.push(`Caretaker Email,${caretakerEmail}`);
    csvRows.push("");
    
    csvRows.push("--- PRESCRIPTIONS & INVENTORY ---");
    csvRows.push("Medication Name,Dosage,Frequency,Food Relation,Stock Left,Instructions");
    profileMeds.forEach(m => {
      csvRows.push(`"${m.name}","${m.dosage}","${m.frequency}","${m.foodRelation}",${m.stockCount},"${m.instructions || ''}"`);
    });

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
    link.setAttribute("download", `vitalsguard_report_${activeProfile.name.replace(/\s+/g, "_")}_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showToast("success", "CSV Downloaded", "Full tabular records exported to CSV file.");
  };

  const handlePrintPDF = () => {
    window.print();
  };

  return (
    <div className="glass-card">
      
      {/* Header Controls */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px", flexWrap: "wrap", gap: "12px" }}>
        <div>
          <h2 style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <FileText size={22} color="var(--primary)" /> Caretaker Email & Tabular Reports
          </h2>
          <p style={{ fontSize: "0.875rem", color: "var(--text-secondary)" }}>
            Validated caretaker email dispatch, structured HTML tables, PDF & CSV export for {activeProfile.name}
          </p>
        </div>

        {/* Quick Action Export Buttons */}
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
          <button onClick={() => setShowPreviewModal(true)} className="btn btn-secondary btn-sm" title="Preview formatted HTML email report">
            <Eye size={16} /> Preview Mail HTML
          </button>
          <button onClick={handleExportCSV} className="btn btn-secondary btn-sm">
            <Download size={16} /> Export CSV
          </button>
          <button onClick={handlePrintPDF} className="btn btn-primary btn-sm">
            <Printer size={16} /> Print PDF Report
          </button>
        </div>
      </div>

      <div className="grid-2">
        
        {/* Caretaker Email Setup & Manual Dispatch Form */}
        <div style={{ background: "var(--bg-primary)", padding: "18px", borderRadius: "var(--radius-md)", border: "1px solid var(--border-color)" }}>
          <h3 style={{ marginBottom: "12px", display: "flex", alignItems: "center", gap: "8px" }}>
            <Mail size={18} color="var(--primary)" /> Caretaker Email Dispatch
          </h3>

          <form onSubmit={handleSaveEmailConfig}>
            <div className="form-group">
              <label className="form-label" style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap" }}>
                <span>Caretaker Email Address</span>
                {isEmailValid ? (
                  <span style={{ color: "#10b981", fontSize: "0.8rem", display: "flex", alignItems: "center", gap: "4px" }}>
                    <CheckCircle2 size={12} /> Valid Format
                  </span>
                ) : emailInput.length > 0 ? (
                  <span style={{ color: "#ef4444", fontSize: "0.8rem", display: "flex", alignItems: "center", gap: "4px" }}>
                    <AlertCircle size={12} /> Invalid Format
                  </span>
                ) : null}
              </label>
              <input
                type="email"
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                className="form-input"
                placeholder="e.g. addytiwari5@gmail.com"
                style={{ borderColor: !isEmailValid && emailInput.length > 0 ? "#ef4444" : "var(--border-color)" }}
                required
              />
            </div>

            <button 
              type="submit" 
              className="btn btn-secondary btn-sm" 
              style={{ width: "100%", marginBottom: "16px" }}
              disabled={!isEmailValid}
            >
              Save Caretaker Email
            </button>
          </form>

          <hr style={{ borderColor: "var(--border-color)", margin: "16px 0" }} />

          <h4 style={{ marginBottom: "10px" }}>Email Dispatch Actions:</h4>
          
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            
            {/* Primary Direct Send Email Action */}
            <button
              onClick={handleSendTabularReport}
              className="btn btn-primary"
              style={{ width: "100%", justifyContent: "center" }}
              disabled={isSending || !isEmailValid}
              title="Directly send health report and document attachment via email"
            >
              <Mail size={18} /> {isSending ? "Sending Email..." : "Send Email"}
            </button>

            {/* Refill Alert Action */}
            <button
              onClick={handleSendRefillAlert}
              className="btn btn-secondary"
              style={{ width: "100%", justifyContent: "center" }}
              disabled={isSending || !isEmailValid}
            >
              <AlertTriangle size={16} color="var(--warning)" /> Send Refill Warning Email
            </button>

          </div>

          <div style={{ marginTop: "14px", padding: "10px", background: "var(--bg-card)", borderRadius: "var(--radius-sm)", fontSize: "0.775rem", color: "var(--text-muted)" }}>
            💡 <strong>Resend Email Note:</strong> Clicking "Send Email" forwards the report & attached document directly via Resend API to target recipient <code>{emailInput}</code>.
          </div>
        </div>

        {/* Live Summary Preview Card */}
        <div style={{ background: "var(--bg-primary)", padding: "18px", borderRadius: "var(--radius-md)", border: "1px solid var(--border-color)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px", flexWrap: "wrap", gap: "8px" }}>
            <h3 style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <User size={18} color="var(--accent)" /> Summary for {activeProfile.name}
            </h3>
            
            <select
              value={reportRange}
              onChange={(e) => setReportRange(e.target.value as any)}
              className="form-select"
              style={{ width: "auto", padding: "4px 8px", fontSize: "0.85rem" }}
            >
              <option value="Daily">Daily Summary</option>
              <option value="Weekly">Weekly Summary</option>
              <option value="Monthly">Monthly Summary</option>
            </select>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            
            <div style={{ background: "var(--bg-card)", padding: "12px", borderRadius: "var(--radius-sm)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span>Medication Adherence</span>
              <span className={`badge ${adherencePercent >= 80 ? "badge-success" : "badge-danger"}`} style={{ fontSize: "0.95rem" }}>
                {adherencePercent}% Adherence
              </span>
            </div>

            <div style={{ background: "var(--bg-card)", padding: "12px", borderRadius: "var(--radius-sm)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span>Average Fasting Glucose</span>
              <span className="badge badge-primary" style={{ fontSize: "0.95rem" }}>
                {avgGlucose > 0 ? `${avgGlucose} mg/dL` : "No data"}
              </span>
            </div>

            <div style={{ background: "var(--bg-card)", padding: "12px", borderRadius: "var(--radius-sm)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span>Average Blood Pressure</span>
              <span className="badge badge-primary" style={{ fontSize: "0.95rem" }}>
                {avgSYS > 0 ? `${avgSYS}/${avgDIA} mmHg` : "No data"}
              </span>
            </div>

            <div style={{ background: "var(--bg-card)", padding: "12px", borderRadius: "var(--radius-sm)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span>Low Stock Prescriptions</span>
              <span className="badge badge-warning" style={{ fontSize: "0.95rem" }}>
                {profileMeds.filter(m => m.stockCount <= m.minStockAlert).length} Meds
              </span>
            </div>

          </div>

            <div style={{ marginTop: "16px", padding: "10px", background: "var(--bg-card-hover)", borderRadius: "var(--radius-sm)", fontSize: "0.8rem", color: "var(--text-secondary)" }}>
            💡 Click <strong>"Preview Mail HTML"</strong> above to view the exact tabular HTML email before sending.
          </div>

        </div>

      </div>

      {/* Daily Log Files Storage Repository */}
      <div className="glass-card" style={{ marginTop: "20px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px", flexWrap: "wrap", gap: "8px" }}>
          <div>
            <h3 style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <Folder size={20} color="var(--primary)" /> Daily Log Files Repository
            </h3>
            <p style={{ fontSize: "0.825rem", color: "var(--text-secondary)" }}>
              Medication & vitals records organized into date-based daily log files for {activeProfile.name}
            </p>
          </div>
          <span className="badge badge-primary" style={{ fontSize: "0.8rem" }}>
            {Object.keys(dailyLogsMap).length} Daily Log File(s)
          </span>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {Object.values(dailyLogsMap).map(daily => (
            <div 
              key={daily.dateStr} 
              style={{
                background: "var(--bg-primary)",
                border: "1px solid var(--border-color)",
                borderRadius: "var(--radius-md)",
                padding: "12px 14px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                flexWrap: "wrap",
                gap: "10px"
              }}
            >
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                  <Calendar size={16} color="var(--primary)" />
                  <strong style={{ fontSize: "0.95rem" }}>{daily.formattedDate}</strong>
                  <span className="badge badge-primary" style={{ fontSize: "0.75rem" }}>
                    vitalsguard_log_{daily.dateStr}
                  </span>
                </div>
                <p style={{ fontSize: "0.8rem", color: "var(--text-secondary)", marginTop: "4px" }}>
                  💊 {daily.medicationLogs.length} Med Logs • 🩸 {daily.glucoseLogs.length} Glucose Logs • ❤️ {daily.bpLogs.length} BP Logs
                </p>
              </div>

              <div style={{ display: "flex", gap: "8px" }}>
                <button
                  onClick={() => downloadDailyLogJSON(daily)}
                  className="btn btn-secondary btn-sm"
                  title={`Download ${daily.dateStr} daily log file as JSON`}
                >
                  <FileJson size={14} color="#38bdf8" /> JSON File
                </button>
                <button
                  onClick={() => downloadDailyLogCSV(daily)}
                  className="btn btn-secondary btn-sm"
                  title={`Download ${daily.dateStr} daily log file as CSV`}
                >
                  <FileSpreadsheet size={14} color="#10b981" /> CSV File
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* HTML EMAIL PREVIEW MODAL */}
      {showPreviewModal && (
        <div className="modal-overlay" onClick={() => setShowPreviewModal(false)}>
          <div className="modal-content" style={{ maxWidth: "720px", maxHeight: "85vh", padding: "16px" }} onClick={e => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
              <h3>HTML Tabular Email Preview</h3>
              <button onClick={() => setShowPreviewModal(false)} className="btn btn-secondary btn-sm">✕ Close</button>
            </div>
            
            <iframe
              srcDoc={generateTabularReportHTML(
                activeProfile, 
                profileMeds, 
                medicationLogs.filter(l => l.profileId === activeProfile.id), 
                profileGlucose, 
                profileBP, 
                reportRange
              )}
              style={{ width: "100%", height: "500px", border: "1px solid var(--border-color)", borderRadius: "var(--radius-md)" }}
              title="HTML Email Tabular Preview"
            />
          </div>
        </div>
      )}

    </div>
  );
};

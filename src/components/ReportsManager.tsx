import React, { useState, useMemo } from "react";
import { 
  FileText, Mail, Download, Printer, AlertTriangle, CheckCircle2, AlertCircle, Eye,
  Folder, FileJson, FileSpreadsheet, Calendar, Search, Filter
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

  const [emailInput, setEmailInput] = useState<string>(caretakerEmail || "addytiwari5@gmail.com");
  const [isSending, setIsSending] = useState<boolean>(false);
  const [showPreviewModal, setShowPreviewModal] = useState<boolean>(false);

  // Search mechanism in mailing logs state
  const [searchQuery, setSearchQuery] = useState<string>("");

  // CSV Custom Export & Email states
  const [csvLimitType, setCsvLimitType] = useState<"today" | "custom" | "all">("today");
  const [csvStartDate, setCsvStartDate] = useState<string>(
    new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]
  );
  const [csvEndDate, setCsvEndDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  );

  const isEmailValid = isValidEmail(emailInput);

  const getSelectedLimitDateRange = (): { start: Date; end: Date } => {
    if (csvLimitType === "today") {
      const startToday = new Date();
      startToday.setHours(0, 0, 0, 0);
      const endToday = new Date();
      endToday.setHours(23, 59, 59, 999);
      return { start: startToday, end: endToday };
    } else if (csvLimitType === "custom") {
      const startParts = csvStartDate.split("-").map(Number);
      const endParts = csvEndDate.split("-").map(Number);
      const startRange = new Date(startParts[0], startParts[1] - 1, startParts[2]);
      startRange.setHours(0, 0, 0, 0);
      const endRange = new Date(endParts[0], endParts[1] - 1, endParts[2]);
      endRange.setHours(23, 59, 59, 999);
      return { start: startRange, end: endRange };
    } else {
      const startAll = new Date(0);
      const endAll = new Date();
      endAll.setFullYear(endAll.getFullYear() + 100);
      return { start: startAll, end: endAll };
    }
  };

  const profileMeds = useMemo(() => activeProfile ? medications.filter(m => m.profileId === activeProfile.id) : [], [medications, activeProfile]);
  const profileGlucose = useMemo(() => activeProfile ? glucoseLogs.filter(g => g.profileId === activeProfile.id) : [], [glucoseLogs, activeProfile]);
  const profileBP = useMemo(() => activeProfile ? bpLogs.filter(b => b.profileId === activeProfile.id) : [], [bpLogs, activeProfile]);
  const profileLogs = useMemo(() => activeProfile ? medicationLogs.filter(l => l.profileId === activeProfile.id) : [], [medicationLogs, activeProfile]);

  // Filter range data strictly for summary stats
  const { start: previewStart, end: previewEnd } = getSelectedLimitDateRange();

  const rangeGlucose = useMemo(() => {
    return profileGlucose.filter(g => {
      const d = new Date(g.timestamp);
      return d >= previewStart && d <= previewEnd;
    });
  }, [profileGlucose, previewStart, previewEnd]);

  const rangeBP = useMemo(() => {
    return profileBP.filter(b => {
      const d = new Date(b.timestamp);
      return d >= previewStart && d <= previewEnd;
    });
  }, [profileBP, previewStart, previewEnd]);

  const rangeLogs = useMemo(() => {
    return profileLogs.filter(l => {
      const d = new Date(l.timestamp);
      return d >= previewStart && d <= previewEnd;
    });
  }, [profileLogs, previewStart, previewEnd]);

  // Search filter logs by specific query / dates
  const searchedLogs = useMemo(() => {
    if (!searchQuery.trim()) return null;
    const q = searchQuery.toLowerCase().trim();

    const matchedGlucose = profileGlucose.filter(g => 
      g.timestamp.includes(q) ||
      g.status.toLowerCase().includes(q) ||
      g.mealType.toLowerCase().includes(q) ||
      (g.notes && g.notes.toLowerCase().includes(q)) ||
      String(g.value).includes(q)
    );

    const matchedBP = profileBP.filter(b => 
      b.timestamp.includes(q) ||
      b.category.toLowerCase().includes(q) ||
      (b.notes && b.notes.toLowerCase().includes(q)) ||
      String(b.systolic).includes(q) ||
      String(b.diastolic).includes(q)
    );

    const matchedMeds = profileLogs.filter(l => 
      l.timestamp.includes(q) ||
      l.status.toLowerCase().includes(q) ||
      (l.notes && l.notes.toLowerCase().includes(q))
    );

    return {
      glucose: matchedGlucose,
      bp: matchedBP,
      meds: matchedMeds,
      totalCount: matchedGlucose.length + matchedBP.length + matchedMeds.length
    };
  }, [profileGlucose, profileBP, profileLogs, searchQuery]);

  // Group all activity logs & UI interaction audit logs into date-based daily log files
  const dailyLogsMap = useMemo(() => {
    if (!activeProfile) return new Map();
    return getDailyLogsGrouped(activeProfile, medications, medicationLogs, glucoseLogs, bpLogs, auditLogs);
  }, [activeProfile, medications, medicationLogs, glucoseLogs, bpLogs, auditLogs]);

  // Compute adherence stats dynamically
  const totalMedsCount = profileMeds.length;
  const takenLogsCount = useMemo(() => rangeLogs.filter(l => l.status === "taken").length, [rangeLogs]);
  
  const adherencePercent = useMemo(() => {
    const uniqueDaysInRange = new Set(rangeLogs.map(l => l.timestamp.split('T')[0]));
    const numDaysInRange = Math.max(1, uniqueDaysInRange.size);
    return totalMedsCount > 0 ? Math.min(100, Math.round((takenLogsCount / (totalMedsCount * numDaysInRange)) * 100)) : 100;
  }, [rangeLogs, totalMedsCount, takenLogsCount]);

  // Average glucose
  const avgGlucose = useMemo(() => {
    return rangeGlucose.length > 0 
      ? Math.round(rangeGlucose.reduce((acc, g) => acc + g.value, 0) / rangeGlucose.length) 
      : 0;
  }, [rangeGlucose]);

  // Average BP
  const avgSYS = useMemo(() => {
    return rangeBP.length > 0 ? Math.round(rangeBP.reduce((acc, b) => acc + b.systolic, 0) / rangeBP.length) : 0;
  }, [rangeBP]);

  const avgDIA = useMemo(() => {
    return rangeBP.length > 0 ? Math.round(rangeBP.reduce((acc, b) => acc + b.diastolic, 0) / rangeBP.length) : 0;
  }, [rangeBP]);

  if (!activeProfile) return null;

  const handleSaveEmailConfig = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValidEmail(emailInput)) {
      showToast("error", "Invalid Email Address", `"${emailInput}" is not a valid email address format.`);
      return;
    }
    setCaretakerEmail(emailInput.trim());
  };

  const generateCSVData = (
    profile: any,
    meds: any[],
    glucose: any[],
    bp: any[],
    logs: any[],
    startDate: Date,
    endDate: Date,
    caretakerEmailAddress: string
  ): string => {
    const avgGlucoseVal = glucose.length > 0 
      ? Math.round(glucose.reduce((acc, g) => acc + g.value, 0) / glucose.length) 
      : "N/A";
    const avgSYSVal = bp.length > 0 ? Math.round(bp.reduce((acc, b) => acc + b.systolic, 0) / bp.length) : 0;
    const avgDIAVal = bp.length > 0 ? Math.round(bp.reduce((acc, b) => acc + b.diastolic, 0) / bp.length) : 0;
    const avgBPStr = avgSYSVal > 0 ? `${avgSYSVal}/${avgDIAVal} mmHg` : "N/A";
    
    const totalScheduled = meds.length;
    const totalTaken = logs.filter(l => l.status === "taken").length;
    
    const uniqueDays = new Set(logs.map(l => l.timestamp.split('T')[0]));
    const numDays = Math.max(1, uniqueDays.size);
    const adherence = totalScheduled > 0 ? Math.min(100, Math.round((totalTaken / (totalScheduled * numDays)) * 100)) : 100;

    const csvRows: string[] = [];
    csvRows.push(`========================================================`);
    csvRows.push(`🛡️ VITALSGUARD HEALTH RECORDS SUMMARY`);
    csvRows.push(`========================================================`);
    csvRows.push(`Patient Name,${profile.name}`);
    csvRows.push(`Relationship / Role,${profile.role}`);
    csvRows.push(`Caretaker Email Address,${caretakerEmailAddress}`);
    csvRows.push(`Report Range,${startDate.toLocaleDateString()} to ${endDate.toLocaleDateString()}`);
    csvRows.push(`Exported Timestamp,${new Date().toLocaleString()}`);
    csvRows.push(``);
    csvRows.push(`📈 RANGE METRICS SUMMARY`);
    csvRows.push(`--------------------------------------------------------`);
    csvRows.push(`Total Prescriptions,${meds.length}`);
    csvRows.push(`Range Adherence Rate,${adherence}%`);
    csvRows.push(`Average Blood Glucose,${avgGlucoseVal === "N/A" ? "N/A" : avgGlucoseVal + " mg/dL"}`);
    csvRows.push(`Average Blood Pressure,${avgBPStr}`);
    csvRows.push(``);
    
    csvRows.push(`========================================================`);
    csvRows.push(`💊 PRESCRIPTIONS & INVENTORY`);
    csvRows.push(`========================================================`);
    csvRows.push("Medication Name,Dosage,Frequency,Food Relation,Stock Left,Instructions");
    meds.forEach(m => {
      csvRows.push(`"${m.name.replace(/"/g, '""')}","${m.dosage.replace(/"/g, '""')}","${m.frequency.replace(/"/g, '""')}","${m.foodRelation.replace(/"/g, '""')}",${m.stockCount},"${(m.instructions || '').replace(/"/g, '""')}"`);
    });

    csvRows.push(``);
    csvRows.push(`========================================================`);
    csvRows.push(`🩸 BLOOD GLUCOSE LOGS (ADA target: fasting 70-130; post-meal <180)`);
    csvRows.push(`========================================================`);
    csvRows.push("Timestamp,Value (mg/dL),Meal Routine,Status,Notes");
    glucose.forEach(g => {
      csvRows.push(`"${new Date(g.timestamp).toLocaleString()}",${g.value},"${g.mealType}","${g.status}","${(g.notes || '').replace(/"/g, '""')}"`);
    });

    csvRows.push(``);
    csvRows.push(`========================================================`);
    csvRows.push(`❤️ BLOOD PRESSURE LOGS (AHA target: normal <120/80)`);
    csvRows.push(`========================================================`);
    csvRows.push("Timestamp,Systolic (mmHg),Diastolic (mmHg),Pulse (bpm),Category,Notes");
    bp.forEach(b => {
      csvRows.push(`"${new Date(b.timestamp).toLocaleString()}",${b.systolic},${b.diastolic},${b.pulse},"${b.category}","${(b.notes || '').replace(/"/g, '""')}"`);
    });

    csvRows.push(``);
    csvRows.push(`========================================================`);
    csvRows.push(`📋 MEDICATION ADHERENCE INTAKE LOGS`);
    csvRows.push(`========================================================`);
    csvRows.push("Timestamp,Medication Name,Dosage,Status,Quantity Taken,Notes");
    logs.forEach(l => {
      const med = meds.find(m => m.id === l.medicationId);
      const medName = med ? med.name : "Unknown Medication";
      const medDosage = med ? med.dosage : "";
      csvRows.push(`"${new Date(l.timestamp).toLocaleString()}","${medName.replace(/"/g, '""')}","${medDosage.replace(/"/g, '""')}","${l.status}",${l.quantityTaken},"${(l.notes || '').replace(/"/g, '""')}"`);
    });

    return csvRows.join("\n");
  };

  // Dispatch Tabular HTML Email Report with fancy CSV attachment
  const handleSendTabularReport = async () => {
    if (!isValidEmail(emailInput)) {
      showToast("error", "Invalid Recipient Email", `Cannot send email. "${emailInput}" is invalid.`);
      return;
    }

    setIsSending(true);
    const { start: limitStart, end: limitEnd } = getSelectedLimitDateRange();

    const currentRangeGlucose = profileGlucose.filter(g => {
      const d = new Date(g.timestamp);
      return d >= limitStart && d <= limitEnd;
    });
    const currentRangeBP = profileBP.filter(b => {
      const d = new Date(b.timestamp);
      return d >= limitStart && d <= limitEnd;
    });
    const currentRangeLogs = profileLogs.filter(l => {
      const d = new Date(l.timestamp);
      return d >= limitStart && d <= limitEnd;
    });

    const csvContent = generateCSVData(
      activeProfile,
      profileMeds,
      currentRangeGlucose,
      currentRangeBP,
      currentRangeLogs,
      limitStart,
      limitEnd,
      caretakerEmail
    );
    const csvBase64 = btoa(unescape(encodeURIComponent(csvContent)));

    const rangeLabel = csvLimitType === "custom" 
      ? `${limitStart.toLocaleDateString()} to ${limitEnd.toLocaleDateString()}` 
      : (csvLimitType === "today" ? "Today" : "All Time");
    
    const htmlContent = generateTabularReportHTML(activeProfile, profileMeds, currentRangeLogs, currentRangeGlucose, currentRangeBP, rangeLabel);
    const filename = `vitalsguard_report_${activeProfile.name.replace(/\s+/g, "_")}_${csvLimitType === "custom" ? "custom_range" : csvLimitType}.csv`;

    const res = await sendEmailNotification({
      to: emailInput.trim(),
      subject: `📋 VitalsGuard Health Report: ${activeProfile.name} (${rangeLabel})`,
      htmlContent,
      type: "tabular_report",
      attachments: [
        {
          filename,
          content: csvBase64,
          contentType: "text/csv"
        }
      ]
    });

    setIsSending(false);

    if (res.success) {
      showToast("success", "Email Dispatched!", res.message);
    } else {
      showToast("error", "Email Failed", res.message);
    }
  };

  // Dispatch Email Report specifically for Searched Days / Query
  const handleSendSearchedDaysReport = async () => {
    if (!searchedLogs || searchedLogs.totalCount === 0) {
      showToast("warning", "No Logs Found", "No log entries match your search query.");
      return;
    }
    if (!isValidEmail(emailInput)) {
      showToast("error", "Invalid Recipient Email", `"${emailInput}" is invalid.`);
      return;
    }

    setIsSending(true);
    const rangeLabel = `Searched Days ("${searchQuery}")`;

    const htmlContent = generateTabularReportHTML(
      activeProfile,
      profileMeds,
      searchedLogs.meds,
      searchedLogs.glucose,
      searchedLogs.bp,
      rangeLabel
    );

    const csvContent = generateCSVData(
      activeProfile,
      profileMeds,
      searchedLogs.glucose,
      searchedLogs.bp,
      searchedLogs.meds,
      new Date(),
      new Date(),
      caretakerEmail
    );
    const csvBase64 = btoa(unescape(encodeURIComponent(csvContent)));

    const res = await sendEmailNotification({
      to: emailInput.trim(),
      subject: `📋 VitalsGuard Search Report (${searchQuery}): ${activeProfile.name}`,
      htmlContent,
      type: "tabular_report",
      attachments: [
        {
          filename: `vitalsguard_search_report_${searchQuery.replace(/[^a-zA-Z0-9]/g, '_')}.csv`,
          content: csvBase64,
          contentType: "text/csv"
        }
      ]
    });

    setIsSending(false);
    if (res.success) {
      showToast("success", "Searched Days Email Sent!", res.message);
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
    const { start: limitStart, end: limitEnd } = getSelectedLimitDateRange();
    
    const exportGlucose = searchedLogs ? searchedLogs.glucose : profileGlucose.filter(g => {
      const d = new Date(g.timestamp);
      return d >= limitStart && d <= limitEnd;
    });
    const exportBP = searchedLogs ? searchedLogs.bp : profileBP.filter(b => {
      const d = new Date(b.timestamp);
      return d >= limitStart && d <= limitEnd;
    });
    const exportLogs = searchedLogs ? searchedLogs.meds : profileLogs.filter(l => {
      const d = new Date(l.timestamp);
      return d >= limitStart && d <= limitEnd;
    });

    const csvContent = generateCSVData(
      activeProfile,
      profileMeds,
      exportGlucose,
      exportBP,
      exportLogs,
      limitStart,
      limitEnd,
      caretakerEmail
    );
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    const dateStr = limitEnd.toISOString().split("T")[0];
    link.setAttribute("download", `vitalsguard_report_${activeProfile.name.replace(/\s+/g, "_")}_${searchQuery ? 'search' : dateStr}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showToast("success", "CSV Downloaded", `Tabular records exported successfully to CSV file.`);
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
            Validated caretaker email dispatch, search specific days, HTML tables, PDF & CSV export for {activeProfile.name}
          </p>
        </div>

        {/* Quick Action Export Buttons */}
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
          <button id="preview-email-html-btn" onClick={() => setShowPreviewModal(true)} className="btn btn-secondary btn-sm" title="Preview formatted HTML email report">
            <Eye size={16} /> Preview Mail HTML
          </button>
          <button id="export-csv-btn" onClick={handleExportCSV} className="btn btn-secondary btn-sm">
            <Download size={16} /> Export CSV
          </button>
          <button id="print-pdf-btn" onClick={handlePrintPDF} className="btn btn-primary btn-sm">
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
              <label className="form-label" htmlFor="caretaker-email-input" style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap" }}>
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
                id="caretaker-email-input"
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
              id="save-caretaker-email-btn"
              type="submit" 
              className="btn btn-secondary btn-sm" 
              style={{ width: "100%", marginBottom: "16px" }}
              disabled={!isEmailValid}
            >
              Save Caretaker Email
            </button>
          </form>

          <hr style={{ borderColor: "var(--border-color)", margin: "16px 0" }} />

          <h4 style={{ marginBottom: "10px" }}>Configure Standard Report Range:</h4>

          <div style={{ display: "flex", flexDirection: "column", gap: "10px", background: "var(--bg-card)", padding: "12px", borderRadius: "var(--radius-sm)", border: "1px solid var(--border-color)", marginBottom: "16px" }}>
            
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label" style={{ fontSize: "0.8rem", marginBottom: "4px" }}>Report Scope:</label>
              <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", marginBottom: "8px" }}>
                <label style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "0.8rem", cursor: "pointer", color: "var(--text-primary)" }}>
                  <input
                    type="radio"
                    name="csvLimitType"
                    value="today"
                    checked={csvLimitType === "today"}
                    onChange={() => setCsvLimitType("today")}
                  />
                  Daily (Today)
                </label>
                <label style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "0.8rem", cursor: "pointer", color: "var(--text-primary)" }}>
                  <input
                    type="radio"
                    name="csvLimitType"
                    value="custom"
                    checked={csvLimitType === "custom"}
                    onChange={() => setCsvLimitType("custom")}
                  />
                  Custom Date Range
                </label>
                <label style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "0.8rem", cursor: "pointer", color: "var(--text-primary)" }}>
                  <input
                    type="radio"
                    name="csvLimitType"
                    value="all"
                    checked={csvLimitType === "all"}
                    onChange={() => setCsvLimitType("all")}
                  />
                  All Time
                </label>
              </div>
            </div>

            {csvLimitType === "custom" && (
              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                <div className="form-group" style={{ margin: 0, flex: "1 1 120px" }}>
                  <label className="form-label" htmlFor="csv-start-date-input" style={{ fontSize: "0.75rem", marginBottom: "2px" }}>Start Date</label>
                  <input
                    id="csv-start-date-input"
                    type="date"
                    value={csvStartDate}
                    onChange={(e) => setCsvStartDate(e.target.value)}
                    className="form-input"
                    style={{ padding: "4px 8px", fontSize: "0.85rem" }}
                  />
                </div>
                <div className="form-group" style={{ margin: 0, flex: "1 1 120px" }}>
                  <label className="form-label" htmlFor="csv-end-date-input" style={{ fontSize: "0.75rem", marginBottom: "2px" }}>End Date</label>
                  <input
                    id="csv-end-date-input"
                    type="date"
                    value={csvEndDate}
                    onChange={(e) => setCsvEndDate(e.target.value)}
                    className="form-input"
                    style={{ padding: "4px 8px", fontSize: "0.85rem" }}
                  />
                </div>
              </div>
            )}
          </div>

          <h4 style={{ marginBottom: "10px" }}>Email Dispatch Actions:</h4>
          
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            <button
              id="send-tabular-report-btn"
              onClick={handleSendTabularReport}
              className="btn btn-primary"
              style={{ width: "100%", justifyContent: "center" }}
              disabled={isSending || !isEmailValid}
              title="Directly send health report and document attachment via email"
            >
              <Mail size={18} /> {isSending ? "Sending Email..." : "Send Standard Email Report"}
            </button>

            <button
              id="send-refill-alert-btn"
              onClick={handleSendRefillAlert}
              className="btn btn-secondary"
              style={{ width: "100%", justifyContent: "center" }}
              disabled={isSending || !isEmailValid}
            >
              <AlertTriangle size={16} color="var(--warning)" /> Send Refill Warning Email
            </button>
          </div>
        </div>

        {/* LOG SEARCH & SPECIFIC DAYS MAILING TOOL */}
        <div style={{ background: "var(--bg-primary)", padding: "18px", borderRadius: "var(--radius-md)", border: "1px solid var(--border-color)", display: "flex", flexDirection: "column", gap: "14px" }}>
          <h3 style={{ display: "flex", alignItems: "center", gap: "8px", margin: 0 }}>
            <Search size={18} color="var(--primary)" /> Search & Mail Specific Days / Logs
          </h3>
          <p style={{ fontSize: "0.8rem", color: "var(--text-secondary)", margin: 0 }}>
            Search health records by date (e.g. <code>2026-08-06</code>), status (e.g. <code>Fasting</code>, <code>High</code>), or note keyword, then email a targeted report for those days.
          </p>

          <div className="form-group" style={{ margin: 0 }}>
            <div style={{ position: "relative" }}>
              <input
                id="log-search-input"
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search logs e.g. 2026-08-06, Fasting, High..."
                className="form-input"
                style={{ paddingRight: "36px" }}
              />
              <Search size={16} color="var(--text-muted)" style={{ position: "absolute", right: "10px", top: "50%", transform: "translateY(-50%)" }} />
            </div>
          </div>

          {searchQuery.trim() ? (
            <div style={{ background: "var(--bg-card)", padding: "12px", borderRadius: "var(--radius-sm)", border: "1px solid var(--border-color)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                <strong style={{ fontSize: "0.85rem" }}>Search Results Preview</strong>
                <span className="badge badge-primary" style={{ fontSize: "0.75rem" }}>
                  {searchedLogs?.totalCount || 0} Matches
                </span>
              </div>

              {searchedLogs && searchedLogs.totalCount > 0 ? (
                <div style={{ display: "flex", flexDirection: "column", gap: "6px", maxHeight: "160px", overflowY: "auto", fontSize: "0.8rem", marginBottom: "12px" }}>
                  {searchedLogs.glucose.map(g => (
                    <div key={g.id} style={{ display: "flex", justifyContent: "space-between", padding: "4px 8px", background: "var(--bg-primary)", borderRadius: "4px" }}>
                      <span>🩸 Glucose {g.value} mg/dL ({g.mealType})</span>
                      <span style={{ color: "var(--text-secondary)" }}>{g.timestamp.split('T')[0]}</span>
                    </div>
                  ))}
                  {searchedLogs.bp.map(b => (
                    <div key={b.id} style={{ display: "flex", justifyContent: "space-between", padding: "4px 8px", background: "var(--bg-primary)", borderRadius: "4px" }}>
                      <span>❤️ BP {b.systolic}/{b.diastolic} mmHg</span>
                      <span style={{ color: "var(--text-secondary)" }}>{b.timestamp.split('T')[0]}</span>
                    </div>
                  ))}
                  {searchedLogs.meds.map(m => (
                    <div key={m.id} style={{ display: "flex", justifyContent: "space-between", padding: "4px 8px", background: "var(--bg-primary)", borderRadius: "4px" }}>
                      <span>💊 Med Adherence ({m.status})</span>
                      <span style={{ color: "var(--text-secondary)" }}>{m.timestamp.split('T')[0]}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", margin: 0, padding: "8px 0" }}>
                  No matching log entries found for "{searchQuery}".
                </p>
              )}

              <button
                id="send-searched-days-email-btn"
                onClick={handleSendSearchedDaysReport}
                className="btn btn-primary btn-sm"
                style={{ width: "100%", justifyContent: "center" }}
                disabled={isSending || !isEmailValid || !searchedLogs || searchedLogs.totalCount === 0}
              >
                <Mail size={16} /> Send Email Report for Searched Days
              </button>
            </div>
          ) : (
            <div style={{ background: "var(--bg-card)", padding: "14px", borderRadius: "var(--radius-sm)", border: "1px dashed var(--border-color)", textAlign: "center" }}>
              <Filter size={24} color="var(--primary)" style={{ marginBottom: "6px" }} />
              <p style={{ fontSize: "0.8rem", color: "var(--text-secondary)", margin: 0 }}>
                Type a date or keyword above to filter and email specific days' logs to recipient <code>{emailInput}</code>.
              </p>
            </div>
          )}

          {/* Live Overall Summary Preview */}
          <div style={{ borderTop: "1px solid var(--border-color)", paddingTop: "12px", marginTop: "4px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
              <span style={{ fontSize: "0.85rem", fontWeight: "600" }}>Overall Range Stats ({csvLimitType})</span>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "8px", fontSize: "0.8rem" }}>
              <div style={{ background: "var(--bg-card)", padding: "8px 10px", borderRadius: "var(--radius-sm)" }}>
                <span style={{ color: "var(--text-secondary)" }}>Adherence: </span>
                <strong>{adherencePercent}%</strong>
              </div>
              <div style={{ background: "var(--bg-card)", padding: "8px 10px", borderRadius: "var(--radius-sm)" }}>
                <span style={{ color: "var(--text-secondary)" }}>Avg Fasting: </span>
                <strong>{avgGlucose > 0 ? `${avgGlucose} mg/dL` : "N/A"}</strong>
              </div>
              <div style={{ background: "var(--bg-card)", padding: "8px 10px", borderRadius: "var(--radius-sm)" }}>
                <span style={{ color: "var(--text-secondary)" }}>Avg BP: </span>
                <strong>{avgSYS > 0 ? `${avgSYS}/${avgDIA}` : "N/A"}</strong>
              </div>
            </div>
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
                searchedLogs ? searchedLogs.meds : profileLogs.filter(l => {
                  const { start, end } = getSelectedLimitDateRange();
                  const d = new Date(l.timestamp);
                  return d >= start && d <= end;
                }), 
                searchedLogs ? searchedLogs.glucose : profileGlucose.filter(g => {
                  const { start, end } = getSelectedLimitDateRange();
                  const d = new Date(g.timestamp);
                  return d >= start && d <= end;
                }), 
                searchedLogs ? searchedLogs.bp : profileBP.filter(b => {
                  const { start, end } = getSelectedLimitDateRange();
                  const d = new Date(b.timestamp);
                  return d >= start && d <= end;
                }), 
                searchQuery ? `Searched Days ("${searchQuery}")` : (csvLimitType === "custom" ? "Custom Range" : (csvLimitType === "today" ? "Today" : "All Time"))
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

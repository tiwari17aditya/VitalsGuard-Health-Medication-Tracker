import type { UserProfile, Medication, GlucoseLog, BPLog, MedicationLog } from "../types";

export interface EmailAttachment {
  filename: string;
  content: string; // Base64 encoded string
  contentType?: string;
}

export interface EmailPayload {
  to: string;
  subject: string;
  htmlContent: string;
  type: "refill_alert" | "daily_check" | "weekly_report" | "monthly_report" | "tabular_report" | "csv_report";
  attachments?: EmailAttachment[];
}

/**
 * Validates strictly formatted email addresses
 */
export function isValidEmail(email: string): boolean {
  if (!email || typeof email !== "string") return false;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim());
}

/**
 * Helper to parse HTML email content into clean, readable plain text for mailto fallback
 */
function stripHtmlToPlainText(html: string): string {
  let text = html
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
    .replace(/<head[^>]*>[\s\S]*?<\/head>/gi, "")
    .replace(/<tr[^>]*>/gi, "\n")
    .replace(/<\/td>/gi, "  |  ")
    .replace(/<\/th>/gi, "  |  ")
    .replace(/<h[1-6][^>]*>/gi, "\n\n=== ")
    .replace(/<\/h[1-6]>/gi, " ===\n")
    .replace(/<p[^>]*>/gi, "\n")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<li[^>]*>/gi, "\n- ")
    .replace(/<[^>]+>/g, ""); // Strip all remaining HTML tags
  
  // Resolve HTML entities
  text = text
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\n\s*\n+/g, "\n\n")
    .trim();
  
  return text;
}

/**
 * Formulates and opens a mailto link using native window.open/href redirection
 */
function openMailtoClient(to: string, subject: string, htmlContent: string) {
  const plainText = stripHtmlToPlainText(htmlContent);
  const mailtoUrl = `mailto:${encodeURIComponent(to)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(plainText)}`;
  window.location.href = mailtoUrl;
}

/**
 * Dispatches an email directly using Gmail SMTP Serverless Service with inline HTML & attached report document
 */
export async function sendEmailNotification(payload: EmailPayload): Promise<{ success: boolean; message: string }> {
  if (!isValidEmail(payload.to)) {
    return {
      success: false,
      message: `Invalid email address format: "${payload.to}". Please enter a valid email address.`
    };
  }

  try {
    // Generate Base64 encoded HTML document attachment
    const documentBase64 = btoa(unescape(encodeURIComponent(payload.htmlContent)));

    const requestPayload = {
      to: payload.to.trim(),
      subject: payload.subject,
      html: payload.htmlContent,
      attachments: payload.attachments || [
        {
          filename: `VitalsGuard_Health_Report_${new Date().toISOString().split('T')[0]}.html`,
          content: documentBase64
        }
      ]
    };

    // Dispatch directly via Gmail SMTP API Service
    const response = await fetch("/api/send_mail", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(requestPayload)
    });

    const data = await response.json().catch(() => ({}));

    if (response.ok && (data.success || data.messageId)) {
      console.log("Gmail SMTP Email Dispatched Successfully:", data);
      return { 
        success: true, 
        message: `Email report & attached health document delivered directly to ${payload.to} via Gmail SMTP!` 
      };
    } else {
      const errorMsg = data.error || data.message || "Failed to deliver email via SMTP";
      console.warn(`Direct email dispatch failed (${errorMsg}). Falling back to mailto client.`);
      openMailtoClient(payload.to.trim(), payload.subject, payload.htmlContent);
      return {
        success: true,
        message: `Direct dispatch failed (${errorMsg}). Opened your default email app with the pre-filled report summary!`
      };
    }
  } catch (err: any) {
    console.error("Gmail SMTP Dispatch Exception:", err);
    console.warn("Falling back to mailto client due to connection failure.");
    openMailtoClient(payload.to.trim(), payload.subject, payload.htmlContent);
    return { 
      success: true, 
      message: `Email service unavailable. Opened your default email app with the pre-filled report summary!` 
    };
  }
}

/**
 * Generates a Rich HTML Tabular Email Report
 */
export function generateTabularReportHTML(
  profile: UserProfile, 
  meds: Medication[], 
  logsToday: MedicationLog[], 
  glucoseLogs: GlucoseLog[], 
  bpLogs: BPLog[],
  reportType: "Daily" | "Weekly" | "Monthly" = "Daily"
): string {
  const totalMeds = meds.length;
  const takenCount = logsToday.filter(l => l.status === "taken").length;
  const adherencePercent = totalMeds > 0 ? Math.round((takenCount / totalMeds) * 100) : 100;

  const medTableRows = meds.length === 0 ? `
    <tr>
      <td colspan="5" style="padding: 12px; text-align: center; color: #6b7280;">No prescriptions currently registered.</td>
    </tr>
  ` : meds.map(m => {
    const isTaken = logsToday.some(l => l.medicationId === m.id && l.status === "taken");
    const isLow = m.stockCount <= m.minStockAlert;
    return `
      <tr style="border-bottom: 1px solid #e5e7eb;">
        <td style="padding: 10px; font-weight: bold; color: #1e293b;">${m.name}</td>
        <td style="padding: 10px;">${m.dosage}</td>
        <td style="padding: 10px;">${m.frequency} • ${m.foodRelation}</td>
        <td style="padding: 10px; color: ${isLow ? '#dc2626' : '#1e293b'}; font-weight: ${isLow ? 'bold' : 'normal'};">
          ${m.stockCount} Pills ${isLow ? '⚠️ (Low)' : ''}
        </td>
        <td style="padding: 10px; text-align: center;">
          <span style="display: inline-block; padding: 4px 10px; border-radius: 12px; font-weight: bold; font-size: 12px; background-color: ${isTaken ? '#dcfce7' : '#fef3c7'}; color: ${isTaken ? '#166534' : '#92400e'};">
            ${isTaken ? '✅ Taken' : '⏳ Pending / Missed'}
          </span>
        </td>
      </tr>
    `;
  }).join("");

  const glucoseRows = glucoseLogs.length === 0 ? `
    <tr>
      <td colspan="4" style="padding: 12px; text-align: center; color: #6b7280;">No blood glucose readings logged in this period.</td>
    </tr>
  ` : glucoseLogs.slice(0, 5).map(g => `
    <tr style="border-bottom: 1px solid #e5e7eb;">
      <td style="padding: 10px;">${new Date(g.timestamp).toLocaleString()}</td>
      <td style="padding: 10px; font-weight: bold; color: #2563eb;">${g.value} mg/dL</td>
      <td style="padding: 10px; text-transform: capitalize;">${g.mealType.replace('_', ' ')}</td>
      <td style="padding: 10px;">
        <span style="display: inline-block; padding: 4px 10px; border-radius: 12px; font-weight: bold; font-size: 12px; background-color: ${g.status.includes('High') || g.status.includes('Low') ? '#fee2e2' : '#dcfce7'}; color: ${g.status.includes('High') || g.status.includes('Low') ? '#991b1b' : '#166534'};">
          ${g.status}
        </span>
      </td>
    </tr>
  `).join("");

  const bpRows = bpLogs.length === 0 ? `
    <tr>
      <td colspan="4" style="padding: 12px; text-align: center; color: #6b7280;">No blood pressure readings logged in this period.</td>
    </tr>
  ` : bpLogs.slice(0, 5).map(b => `
    <tr style="border-bottom: 1px solid #e5e7eb;">
      <td style="padding: 10px;">${new Date(b.timestamp).toLocaleString()}</td>
      <td style="padding: 10px; font-weight: bold; color: #dc2626;">${b.systolic} / ${b.diastolic} mmHg</td>
      <td style="padding: 10px;">${b.pulse} bpm</td>
      <td style="padding: 10px;">
        <span style="display: inline-block; padding: 4px 10px; border-radius: 12px; font-weight: bold; font-size: 12px; background-color: ${b.category.includes('Crisis') || b.category.includes('Stage 2') ? '#fee2e2' : '#dcfce7'}; color: ${b.category.includes('Crisis') || b.category.includes('Stage 2') ? '#991b1b' : '#166534'};">
          ${b.category}
        </span>
      </td>
    </tr>
  `).join("");

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>VitalsGuard Health Report for ${profile.name}</title>
    </head>
    <body style="font-family: Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 20px;">
      
      <div style="max-width: 680px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.1); border: 1px solid #e2e8f0;">
        
        <div style="background: linear-gradient(135deg, #2563eb, #1d4ed8); color: #ffffff; padding: 24px; text-align: center;">
          <h1 style="margin: 0; font-size: 24px;">🛡️ VitalsGuard Health Report</h1>
          <p style="margin: 6px 0 0 0; opacity: 0.9; font-size: 14px;">
            ${reportType} Compliance & Vitals Summary for <strong>${profile.name}</strong> (${profile.role})
          </p>
          <p style="margin: 4px 0 0 0; font-size: 12px; opacity: 0.8;">Date: ${new Date().toLocaleDateString()}</p>
        </div>

        <div style="padding: 24px;">
          
          <table style="width: 100%; border-collapse: separate; border-spacing: 10px; margin-bottom: 20px;">
            <tr>
              <td style="background-color: #f1f5f9; padding: 12px; border-radius: 8px; text-align: center; width: 33%;">
                <span style="font-size: 12px; color: #64748b; display: block;">Adherence Rate</span>
                <strong style="font-size: 18px; color: ${adherencePercent >= 80 ? '#16a34a' : '#dc2626'};">${adherencePercent}%</strong>
              </td>
              <td style="background-color: #f1f5f9; padding: 12px; border-radius: 8px; text-align: center; width: 33%;">
                <span style="font-size: 12px; color: #64748b; display: block;">Emergency Contact</span>
                <strong style="font-size: 14px; color: #1e293b;">${profile.emergencyContact || 'N/A'}</strong>
              </td>
              <td style="background-color: #f1f5f9; padding: 12px; border-radius: 8px; text-align: center; width: 33%;">
                <span style="font-size: 12px; color: #64748b; display: block;">Doctor Contact</span>
                <strong style="font-size: 13px; color: #1e293b;">${profile.doctorName || 'N/A'}</strong>
              </td>
            </tr>
          </table>

          <h3 style="color: #1e293b; border-bottom: 2px solid #2563eb; padding-bottom: 6px; margin-top: 24px; margin-bottom: 12px;">
            💊 Medication Prescriptions & Stock Inventory
          </h3>
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px; font-size: 13px;">
            <thead>
              <tr style="background-color: #2563eb; color: #ffffff; text-align: left;">
                <th style="padding: 10px;">Medication Name</th>
                <th style="padding: 10px;">Dosage</th>
                <th style="padding: 10px;">Schedule</th>
                <th style="padding: 10px;">Stock Left</th>
                <th style="padding: 10px; text-align: center;">Adherence Status</th>
              </tr>
            </thead>
            <tbody>
              ${medTableRows}
            </tbody>
          </table>

          <h3 style="color: #1e293b; border-bottom: 2px solid #3b82f6; padding-bottom: 6px; margin-top: 24px; margin-bottom: 12px;">
            🩸 Diabetes & Blood Glucose Log Records
          </h3>
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px; font-size: 13px;">
            <thead>
              <tr style="background-color: #3b82f6; color: #ffffff; text-align: left;">
                <th style="padding: 10px;">Date & Time</th>
                <th style="padding: 10px;">Blood Glucose</th>
                <th style="padding: 10px;">Meal Routine</th>
                <th style="padding: 10px;">ADA Medical Status</th>
              </tr>
            </thead>
            <tbody>
              ${glucoseRows}
            </tbody>
          </table>

          <h3 style="color: #1e293b; border-bottom: 2px solid #ef4444; padding-bottom: 6px; margin-top: 24px; margin-bottom: 12px;">
            ❤️ Blood Pressure & Heart Pulse Records
          </h3>
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px; font-size: 13px;">
            <thead>
              <tr style="background-color: #ef4444; color: #ffffff; text-align: left;">
                <th style="padding: 10px;">Date & Time</th>
                <th style="padding: 10px;">SYS / DIA Reading</th>
                <th style="padding: 10px;">Pulse (BPM)</th>
                <th style="padding: 10px;">AHA Category</th>
              </tr>
            </thead>
            <tbody>
              ${bpRows}
            </tbody>
          </table>

          <div style="background-color: #f8fafc; padding: 16px; border-radius: 8px; text-align: center; color: #64748b; font-size: 12px; margin-top: 24px; border: 1px solid #e2e8f0;">
            <p style="margin: 0;">This email was generated automatically by VitalsGuard Health Tracker to assist caretakers in monitoring parents' health routines.</p>
          </div>

        </div>
      </div>
    </body>
    </html>
  `;
}

export function generateDailyCheckHTML(
  profile: UserProfile, 
  meds: Medication[], 
  logsToday: MedicationLog[], 
  glucoseToday: GlucoseLog[], 
  bpToday: BPLog[]
): string {
  return generateTabularReportHTML(profile, meds, logsToday, glucoseToday, bpToday, "Daily");
}

export function generateRefillAlertHTML(profile: UserProfile, lowStockMeds: Medication[]): string {
  const medRows = lowStockMeds.map(m => `
    <tr style="border-bottom: 1px solid #e5e7eb;">
      <td style="padding: 10px; font-weight: bold; color: #1e293b;">${m.name} (${m.dosage})</td>
      <td style="padding: 10px; color: #dc2626; font-weight: bold;">${m.stockCount} pills remaining</td>
      <td style="padding: 10px;">${m.instructions || "N/A"}</td>
    </tr>
  `).join("");

  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden;">
      <div style="background-color: #ef4444; color: white; padding: 16px; text-align: center;">
        <h2 style="margin:0;">⚠️ Urgent Medication Refill Warning</h2>
        <p style="margin:4px 0 0 0;">VitalsGuard Health Tracker Notification</p>
      </div>
      <div style="padding: 20px;">
        <p>Hello Caretaker,</p>
        <p>The following prescription(s) for <strong>${profile.name}</strong> are running low on inventory and require a refill soon:</p>
        
        <table style="width: 100%; border-collapse: collapse; margin-top: 15px; font-size: 13px;">
          <thead>
            <tr style="background-color: #f3f4f6; text-align: left;">
              <th style="padding: 10px;">Medication</th>
              <th style="padding: 10px;">Stock Left</th>
              <th style="padding: 10px;">Instructions</th>
            </tr>
          </thead>
          <tbody>
            ${medRows}
          </tbody>
        </table>

        <p style="margin-top: 25px; color: #6b7280; font-size: 13px;">
          Sent automatically by VitalsGuard Open Source Health Tracker for ${profile.name}.
        </p>
      </div>
    </div>
  `;
}

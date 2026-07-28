import { APP_CONFIG } from "../config/app.config";
import type { UserProfile, Medication, GlucoseLog, BPLog, MedicationLog } from "../types";

export interface EmailPayload {
  to: string;
  subject: string;
  htmlContent: string;
  type: "refill_alert" | "daily_check" | "weekly_report" | "monthly_report";
}

/**
 * Dispatches an email using Resend API or Webhooks
 */
export async function sendEmailNotification(payload: EmailPayload): Promise<{ success: boolean; message: string }> {
  const apiKey = import.meta.env.VITE_RESEND_API_KEY || "";
  
  // If Resend API Key is set, send live email request
  if (apiKey && apiKey !== "YOUR_RESEND_API_KEY") {
    try {
      const response = await fetch(APP_CONFIG.emailSettings.resendApiEndpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          from: "CarePulse Tracker <onboarding@resend.dev>",
          to: [payload.to],
          subject: payload.subject,
          html: payload.htmlContent,
        }),
      });

      if (response.ok) {
        return { success: true, message: `Email delivered successfully to ${payload.to}` };
      } else {
        const errorData = await response.json();
        console.warn("Resend API error:", errorData);
        return { success: false, message: `Email failed: ${errorData.message || response.statusText}` };
      }
    } catch (err: any) {
      console.error("Email service exception:", err);
      return { success: false, message: `Network error sending email: ${err.message}` };
    }
  }

  // Demo / Offline / Fallback mode
  console.log("=== [DEMO EMAIL DISPATCHED] ===");
  console.log(`To: ${payload.to}`);
  console.log(`Subject: ${payload.subject}`);
  console.log(`Type: ${payload.type}`);
  
  return { 
    success: true, 
    message: `[Simulated Free Email] Report sent to ${payload.to}. (Add VITE_RESEND_API_KEY in .env for live dispatch)` 
  };
}

/**
 * Generates an Email HTML template for Low Stock Medication Refill Warnings
 */
export function generateRefillAlertHTML(profile: UserProfile, lowStockMeds: Medication[]): string {
  const medRows = lowStockMeds.map(m => `
    <tr style="border-bottom: 1px solid #e5e7eb;">
      <td style="padding: 10px; font-weight: bold;">${m.name} (${m.dosage})</td>
      <td style="padding: 10px; color: #dc2626; font-weight: bold;">${m.stockCount} pills remaining</td>
      <td style="padding: 10px;">${m.instructions || "N/A"}</td>
    </tr>
  `).join("");

  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e5e7eb; borderRadius: 8px; overflow: hidden;">
      <div style="background-color: #ef4444; color: white; padding: 16px; text-align: center;">
        <h2 style="margin:0;">⚠️ Medication Refill Alert</h2>
        <p style="margin:4px 0 0 0;">CarePulse Health Tracker Notification</p>
      </div>
      <div style="padding: 20px;">
        <p>Hello Caretaker,</p>
        <p>The following medication(s) for <strong>${profile.name}</strong> are running low on stock and need to be refilled soon:</p>
        
        <table style="width: 100%; border-collapse: collapse; margin-top: 15px;">
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
          Sent automatically by CarePulse Open Source Health Tracker for ${profile.name}.
        </p>
      </div>
    </div>
  `;
}

/**
 * Generates End-of-Day Check Email HTML
 */
export function generateDailyCheckHTML(
  profile: UserProfile, 
  meds: Medication[], 
  logsToday: MedicationLog[], 
  glucoseToday: GlucoseLog[], 
  bpToday: BPLog[]
): string {
  const totalMeds = meds.length;
  const takenCount = logsToday.filter(l => l.status === "taken").length;
  const adherencePercent = totalMeds > 0 ? Math.round((takenCount / totalMeds) * 100) : 100;

  const latestGlucose = glucoseToday.length > 0 ? `${glucoseToday[0].value} mg/dL (${glucoseToday[0].mealType})` : "No reading logged today";
  const latestBP = bpToday.length > 0 ? `${bpToday[0].systolic}/${bpToday[0].diastolic} mmHg (Pulse: ${bpToday[0].pulse} bpm)` : "No reading logged today";

  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden;">
      <div style="background-color: #2563eb; color: white; padding: 16px; text-align: center;">
        <h2 style="margin:0;">📋 Daily Health & Adherence Summary</h2>
        <p style="margin:4px 0 0 0;">CarePulse End-of-Day Check for ${profile.name}</p>
      </div>
      <div style="padding: 20px;">
        <h3>Daily Overview - ${new Date().toLocaleDateString()}</h3>
        
        <div style="background-color: #f8fafc; padding: 15px; border-radius: 6px; margin-bottom: 20px;">
          <p style="margin: 5px 0;"><strong>Medication Adherence Rate:</strong> <span style="color: ${adherencePercent >= 80 ? '#16a34a' : '#dc2626'}; font-weight: bold;">${adherencePercent}%</span> (${takenCount} of ${totalMeds} doses recorded)</p>
          <p style="margin: 5px 0;"><strong>Latest Blood Glucose:</strong> ${latestGlucose}</p>
          <p style="margin: 5px 0;"><strong>Latest Blood Pressure:</strong> ${latestBP}</p>
        </div>

        <h4>Today's Medications:</h4>
        <ul>
          ${meds.map(m => {
            const isTaken = logsToday.some(l => l.medicationId === m.id && l.status === "taken");
            return `<li style="margin-bottom: 6px;">${m.name} (${m.dosage}) - ${isTaken ? '✅ Taken' : '❌ Pending/Missed'}</li>`;
          }).join('')}
        </ul>

        <p style="margin-top: 25px; color: #6b7280; font-size: 13px;">
          This email was generated automatically by CarePulse Health Tracker to help caretakers monitor parents' health daily.
        </p>
      </div>
    </div>
  `;
}

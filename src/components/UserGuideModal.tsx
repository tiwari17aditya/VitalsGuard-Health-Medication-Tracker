import React, { useState } from "react";
import { 
  BookOpen, Pill, Droplet, Heart, Calendar, FileText, Lock, 
  ChevronRight, X, Sparkles
} from "lucide-react";

interface UserGuideModalProps {
  onClose: () => void;
}

export const UserGuideModal: React.FC<UserGuideModalProps> = ({ onClose }) => {
  const [activeSection, setActiveSection] = useState<string>("getting-started");

  const sections = [
    { id: "getting-started", title: "🚀 Getting Started", icon: Sparkles },
    { id: "prescriptions", title: "💊 Prescriptions & Meds", icon: Pill },
    { id: "glucose", title: "🩸 Diabetes & Blood Sugar", icon: BookOpen },
    { id: "vitals", title: "❤️ Blood Pressure & Pulse", icon: Heart },
    { id: "calendar", title: "📅 Calendar & Day Timeline", icon: Calendar },
    { id: "water", title: "💧 Hydration Tracker", icon: Droplet },
    { id: "reports", title: "📊 Reports & Email Sharing", icon: FileText },
    { id: "privacy", title: "🔒 Privacy & PIN Security", icon: Lock },
  ];

  return (
    <div className="modal-overlay" onClick={onClose} style={{ zIndex: 1100 }}>
      <div 
        className="modal-content glass-card" 
        style={{ 
          maxWidth: "850px", 
          maxHeight: "85vh", 
          display: "flex", 
          flexDirection: "column", 
          padding: "0", 
          overflow: "hidden" 
        }} 
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ 
          padding: "20px 24px", 
          borderBottom: "1px solid var(--border-color)", 
          display: "flex", 
          justifyContent: "space-between", 
          alignItems: "center",
          background: "rgba(59, 130, 246, 0.05)"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div style={{ 
              background: "var(--primary)", 
              color: "white", 
              padding: "8px", 
              borderRadius: "var(--radius-sm)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center"
            }}>
              <BookOpen size={22} />
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: "1.25rem" }}>VitalsGuard User Guide & Documentation</h2>
              <p style={{ margin: "2px 0 0 0", fontSize: "0.85rem", color: "var(--text-secondary)" }}>
                Simple step-by-step instructions for managing your family's health & medications.
              </p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="btn btn-secondary btn-sm" 
            style={{ borderRadius: "50%", width: "32px", height: "32px", padding: 0, justifyContent: "center" }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body: Sidebar + Content Area */}
        <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
          {/* Navigation Sidebar */}
          <div style={{ 
            width: "240px", 
            borderRight: "1px solid var(--border-color)", 
            padding: "12px", 
            background: "var(--bg-primary)",
            overflowY: "auto"
          }}>
            {sections.map(sec => {
              const Icon = sec.icon;
              const isActive = activeSection === sec.id;
              return (
                <button
                  key={sec.id}
                  onClick={() => setActiveSection(sec.id)}
                  style={{
                    width: "100%",
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                    padding: "10px 12px",
                    borderRadius: "var(--radius-sm)",
                    border: "none",
                    background: isActive ? "rgba(59, 130, 246, 0.15)" : "transparent",
                    color: isActive ? "var(--primary)" : "var(--text-primary)",
                    fontWeight: isActive ? "600" : "400",
                    fontSize: "0.85rem",
                    cursor: "pointer",
                    marginBottom: "4px",
                    textAlign: "left",
                    transition: "all 0.15s ease"
                  }}
                >
                  <Icon size={16} />
                  <span style={{ flex: 1 }}>{sec.title}</span>
                  {isActive && <ChevronRight size={14} />}
                </button>
              );
            })}
          </div>

          {/* Content Pane */}
          <div style={{ flex: 1, padding: "24px", overflowY: "auto" }}>
            {activeSection === "getting-started" && (
              <div>
                <h3 style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
                  <Sparkles size={20} color="var(--primary)" /> Welcome to VitalsGuard
                </h3>
                <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem", lineHeight: "1.6" }}>
                  VitalsGuard is your personal and family health companion. It helps you keep track of daily medications, record blood sugar and blood pressure vitals, monitor water intake, and generate shareable doctor reports.
                </p>
                <div className="grid-2" style={{ gap: "12px", marginTop: "16px" }}>
                  <div style={{ background: "var(--bg-card)", padding: "14px", borderRadius: "var(--radius-sm)", border: "1px solid var(--border-color)" }}>
                    <h4 style={{ margin: "0 0 6px 0", fontSize: "0.95rem" }}>👥 Multi-User Profiles</h4>
                    <p style={{ margin: 0, fontSize: "0.825rem", color: "var(--text-secondary)" }}>
                      Manage records for Mother, Father, Self, or family members. Switch profiles anytime from the top header dropdown.
                    </p>
                  </div>
                  <div style={{ background: "var(--bg-card)", padding: "14px", borderRadius: "var(--radius-sm)", border: "1px solid var(--border-color)" }}>
                    <h4 style={{ margin: "0 0 6px 0", fontSize: "0.95rem" }}>🔒 Privacy Locks</h4>
                    <p style={{ margin: 0, fontSize: "0.825rem", color: "var(--text-secondary)" }}>
                      Lock sensitive profiles with custom 4-digit PINs to keep health metrics private.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {activeSection === "prescriptions" && (
              <div>
                <h3 style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
                  <Pill size={20} color="#3b82f6" /> Prescriptions & Medication Management
                </h3>
                <ul style={{ paddingLeft: "20px", fontSize: "0.9rem", color: "var(--text-secondary)", lineHeight: "1.7" }}>
                  <li><strong>Adding Prescriptions:</strong> Go to <code>Prescriptions</code> → click <code>+ Add Medication</code>. Enter medicine name, dosage (e.g. 500mg), frequency, and food relation (Before / After / With food).</li>
                  <li><strong>Refill Stock Tracking:</strong> Set your starting inventory pill count. When you log intake, stock automatically decrements and alerts you when running low.</li>
                  <li><strong>Logging Daily Intake:</strong> In <code>Log & Track</code>, click <code>Mark Taken</code> for scheduled doses to record your adherence.</li>
                </ul>
              </div>
            )}

            {activeSection === "glucose" && (
              <div>
                <h3 style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
                  <BookOpen size={20} color="#ef4444" /> Diabetes & Blood Sugar Logging
                </h3>
                <ul style={{ paddingLeft: "20px", fontSize: "0.9rem", color: "var(--text-secondary)", lineHeight: "1.7" }}>
                  <li><strong>Recording Blood Sugar:</strong> Open <code>Log & Track</code> → select the <code>Diabetes & Blood Sugar</code> tab.</li>
                  <li><strong>Routine Categories:</strong> Select routine type (Fasting, Post Breakfast, Post Lunch, Bedtime, Random) and enter reading in mg/dL.</li>
                  <li><strong>Logging for Custom Dates:</strong> Use the <code>Record Date</code> picker to log blood sugar for today or backdate past days.</li>
                </ul>
              </div>
            )}

            {activeSection === "vitals" && (
              <div>
                <h3 style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
                  <Heart size={20} color="#ec4899" /> Blood Pressure & Pulse Tracking
                </h3>
                <ul style={{ paddingLeft: "20px", fontSize: "0.9rem", color: "var(--text-secondary)", lineHeight: "1.7" }}>
                  <li><strong>Recording BP:</strong> Select the <code>Blood Pressure (BP)</code> tab under <code>Log & Track</code>.</li>
                  <li><strong>Entering Values:</strong> Enter Systolic (e.g. 120), Diastolic (e.g. 80), and Pulse rate (bpm).</li>
                  <li><strong>Status Indicators:</strong> Readings are automatically classified as Normal, Elevated, High Stage 1, or High Stage 2 with color indicators.</li>
                </ul>
              </div>
            )}

            {activeSection === "calendar" && (
              <div>
                <h3 style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
                  <Calendar size={20} color="#f59e0b" /> Medication & Vitals Calendar
                </h3>
                <ul style={{ paddingLeft: "20px", fontSize: "0.9rem", color: "var(--text-secondary)", lineHeight: "1.7" }}>
                  <li><strong>Date Ribbon:</strong> Click any date on the top calendar ribbon to view that day's complete timeline.</li>
                  <li><strong>Unified Timeline:</strong> The selected day shows medication intake status, blood sugar readings (<code>🩸</code>), and BP readings (<code>❤️</code>) recorded on that date.</li>
                  <li><strong>Jump to Date:</strong> Use the date selector to quickly jump to any past date.</li>
                </ul>
              </div>
            )}

            {activeSection === "water" && (
              <div>
                <h3 style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
                  <Droplet size={20} color="#06b6d4" /> Family Hydration Tracker
                </h3>
                <ul style={{ paddingLeft: "20px", fontSize: "0.9rem", color: "var(--text-secondary)", lineHeight: "1.7" }}>
                  <li><strong>Daily Target Goal:</strong> Set your target water intake (e.g., 2500 ml).</li>
                  <li><strong>Quick Add:</strong> Click quick glass presets (+250ml, +500ml) or enter custom glass volumes.</li>
                  <li><strong>Past Date Backdating:</strong> Log water intake for past dates using the date selector.</li>
                </ul>
              </div>
            )}

            {activeSection === "reports" && (
              <div>
                <h3 style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
                  <FileText size={20} color="#10b981" /> Health Reports & Email Sharing
                </h3>
                <ul style={{ paddingLeft: "20px", fontSize: "0.9rem", color: "var(--text-secondary)", lineHeight: "1.7" }}>
                  <li><strong>Report Scopes:</strong> Export health logs for <code>Daily (Today)</code>, <code>Custom Date Range</code>, or <code>All Time</code>.</li>
                  <li><strong>Searching Logs:</strong> Use the search box to find logs for specific dates (e.g. <code>2026-08-06</code>) or terms.</li>
                  <li><strong>Emailing Reports:</strong> Click <code>Send Email Report</code> to email formatted summaries and CSV attachments to your doctor or caretaker.</li>
                </ul>
              </div>
            )}

            {activeSection === "privacy" && (
              <div>
                <h3 style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
                  <Lock size={20} color="#8b5cf6" /> Privacy & PIN Security
                </h3>
                <ul style={{ paddingLeft: "20px", fontSize: "0.9rem", color: "var(--text-secondary)", lineHeight: "1.7" }}>
                  <li><strong>Locking Profiles:</strong> Click the <code>🔒 Lock</code> toggle in the top header or Admin Hub to protect your profile.</li>
                  <li><strong>Changing PINs:</strong> Click <code>🔑 Change PIN</code> to set your personal 4-digit PIN (Default: <code>1234</code>).</li>
                  <li><strong>PII Encryption:</strong> PINs are encrypted into secure ciphertext payloads (<code>PII_ENC:...</code>) and masked as <code>••••</code> in the UI.</li>
                </ul>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div style={{ 
          padding: "14px 24px", 
          borderTop: "1px solid var(--border-color)", 
          display: "flex", 
          justifyContent: "flex-end", 
          background: "var(--bg-primary)" 
        }}>
          <button onClick={onClose} className="btn btn-primary btn-sm">
            Got it, thanks!
          </button>
        </div>
      </div>
    </div>
  );
};

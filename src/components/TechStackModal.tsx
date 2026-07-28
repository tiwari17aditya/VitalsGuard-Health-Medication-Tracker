import React from "react";
import { Code, CheckCircle2 } from "lucide-react";

interface TechStackModalProps {
  onClose: () => void;
}

export const TechStackModal: React.FC<TechStackModalProps> = ({ onClose }) => {
  const techItems = [
    {
      category: "Frontend UI & PWA Architecture",
      tech: "React 18 + Vite + TypeScript",
      cost: "100% Free & Open Source",
      description: "Blazing fast SPA framework configured with PWA Web Manifest & Service Worker for instant offline installation on Android & iOS mobile phones."
    },
    {
      category: "Styling & Accessibility",
      tech: "Vanilla CSS Design System",
      cost: "100% Free & Lightweight",
      description: "Custom CSS custom properties, HSL color tokens, glassmorphism card styling, and high-contrast accessible tap targets for elderly parents."
    },
    {
      category: "Database & Authentication",
      tech: "Supabase PostgreSQL (Free Tier)",
      cost: "100% Lifetime Free Tier",
      description: "500MB PostgreSQL database, Row Level Security (RLS), auto-generated RESTful APIs, plus seamless LocalStorage offline fallback."
    },
    {
      category: "Email Reporting & Alerts",
      tech: "Resend API / EmailJS",
      cost: "100% Free Tier (3,000 emails/mo)",
      description: "Automated end-of-day check emails to caretakers, low stock pill refill warnings, and PDF/CSV health report dispatchers."
    },
    {
      category: "Automated CI/CD & Hosting",
      tech: "GitHub Actions + GitHub Pages / Vercel",
      cost: "100% Lifetime Free",
      description: "Automated build & deployment pipeline triggered on every git push, plus scheduled nightly cron job for automated caretaker report generation."
    }
  ];

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" style={{ maxWidth: "700px" }} onClick={e => e.stopPropagation()}>
        
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
          <h2 style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <Code color="var(--primary)" /> CarePulse Open Source Tech Stack
          </h2>
          <button onClick={onClose} className="btn btn-secondary btn-sm">✕</button>
        </div>

        <p style={{ color: "var(--text-secondary)", marginBottom: "16px" }}>
          All technologies, frameworks, databases, and hosting providers used in this project are strictly <strong>100% Open Source and Lifetime FREE</strong>.
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginBottom: "20px" }}>
          {techItems.map(item => (
            <div 
              key={item.tech}
              style={{
                background: "var(--bg-primary)",
                border: "1px solid var(--border-color)",
                borderRadius: "var(--radius-md)",
                padding: "14px 16px"
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
                <span style={{ fontSize: "0.8rem", fontWeight: "bold", color: "var(--primary)", textTransform: "uppercase" }}>
                  {item.category}
                </span>
                <span className="badge badge-success" style={{ fontSize: "0.75rem" }}>
                  {item.cost}
                </span>
              </div>
              <h4 style={{ fontSize: "1.05rem", margin: "2px 0 4px 0" }}>{item.tech}</h4>
              <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>
                {item.description}
              </p>
            </div>
          ))}
        </div>

        <div style={{ display: "flex", justifyContent: "flex-end" }}>
          <button onClick={onClose} className="btn btn-primary">
            <CheckCircle2 size={16} /> Got It!
          </button>
        </div>

      </div>
    </div>
  );
};

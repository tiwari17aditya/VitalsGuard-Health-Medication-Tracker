import React from "react";
import { Activity, Pill, Calendar, FileText, Droplet, Shield, Wrench } from "lucide-react";
import { useApp } from "../context/AppContext";

export type NavTab = "vitals" | "medications" | "water" | "calendar" | "reports" | "admin" | "developer";

interface NavigationProps {
  activeTab: NavTab;
  setActiveTab: (tab: NavTab) => void;
}

export const Navigation: React.FC<NavigationProps> = ({ activeTab, setActiveTab }) => {
  const { activeProfile } = useApp();
  const isAdmin = activeProfile?.id === "admin" && sessionStorage.getItem("vitalsguard_unlocked_admin") === "true";

  return (
    <>
      {/* Desktop & Tablet Top Navigation Tabs (Hidden on mobile via CSS) */}
      <div 
        className="glass-card desktop-nav" 
        style={{ 
          marginBottom: "20px", 
          padding: "8px", 
          gap: "8px",
          justifyContent: "space-around",
          borderRadius: "var(--radius-md)",
          flexWrap: "wrap"
        }}
      >
        <button
          onClick={() => setActiveTab("vitals")}
          className={`btn ${activeTab === "vitals" ? "btn-primary" : "btn-secondary"}`}
          style={{ flex: 1, minWidth: "140px" }}
        >
          <Activity size={18} /> Diabetes & BP Vitals
        </button>

        <button
          onClick={() => setActiveTab("medications")}
          className={`btn ${activeTab === "medications" ? "btn-primary" : "btn-secondary"}`}
          style={{ flex: 1, minWidth: "140px" }}
        >
          <Pill size={18} /> Medications & Stock Inventory
        </button>

        <button
          onClick={() => setActiveTab("water")}
          className={`btn ${activeTab === "water" ? "btn-primary" : "btn-secondary"}`}
          style={{ flex: 1, minWidth: "140px" }}
        >
          <Droplet size={18} color={activeTab === "water" ? "#ffffff" : "var(--primary)"} /> Water Tracker
        </button>

        <button
          onClick={() => setActiveTab("calendar")}
          className={`btn ${activeTab === "calendar" ? "btn-primary" : "btn-secondary"}`}
          style={{ flex: 1, minWidth: "140px" }}
        >
          <Calendar size={18} /> Schedule Calendar
        </button>

        <button
          onClick={() => setActiveTab("reports")}
          className={`btn ${activeTab === "reports" ? "btn-primary" : "btn-secondary"}`}
          style={{ flex: 1, minWidth: "140px" }}
        >
          <FileText size={18} /> Caretaker Email & Reports
        </button>

        {isAdmin && (
          <>
            <button
              onClick={() => setActiveTab("admin")}
              className={`btn ${activeTab === "admin" ? "btn-primary" : "btn-secondary"}`}
              style={{ flex: 1, minWidth: "140px" }}
            >
              <Shield size={18} /> Admin Panel
            </button>

            <button
              onClick={() => setActiveTab("developer")}
              className={`btn ${activeTab === "developer" ? "btn-primary" : "btn-secondary"}`}
              style={{ flex: 1, minWidth: "140px" }}
            >
              <Wrench size={18} /> Developer Settings
            </button>
          </>
        )}
      </div>

      {/* Mobile Fixed Bottom Navigation Bar (Hidden on desktop via CSS) */}
      <div className="bottom-nav">
        <button 
          onClick={() => setActiveTab("vitals")}
          className={`nav-item ${activeTab === "vitals" ? "active" : ""}`}
        >
          <Activity />
          <span>Vitals</span>
        </button>

        <button 
          onClick={() => setActiveTab("medications")}
          className={`nav-item ${activeTab === "medications" ? "active" : ""}`}
        >
          <Pill />
          <span>Meds</span>
        </button>

        <button 
          onClick={() => setActiveTab("water")}
          className={`nav-item ${activeTab === "water" ? "active" : ""}`}
        >
          <Droplet />
          <span>Water</span>
        </button>

        <button 
          onClick={() => setActiveTab("calendar")}
          className={`nav-item ${activeTab === "calendar" ? "active" : ""}`}
        >
          <Calendar />
          <span>Calendar</span>
        </button>

        <button 
          onClick={() => setActiveTab("reports")}
          className={`nav-item ${activeTab === "reports" ? "active" : ""}`}
        >
          <FileText />
          <span>Reports</span>
        </button>

        {isAdmin && (
          <>
            <button 
              onClick={() => setActiveTab("admin")}
              className={`nav-item ${activeTab === "admin" ? "active" : ""}`}
            >
              <Shield />
              <span>Admin</span>
            </button>

            <button 
              onClick={() => setActiveTab("developer")}
              className={`nav-item ${activeTab === "developer" ? "active" : ""}`}
            >
              <Wrench />
              <span>Developer</span>
            </button>
          </>
        )}
      </div>
    </>
  );
};

import React, { useState } from "react";
import { 
  Droplet, Plus, Trash2, Award, Settings, Users, Calendar, TrendingUp, Clock, Info, ChevronDown, ChevronUp 
} from "lucide-react";
import { useApp } from "../context/AppContext";
import { AdminAuthModal } from "./AdminAuthModal";
import type { UserProfile } from "../types";

/**
 * Single Visual Dynamic Water Glass Container
 * Renders a single glass SVG filled with liquid according to daily goal percentage.
 */
const DynamicWaterGlass: React.FC<{ percentage: number; size?: number }> = ({
  percentage,
  size = 48
}) => {
  const instanceId = React.useId().replace(/:/g, "_");
  const fillPct = Math.min(100, Math.max(0, percentage));
  // Y coordinates in 0-60 SVG space: 48 (empty) down to 8 (100% full)
  const waterY = 48 - (fillPct * 0.40);

  const gradId = `glassGrad_${instanceId}`;
  const clipId = `glassClip_${instanceId}`;

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", minWidth: `${size}px` }}>
      <svg width={size} height={size * 1.25} viewBox="0 0 50 62" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ filter: "drop-shadow(0 2px 6px rgba(59, 130, 246, 0.2))" }}>
        <defs>
          <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={fillPct >= 100 ? "#34d399" : "#60a5fa"} stopOpacity="0.95" />
            <stop offset="100%" stopColor={fillPct >= 100 ? "#059669" : "#2563eb"} stopOpacity="0.95" />
          </linearGradient>
          <clipPath id={clipId}>
            <path d="M10 8 L14 52 C14 54 16 56 18 56 L32 56 C34 56 36 54 36 52 L40 8 Z" />
          </clipPath>
        </defs>

        {/* Outer Glass Rim & Body Background */}
        <path d="M8 6 H42 V10 H8 Z" fill="rgba(255, 255, 255, 0.25)" stroke="#93c5fd" strokeWidth="1.5" strokeLinejoin="round" />
        <path d="M10 8 L14 52 C14 54 16 56 18 56 L32 56 C34 56 36 54 36 52 L40 8 Z" fill="rgba(255, 255, 255, 0.08)" stroke="#93c5fd" strokeWidth="1.5" strokeLinejoin="round" />

        {/* Liquid Water Fill Level */}
        <g clipPath={`url(#${clipId})`}>
          <rect x="0" y={waterY} width="50" height="60" fill={`url(#${gradId})`} style={{ transition: "y 0.5s ease" }} />
          {/* Animated liquid surface wave line */}
          {fillPct > 0 && fillPct < 100 && (
            <path
              className="mini-wave-path"
              d={`M -25 ${waterY} Q -12.5 ${waterY - 2} 0 ${waterY} T 25 ${waterY} T 50 ${waterY} T 75 ${waterY} V 60 H -25 Z`}
              fill="rgba(255, 255, 255, 0.35)"
            />
          )}
        </g>

        {/* Glass Highlight Reflection */}
        <path d="M14 12 L16 48" stroke="rgba(255, 255, 255, 0.3)" strokeWidth="1.5" strokeLinecap="round" />
      </svg>

      <span style={{ fontSize: "0.7rem", fontWeight: "bold", color: fillPct >= 100 ? "#10b981" : "#60a5fa", marginTop: "2px" }}>
        {fillPct}%
      </span>
    </div>
  );
};

export const WaterTracker: React.FC = () => {
  const { 
    activeProfile, 
    profiles, 
    waterItems,
    waterLogs, 
    waterTargets, 
    addWaterItem,
    deleteWaterItem,
    addWaterLog, 
    deleteWaterLog, 
    updateWaterTarget 
  } = useApp();

  const currentProfile = activeProfile || { id: "default", name: "Guest" } as UserProfile;
  const currentTarget = currentProfile.targetWater || waterTargets[currentProfile.id] || 2000;

  // Local Form state
  const [customAmount, setCustomAmount] = useState<number>(250);
  const [notes, setNotes] = useState<string>("");
  const [selectedLogDate, setSelectedLogDate] = useState<string>(() => new Date().toISOString().split("T")[0]);
  const [time, setTime] = useState<string>(() => {
    const now = new Date();
    return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  });

  // Settings & Container Management state
  const [showTargetEditor, setShowTargetEditor] = useState<boolean>(false);
  const [targetInput, setTargetInput] = useState<number>(currentTarget);
  const [showAddContainer, setShowAddContainer] = useState<boolean>(false);
  const [containerName, setContainerName] = useState<string>("");
  const [containerAmount, setContainerAmount] = useState<number>(300);

  // Past days expandable breakdown state
  const [expandedDates, setExpandedDates] = useState<Record<string, boolean>>({});

  // Admin auth state for delete
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

  if (!activeProfile) {
    return (
      <div className="glass-card" style={{ padding: "40px", textAlign: "center" }}>
        <Droplet size={48} color="var(--primary)" style={{ marginBottom: "16px" }} />
        <h2>Select a Profile</h2>
        <p style={{ color: "var(--text-secondary)", marginTop: "8px" }}>
          Please select or create a profile from the header to track water intake.
        </p>
      </div>
    );
  }

  // Active Profile Containers (Hierarchical Water Items)
  const profileWaterItems = waterItems.filter(i => i.profileId === currentProfile.id && i.active);

  // Calculate current date's metrics
  const todayStr = new Date().toISOString().split("T")[0];
  const todayLogs = waterLogs.filter(
    log => log.profileId === currentProfile.id && log.timestamp.startsWith(todayStr)
  );
  const todayTotal = todayLogs.reduce((sum, log) => sum + log.amount, 0);
  const percentCompleted = Math.round((todayTotal / currentTarget) * 100);
  const remaining = Math.max(0, currentTarget - todayTotal);

  // SVG wave calculation for current day glass
  const waterY = Math.max(5, 98 - (Math.min(percentCompleted, 100) * 0.93));

  const getCurrentHHMM = () => {
    const now = new Date();
    return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  };

  const handleQuickLog = async (amount: number, waterId?: string) => {
    await addWaterLog(amount, "Quick Log preset", getCurrentHHMM(), waterId, selectedLogDate);
  };

  const handleCustomSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (customAmount <= 0) return;
    await addWaterLog(customAmount, notes.trim() || undefined, time, undefined, selectedLogDate);
    setNotes("");
    const now = new Date();
    setTime(`${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`);
  };

  const handleCreateContainerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!containerName.trim() || containerAmount <= 0) return;
    await addWaterItem({
      profileId: currentProfile.id,
      name: containerName.trim(),
      amount: containerAmount,
      active: true
    });
    setContainerName("");
    setContainerAmount(300);
    setShowAddContainer(false);
  };

  const handleUpdateTargetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (targetInput < 500 || targetInput > 10000) return;
    await updateWaterTarget(currentProfile.id, targetInput);
    setShowTargetEditor(false);
  };

  const toggleExpandDate = (dateStr: string) => {
    setExpandedDates(prev => ({ ...prev, [dateStr]: !prev[dateStr] }));
  };

  // Profile-specific water logs
  const profileLogs = waterLogs.filter(log => log.profileId === currentProfile.id);

  // Group logs by date string
  const logsByDate: Record<string, number> = {};
  profileLogs.forEach(log => {
    const dateStr = log.timestamp.split("T")[0];
    logsByDate[dateStr] = (logsByDate[dateStr] || 0) + log.amount;
  });

  const datesWithLogs = Object.keys(logsByDate);
  const totalDays = datesWithLogs.length || 1;
  const totalProfileWaterAllTime = profileLogs.reduce((sum, log) => sum + log.amount, 0);
  const dailyAverage = Math.round(totalProfileWaterAllTime / totalDays);

  // Calculate streak (consecutive days target met)
  let streak = 0;
  let checkDate = new Date();
  while (true) {
    const checkDateStr = checkDate.toISOString().split("T")[0];
    const dayTotalAmount = logsByDate[checkDateStr] || 0;
    const targetForDay = currentProfile.targetWater || waterTargets[currentProfile.id] || 2000;
    if (dayTotalAmount >= targetForDay) {
      streak++;
      checkDate.setDate(checkDate.getDate() - 1);
    } else {
      const todayString = new Date().toISOString().split("T")[0];
      if (checkDateStr === todayString && streak === 0) {
        checkDate.setDate(checkDate.getDate() - 1);
        continue;
      }
      break;
    }
  }

  const sortedDates = [...datesWithLogs].sort((a, b) => b.localeCompare(a));

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      {/* Wave Animation Styles */}
      <style dangerouslySetInnerHTML={{__html: `
        .wave-path {
          animation: wave-move 3.5s linear infinite;
          transform-origin: bottom center;
        }
        @keyframes wave-move {
          0% { transform: translateX(0); }
          100% { transform: translateX(-100px); }
        }
        @keyframes mini-wave {
          0% { transform: translateX(0); }
          100% { transform: translateX(-25px); }
        }
        .mini-wave-path {
          animation: mini-wave 2.5s linear infinite;
        }
        .preset-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(110px, 1fr));
          gap: 10px;
          margin-top: 12px;
        }
        .preset-btn {
          background: var(--bg-primary);
          border: 1px solid var(--border-color);
          border-radius: var(--radius-md);
          padding: 12px 8px;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 6px;
          cursor: pointer;
          transition: all 0.2s ease;
          color: var(--text-primary);
          position: relative;
        }
        .preset-btn:hover {
          border-color: var(--primary);
          background: var(--primary-light);
          transform: translateY(-2px);
        }
        .stat-small-card {
          background: var(--bg-primary);
          border: 1px solid var(--border-color);
          border-radius: var(--radius-md);
          padding: 14px;
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .history-timeline-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 8px 12px;
          background: var(--bg-card);
          border: 1px solid var(--border-color);
          border-radius: var(--radius-sm);
        }
      `}} />

      {/* Main Hydration Dashboard */}
      <div className="grid-2">
        
        {/* LEFT CARD: Current Day Progress & Presets */}
        <div className="glass-card" style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "10px" }}>
            <div>
              <h2 style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <Droplet color="#3b82f6" /> Daily Hydration Tracker
              </h2>
              <p style={{ color: "var(--text-secondary)", fontSize: "0.85rem", marginTop: "4px" }}>
                Track and log water intake for <strong>{currentProfile.name}</strong>
              </p>
            </div>
            
            {/* Target Settings Button */}
            {!showTargetEditor ? (
              <button 
                onClick={() => { setTargetInput(currentTarget); setShowTargetEditor(true); }}
                className="btn btn-secondary btn-sm"
                style={{ minHeight: "36px", padding: "6px 12px" }}
              >
                <Settings size={14} /> Goal: {currentTarget} ml
              </button>
            ) : (
              <form onSubmit={handleUpdateTargetSubmit} style={{ display: "flex", gap: "6px", alignItems: "center" }}>
                <input 
                  type="number" 
                  min="500" 
                  max="10000" 
                  value={targetInput} 
                  onChange={(e) => setTargetInput(Number(e.target.value))}
                  className="form-input" 
                  style={{ width: "90px", padding: "6px 8px", fontSize: "0.85rem", minHeight: "36px" }}
                  required
                />
                <button type="submit" className="btn btn-primary btn-sm" style={{ minHeight: "36px", padding: "6px 12px" }}>Save</button>
                <button type="button" onClick={() => setShowTargetEditor(false)} className="btn btn-secondary btn-sm" style={{ minHeight: "36px", padding: "6px 12px" }}>✕</button>
              </form>
            )}
          </div>

          {/* Graphic Section with SVG glass */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "30px", flexWrap: "wrap", padding: "10px 0" }}>
            
            {/* Animated Wave SVG */}
            <div style={{ position: "relative" }}>
              <svg viewBox="0 0 100 100" width="130" height="190" style={{ filter: "drop-shadow(0 8px 16px rgba(59,130,246,0.15))" }}>
                <defs>
                  <linearGradient id="water-grad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#60a5fa" />
                    <stop offset="100%" stopColor="#1d4ed8" />
                  </linearGradient>
                  <clipPath id="glass-shape">
                    <path d="M15,2 C15,2 11,83 18,91 C25,98 75,98 82,91 C89,83 85,2 85,2 Z" />
                  </clipPath>
                </defs>

                <path 
                  d="M15,2 C15,2 11,83 18,91 C25,98 75,98 82,91 C89,83 85,2 85,2 Z" 
                  fill="rgba(30, 41, 59, 0.4)" 
                  stroke="var(--border-color)" 
                  strokeWidth="2.5" 
                />

                <g clipPath="url(#glass-shape)">
                  <rect 
                    x="0" 
                    y={waterY} 
                    width="100" 
                    height="100" 
                    fill="url(#water-grad)" 
                    style={{ transition: "y 0.6s cubic-bezier(0.4, 0, 0.2, 1)" }}
                  />
                  
                  {percentCompleted > 0 && percentCompleted < 100 && (
                    <path
                      className="wave-path"
                      d={`M -100 ${waterY} Q -75 ${waterY - 3} -50 ${waterY} T 0 ${waterY} T 50 ${waterY} T 100 ${waterY} T 150 ${waterY} T 200 ${waterY} L 200 100 L -100 100 Z`}
                      fill="rgba(255, 255, 255, 0.15)"
                      style={{ transition: "y 0.6s cubic-bezier(0.4, 0, 0.2, 1)" }}
                    />
                  )}
                </g>

                <path 
                  d="M19,8 C19,8 17,75 22,85" 
                  stroke="rgba(255, 255, 255, 0.18)" 
                  strokeWidth="2" 
                  strokeLinecap="round" 
                  fill="none" 
                />
              </svg>

              {percentCompleted >= 100 && (
                <div style={{ position: "absolute", bottom: "10px", right: "-10px", background: "var(--success)", color: "#ffffff", padding: "4px 8px", borderRadius: "8px", fontSize: "0.75rem", fontWeight: "bold", boxShadow: "0 4px 10px rgba(16,185,129,0.4)" }}>
                  Goal Met! 🎉
                </div>
              )}
            </div>

            {/* Quick Metrics display */}
            <div style={{ flex: 1, minWidth: "180px", display: "flex", flexDirection: "column", gap: "8px" }}>
              <div style={{ fontSize: "2.2rem", fontWeight: "800", color: "#3b82f6", lineHeight: "1" }}>
                {percentCompleted}%
              </div>
              <div style={{ fontSize: "1.1rem", fontWeight: "700" }}>
                {todayTotal} ml <span style={{ fontSize: "0.85rem", color: "var(--text-secondary)", fontWeight: "normal" }}>/ {currentTarget} ml</span>
              </div>
              <div style={{ height: "1px", background: "var(--border-color)", margin: "4px 0" }}></div>
              <div style={{ display: "flex", flexDirection: "column", gap: "3px", fontSize: "0.85rem" }}>
                <span style={{ color: "var(--text-secondary)" }}>
                  Status: {percentCompleted >= 100 ? "Fully Hydrated! ✨" : "Hydration in progress"}
                </span>
                {remaining > 0 ? (
                  <span>Need <strong>{remaining} ml</strong> more today</span>
                ) : (
                  <span style={{ color: "var(--success)", fontWeight: "bold" }}>Goal reached! Keep it up!</span>
                )}
              </div>
            </div>
          </div>

          {/* Quick Presets & User Containers Grid */}
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
              <h4 style={{ fontSize: "0.9rem", color: "var(--text-secondary)" }}>User Hydration Containers</h4>
              <button onClick={() => setShowAddContainer(!showAddContainer)} className="btn btn-secondary btn-sm" style={{ fontSize: "0.75rem", padding: "2px 8px" }}>
                {showAddContainer ? "✕ Cancel" : "+ Custom Container"}
              </button>
            </div>

            {/* Add Custom Container Accordion Form */}
            {showAddContainer && (
              <form onSubmit={handleCreateContainerSubmit} style={{ background: "var(--bg-primary)", padding: "12px", borderRadius: "var(--radius-md)", border: "1px solid var(--border-color)", marginBottom: "12px", display: "flex", flexDirection: "column", gap: "8px" }}>
                <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                  <input
                    type="text"
                    placeholder="Container Name (e.g. Hydro Flask)"
                    value={containerName}
                    onChange={(e) => setContainerName(e.target.value)}
                    className="form-input"
                    style={{ flex: "2 1 140px", fontSize: "0.85rem", padding: "6px 8px" }}
                    required
                  />
                  <input
                    type="number"
                    placeholder="Amount (ml)"
                    value={containerAmount}
                    onChange={(e) => setContainerAmount(Number(e.target.value))}
                    className="form-input"
                    style={{ flex: "1 1 90px", fontSize: "0.85rem", padding: "6px 8px" }}
                    min="50"
                    max="3000"
                    required
                  />
                </div>
                <button type="submit" className="btn btn-primary btn-sm" style={{ width: "100%" }}>
                  Save Container for {currentProfile.name}
                </button>
              </form>
            )}

            <div className="preset-grid">
              {/* Default Presets */}
              <button onClick={() => handleQuickLog(250)} className="preset-btn">
                <span style={{ fontSize: "1.3rem" }}>🥛</span>
                <span style={{ fontSize: "0.8rem", fontWeight: "bold" }}>Cup</span>
                <span style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>250 ml</span>
              </button>
              <button onClick={() => handleQuickLog(350)} className="preset-btn">
                <span style={{ fontSize: "1.3rem" }}>🥛</span>
                <span style={{ fontSize: "0.8rem", fontWeight: "bold" }}>Glass</span>
                <span style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>350 ml</span>
              </button>
              <button onClick={() => handleQuickLog(500)} className="preset-btn">
                <span style={{ fontSize: "1.3rem" }}>🧴</span>
                <span style={{ fontSize: "0.8rem", fontWeight: "bold" }}>Bottle</span>
                <span style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>500 ml</span>
              </button>
              <button onClick={() => handleQuickLog(750)} className="preset-btn">
                <span style={{ fontSize: "1.3rem" }}>🧪</span>
                <span style={{ fontSize: "0.8rem", fontWeight: "bold" }}>Flask</span>
                <span style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>750 ml</span>
              </button>

              {/* User Custom Containers */}
              {profileWaterItems.map(item => (
                <div key={item.id} style={{ position: "relative" }}>
                  <button onClick={() => handleQuickLog(item.amount, item.id)} className="preset-btn" style={{ width: "100%", borderColor: "var(--primary)" }}>
                    <span style={{ fontSize: "1.3rem" }}>💧</span>
                    <span style={{ fontSize: "0.8rem", fontWeight: "bold", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: "90px" }}>
                      {item.name}
                    </span>
                    <span style={{ fontSize: "0.75rem", color: "var(--primary)" }}>{item.amount} ml</span>
                  </button>
                  <button 
                    onClick={() => deleteWaterItem(item.id)}
                    style={{ position: "absolute", top: "-4px", right: "-4px", background: "#ef4444", color: "#fff", border: "none", borderRadius: "50%", width: "18px", height: "18px", fontSize: "10px", cursor: "pointer" }}
                    title="Remove container"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* RIGHT CARD: Manual Logging Form with Date/Time Backdating & Stats Panel */}
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          
          {/* Custom addition form with Date/Time Backdating */}
          <div className="glass-card" style={{ padding: "18px" }}>
            <h3 style={{ marginBottom: "14px", display: "flex", alignItems: "center", gap: "8px" }}>
              <Plus size={18} color="var(--primary)" /> Log Custom Intake (Date Backdating)
            </h3>

            <form onSubmit={handleCustomSubmit}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "10px", marginBottom: "12px" }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Water (ml)</label>
                  <input
                    type="number"
                    min="50"
                    max="3000"
                    step="25"
                    value={customAmount}
                    onChange={(e) => setCustomAmount(Number(e.target.value))}
                    className="form-input"
                    style={{ fontWeight: "bold" }}
                    required
                  />
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label" style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                    <Calendar size={13} /> Date
                  </label>
                  <input
                    type="date"
                    value={selectedLogDate}
                    onChange={(e) => setSelectedLogDate(e.target.value)}
                    className="form-input"
                    style={{ padding: "6px 4px", fontSize: "0.85rem" }}
                    required
                  />
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label" style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                    <Clock size={13} /> Time
                  </label>
                  <input
                    type="time"
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    className="form-input"
                    style={{ padding: "6px 4px", fontSize: "0.85rem" }}
                    required
                  />
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: "14px" }}>
                <label className="form-label">Notes (optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Post morning walk, during lunch"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="form-input"
                />
              </div>

              <button type="submit" className="btn btn-primary" style={{ width: "100%", minHeight: "44px" }}>
                Log {customAmount} ml of Water ({selectedLogDate})
              </button>
            </form>
          </div>

          {/* Stats Summary cards */}
          <div className="glass-card" style={{ padding: "18px" }}>
            <h3 style={{ marginBottom: "14px", display: "flex", alignItems: "center", gap: "8px" }}>
              <TrendingUp size={18} color="var(--primary)" /> Hydration Statistics
            </h3>

            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              <div className="stat-small-card">
                <div style={{ padding: "10px", borderRadius: "10px", background: "rgba(59, 130, 246, 0.15)", color: "#3b82f6" }}>
                  <TrendingUp size={20} />
                </div>
                <div>
                  <h4 style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>Your Daily Average</h4>
                  <p style={{ fontSize: "1.1rem", fontWeight: "bold" }}>
                    {dailyAverage} ml <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontWeight: "normal" }}>({datesWithLogs.length} tracked days)</span>
                  </p>
                </div>
              </div>

              <div className="stat-small-card">
                <div style={{ padding: "10px", borderRadius: "10px", background: "rgba(16, 185, 129, 0.15)", color: "#10b981" }}>
                  <Award size={20} />
                </div>
                <div>
                  <h4 style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>Goal Streak</h4>
                  <p style={{ fontSize: "1.1rem", fontWeight: "bold" }}>
                    {streak} {streak === 1 ? "Day" : "Days"} 🔥
                  </p>
                </div>
              </div>
            </div>
          </div>

        </div>

      </div>

      {/* FAMILY HYDRATION BOARD */}
      <div className="glass-card">
        <h3 style={{ marginBottom: "6px", display: "flex", alignItems: "center", gap: "8px" }}>
          <Users size={18} color="var(--primary)" /> Family Hydration Board
        </h3>
        
        <p style={{ color: "var(--text-secondary)", fontSize: "0.85rem", marginBottom: "16px" }}>
          Get updated collectively! Check today's progress and average intakes across all profiles.
        </p>

        <div className="grid-3" style={{ gap: "14px" }}>
          {profiles.map(prof => {
            const profTodayTotal = waterLogs
              .filter(log => log.profileId === prof.id && log.timestamp.startsWith(todayStr))
              .reduce((sum, log) => sum + log.amount, 0);

            const profTarget = prof.targetWater || waterTargets[prof.id] || 2000;
            const profPercent = Math.min(100, Math.round((profTodayTotal / profTarget) * 100));

            const pLogs = waterLogs.filter(log => log.profileId === prof.id);
            const pLogsByDate: Record<string, number> = {};
            pLogs.forEach(log => {
              const dateStr = log.timestamp.split("T")[0];
              pLogsByDate[dateStr] = (pLogsByDate[dateStr] || 0) + log.amount;
            });
            const pDates = Object.keys(pLogsByDate);
            const pTotalWater = pLogs.reduce((sum, log) => sum + log.amount, 0);
            const pAverage = pDates.length ? Math.round(pTotalWater / pDates.length) : 0;

            const isSelf = prof.id === currentProfile.id;
            const profUnlocked = sessionStorage.getItem(`vitalsguard_unlocked_${prof.id}`) === "true";
            const isUnlocked = !prof.isLocked || (isSelf && profUnlocked);

            return (
              <div 
                key={prof.id} 
                style={{ 
                  background: isSelf ? "rgba(59, 130, 246, 0.08)" : "var(--bg-primary)", 
                  padding: "16px", 
                  borderRadius: "var(--radius-md)", 
                  border: isSelf ? "1.5px solid var(--primary)" : "1px solid var(--border-color)",
                  position: "relative"
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                  <strong style={{ fontSize: "1rem", color: "var(--text-primary)", display: "flex", alignItems: "center", gap: "6px" }}>
                    {prof.name} {isSelf && <span style={{ fontSize: "0.75rem", color: "var(--primary)" }}>(Active)</span>}
                    {prof.isLocked && <span style={{ fontSize: "0.75rem", color: "#f59e0b" }}>🔒</span>}
                  </strong>
                  <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>{prof.role}</span>
                </div>

                {isUnlocked ? (
                  <>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.85rem", margin: "6px 0" }}>
                      <span>Today: <strong>{profTodayTotal} ml</strong></span>
                      <span style={{ color: "var(--text-secondary)" }}>Goal: {profTarget} ml</span>
                    </div>

                    <div style={{ fontSize: "0.8rem", color: "var(--text-secondary)", marginBottom: "6px" }}>
                      Daily Avg: <strong>{pAverage} ml</strong> ({pDates.length} days)
                    </div>

                    <div className="family-progress-bar-container">
                      <div 
                        className="family-progress-bar-fill" 
                        style={{ 
                          width: `${profPercent}%`,
                          background: profPercent >= 100 
                            ? "linear-gradient(90deg, #10b981, #34d399)" 
                            : "linear-gradient(90deg, #3b82f6, #60a5fa)" 
                        }}
                      ></div>
                    </div>
                    <div style={{ fontSize: "0.75rem", textAlign: "right", marginTop: "4px", color: profPercent >= 100 ? "var(--success)" : "var(--primary)" }}>
                      {profPercent}% Completed
                    </div>
                  </>
                ) : (
                  <div style={{ padding: "12px 0", textAlign: "center", color: "var(--text-secondary)", fontSize: "0.85rem" }}>
                    🔒 <strong>Health Data Private & Locked</strong>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* BOTTOM GRID: TIMELINE WATER LOG HISTORY WITH DYNAMIC FILLED GLASS CONTAINERS FOR PAST DAYS */}
      <div className="glass-card">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", flexWrap: "wrap", gap: "8px" }}>
          <div>
            <h3 style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <Calendar size={18} color="var(--primary)" /> Water Intake History & Log
            </h3>
            <p style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>
              Past days rendered as <strong>Single Dynamic Filled Water Glass Containers</strong> representing exact total intake %.
            </p>
          </div>

          <span className="badge badge-primary" style={{ fontSize: "0.8rem" }}>
            {sortedDates.length} Days Recorded
          </span>
        </div>

        {sortedDates.length === 0 ? (
          <div style={{ textAlign: "center", padding: "30px 10px", color: "var(--text-secondary)" }}>
            <Info size={24} style={{ marginBottom: "8px", verticalAlign: "middle" }} /> No logs found for this profile yet. Start drinking and log above!
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "12px", maxHeight: "450px", overflowY: "auto", paddingRight: "4px" }}>
            {sortedDates.map(dateStr => {
              const logsForDate = profileLogs.filter(log => log.timestamp.split("T")[0] === dateStr);
              const dateTotal = logsForDate.reduce((sum, l) => sum + l.amount, 0);
              const isToday = dateStr === todayStr;
              
              const dateObj = new Date(dateStr + "T00:00:00");
              const formattedDate = dateObj.toLocaleDateString([], { 
                weekday: 'short', 
                month: 'short', 
                day: 'numeric',
                year: 'numeric'
              });

              const fillPct = Math.min(100, Math.round((dateTotal / currentTarget) * 100));
              const isExpanded = Boolean(expandedDates[dateStr]);

              // TODAY'S VIEW: Real-time detailed intake list
              if (isToday) {
                return (
                  <div key={dateStr} style={{ background: "rgba(59, 130, 246, 0.05)", border: "1.5px solid var(--primary)", borderRadius: "var(--radius-md)", padding: "14px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px", flexWrap: "wrap", gap: "8px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <strong style={{ fontSize: "0.95rem", color: "var(--primary)" }}>{formattedDate} (Today)</strong>
                        <span className="badge badge-success" style={{ fontSize: "0.75rem" }}>
                          Today's Log
                        </span>
                      </div>
                      <span style={{ fontSize: "0.9rem", color: "var(--primary)", fontWeight: "bold" }}>
                        Total: {dateTotal} / {currentTarget} ml ({fillPct}%)
                      </span>
                    </div>

                    <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                      {logsForDate.map(log => {
                        const logTime = new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                        return (
                          <div key={log.id} className="history-timeline-item">
                            <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
                              <span style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "0.8rem", color: "var(--text-secondary)" }}>
                                <Clock size={12} /> {logTime}
                              </span>
                              <span style={{ fontWeight: "bold", fontSize: "0.95rem", color: "var(--text-primary)" }}>
                                💧 {log.amount} ml
                              </span>
                              {log.notes && (
                                <span style={{ fontSize: "0.8rem", color: "var(--text-muted)", fontStyle: "italic" }}>
                                  ({log.notes})
                                </span>
                              )}
                            </div>

                            <button 
                              onClick={() => setPendingDeleteId(log.id)}
                              className="btn btn-secondary btn-sm"
                              style={{ padding: "4px 8px", minHeight: "28px", border: "none", background: "none", color: "var(--text-muted)" }}
                              title="Delete record"
                            >
                              <Trash2 size={14} className="hover-danger" style={{ transition: "color 0.2s" }} />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              }

              // PAST DAYS VIEW: SINGLE DYNAMIC FILLED WATER GLASS CONTAINER CARD
              return (
                <div 
                  key={dateStr} 
                  style={{ 
                    background: "var(--bg-primary)", 
                    border: "1px solid var(--border-color)", 
                    borderRadius: "var(--radius-md)", 
                    padding: "12px 16px",
                    transition: "all 0.2s ease"
                  }}
                >
                  <div 
                    onClick={() => toggleExpandDate(dateStr)} 
                    style={{ display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer", flexWrap: "wrap", gap: "10px" }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                      {/* SINGLE DYNAMIC FILLED GLASS CONTAINER */}
                      <DynamicWaterGlass percentage={fillPct} />
                      
                      <div>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          <strong style={{ fontSize: "0.95rem" }}>{formattedDate}</strong>
                          <span className={`badge ${fillPct >= 100 ? "badge-success" : "badge-primary"}`} style={{ fontSize: "0.75rem" }}>
                            {fillPct}% Target Met
                          </span>
                        </div>
                        <p style={{ fontSize: "0.825rem", color: "var(--text-secondary)", marginTop: "4px" }}>
                          💧 Total Consumed: <strong>{dateTotal} ml</strong> of {currentTarget} ml goal ({logsForDate.length} log entry{logsForDate.length > 1 ? 's' : ''})
                        </p>
                      </div>
                    </div>

                    <button 
                      className="btn btn-secondary btn-sm" 
                      style={{ padding: "4px 10px", fontSize: "0.8rem", display: "flex", alignItems: "center", gap: "4px" }}
                    >
                      {isExpanded ? <><ChevronUp size={14} /> Collapse Logs</> : <><ChevronDown size={14} /> View Log Details ({logsForDate.length})</>}
                    </button>
                  </div>

                  {/* EXPANDABLE INDIVIDUAL LOG BREAKDOWN FOR PAST DAY */}
                  {isExpanded && (
                    <div style={{ marginTop: "12px", paddingTop: "12px", borderTop: "1px dashed var(--border-color)", display: "flex", flexDirection: "column", gap: "6px" }}>
                      {logsForDate.map(log => {
                        const logTime = new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                        return (
                          <div key={log.id} className="history-timeline-item">
                            <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
                              <span style={{ fontSize: "0.8rem", color: "var(--text-secondary)", display: "flex", alignItems: "center", gap: "4px" }}>
                                <Clock size={12} /> {logTime}
                              </span>
                              <span style={{ fontWeight: "bold", fontSize: "0.9rem" }}>💧 {log.amount} ml</span>
                              {log.notes && <span style={{ fontSize: "0.8rem", color: "var(--text-muted)", fontStyle: "italic" }}>({log.notes})</span>}
                            </div>
                            <button 
                              onClick={(e) => { e.stopPropagation(); setPendingDeleteId(log.id); }}
                              className="btn btn-secondary btn-sm"
                              style={{ padding: "2px 6px", border: "none", background: "none", color: "var(--text-muted)" }}
                              title="Delete record"
                            >
                              <Trash2 size={14} className="hover-danger" />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Admin Auth Modal — shown when a delete is requested */}
      {pendingDeleteId && (
        <AdminAuthModal
          title="Confirm Water Record Deletion"
          subtitle="Enter User Password or Admin Password to delete this water intake record."
          authMode="delete_log"
          expectedPin={activeProfile?.pin}
          onSuccess={() => {
            deleteWaterLog(pendingDeleteId);
            setPendingDeleteId(null);
          }}
          onClose={() => setPendingDeleteId(null)}
        />
      )}

    </div>
  );
};

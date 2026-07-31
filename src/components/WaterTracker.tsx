import React, { useState } from "react";
import { Droplet, Plus, Trash2, Award, Settings, Users, Calendar, TrendingUp, Clock, Info } from "lucide-react";
import { useApp } from "../context/AppContext";
import { AdminAuthModal } from "./AdminAuthModal";
import type { UserProfile } from "../types";


export const WaterTracker: React.FC = () => {
  const { 
    activeProfile, 
    profiles, 
    waterLogs, 
    waterTargets, 
    addWaterLog, 
    deleteWaterLog, 
    updateWaterTarget 
  } = useApp();

  // Selected profile settings
  const currentProfile = activeProfile || { id: "default", name: "Guest" } as UserProfile;
  const currentTarget = currentProfile.targetWater || waterTargets[currentProfile.id] || 2000;

  // Local Form state
  const [customAmount, setCustomAmount] = useState<number>(250);
  const [notes, setNotes] = useState<string>("");
  const [time, setTime] = useState<string>(() => {
    const now = new Date();
    return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  });

  // Settings State
  const [showTargetEditor, setShowTargetEditor] = useState<boolean>(false);
  const [targetInput, setTargetInput] = useState<number>(currentTarget);

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

  // Calculate current date's metrics
  const todayStr = new Date().toISOString().split("T")[0];
  const todayLogs = waterLogs.filter(
    log => log.profileId === currentProfile.id && log.timestamp.startsWith(todayStr)
  );
  const todayTotal = todayLogs.reduce((sum, log) => sum + log.amount, 0);
  const percentCompleted = Math.round((todayTotal / currentTarget) * 100);
  const remaining = Math.max(0, currentTarget - todayTotal);

  // SVG wave calculation
  // y ranges from 98 (empty) down to 5 (completely full)
  const waterY = Math.max(5, 98 - (Math.min(percentCompleted, 100) * 0.93));

  // Helper to get current HH:MM string at the moment of clicking
  const getCurrentHHMM = () => {
    const now = new Date();
    return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  };

  // Quick Preset Actions — capture the exact clock time when the button is pressed
  const handleQuickLog = async (amount: number) => {
    await addWaterLog(amount, "Quick Log preset", getCurrentHHMM());
  };

  const handleCustomSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (customAmount <= 0) return;
    await addWaterLog(customAmount, notes.trim() || undefined, time);
    setNotes("");
    // reset time to current time
    const now = new Date();
    setTime(`${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`);
  };

  const handleUpdateTargetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (targetInput < 500 || targetInput > 10000) return;
    await updateWaterTarget(currentProfile.id, targetInput);
    setShowTargetEditor(false);
  };

  // Advanced hydration calculations
  // Get active profile water logs
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
      // If it's today and they haven't met the target yet, allow checking yesterday to continue the streak
      const todayString = new Date().toISOString().split("T")[0];
      if (checkDateStr === todayString && streak === 0) {
        checkDate.setDate(checkDate.getDate() - 1);
        continue;
      }
      break;
    }
  }

  // Group history logs for displaying list
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
        .preset-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 10px;
          margin-top: 12px;
        }
        @media (max-width: 580px) {
          .preset-grid {
            grid-template-columns: repeat(2, 1fr);
          }
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
          padding: 10px 12px;
          background: var(--bg-primary);
          border: 1px solid var(--border-color);
          border-radius: var(--radius-sm);
          margin-bottom: 6px;
        }
        .family-progress-bar-container {
          background: var(--bg-primary);
          border-radius: var(--radius-full);
          height: 10px;
          width: 100%;
          overflow: hidden;
          margin-top: 8px;
          border: 1px solid var(--border-color);
        }
        .family-progress-bar-fill {
          height: 100%;
          border-radius: var(--radius-full);
          transition: width 0.4s ease-out;
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

                {/* Glass shadow/outline background */}
                <path 
                  d="M15,2 C15,2 11,83 18,91 C25,98 75,98 82,91 C89,83 85,2 85,2 Z" 
                  fill="rgba(30, 41, 59, 0.4)" 
                  stroke="var(--border-color)" 
                  strokeWidth="2.5" 
                />

                {/* Water Body & Wave Animations inside Glass Path */}
                <g clipPath="url(#glass-shape)">
                  {/* Wave Layer 1 */}
                  <rect 
                    x="0" 
                    y={waterY} 
                    width="100" 
                    height="100" 
                    fill="url(#water-grad)" 
                    style={{ transition: "y 0.6s cubic-bezier(0.4, 0, 0.2, 1)" }}
                  />
                  
                  {/* Wave Layer 2 */}
                  {percentCompleted > 0 && percentCompleted < 100 && (
                    <path
                      className="wave-path"
                      d={`M -100 ${waterY} Q -75 ${waterY - 3} -50 ${waterY} T 0 ${waterY} T 50 ${waterY} T 100 ${waterY} T 150 ${waterY} T 200 ${waterY} L 200 100 L -100 100 Z`}
                      fill="rgba(255, 255, 255, 0.15)"
                      style={{ transition: "y 0.6s cubic-bezier(0.4, 0, 0.2, 1)" }}
                    />
                  )}
                </g>

                {/* Glass Reflection Accent */}
                <path 
                  d="M19,8 C19,8 17,75 22,85" 
                  stroke="rgba(255, 255, 255, 0.18)" 
                  strokeWidth="2" 
                  strokeLinecap="round" 
                  fill="none" 
                />
              </svg>

              {/* Float badge for 100% completion */}
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

          {/* Quick Presets Grid */}
          <div>
            <h4 style={{ fontSize: "0.9rem", color: "var(--text-secondary)", marginBottom: "4px" }}>Quick Log Presets</h4>
            <div className="preset-grid">
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
            </div>
          </div>

        </div>

        {/* RIGHT CARD: Manual Logging Form & Stats Panel */}
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          
          {/* Custom addition form */}
          <div className="glass-card" style={{ padding: "18px" }}>
            <h3 style={{ marginBottom: "14px", display: "flex", alignItems: "center", gap: "8px" }}>
              <Plus size={18} color="var(--primary)" /> Log Custom Intake
            </h3>

            <form onSubmit={handleCustomSubmit}>
              <div className="grid-2" style={{ marginBottom: "12px" }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Water Amount (ml)</label>
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
                    <Clock size={14} /> Time
                  </label>
                  <input
                    type="time"
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    className="form-input"
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
                Log {customAmount} ml of Water
              </button>
            </form>
          </div>

          {/* Stats Summary cards */}
          <div className="glass-card" style={{ padding: "18px" }}>
            <h3 style={{ marginBottom: "14px", display: "flex", alignItems: "center", gap: "8px" }}>
              <TrendingUp size={18} color="var(--primary)" /> Hydration Statistics
            </h3>

            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              
              {/* Daily Average card */}
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

              {/* Streak card */}
              <div className="stat-small-card">
                <div style={{ padding: "10px", borderRadius: "10px", background: "rgba(16, 185, 129, 0.15)", color: "#10b981" }}>
                  <Award size={20} />
                </div>
                <div>
                  <h4 style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>Goal Streak</h4>
                  <p style={{ fontSize: "1.1rem", fontWeight: "bold" }}>
                    {streak} {streak === 1 ? "Day" : "Days"} Met
                  </p>
                </div>
              </div>

              {/* Total Water Logged */}
              <div className="stat-small-card">
                <div style={{ padding: "10px", borderRadius: "10px", background: "rgba(139, 92, 246, 0.15)", color: "#8b5cf6" }}>
                  <Droplet size={20} />
                </div>
                <div>
                  <h4 style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>Total Water Drunk</h4>
                  <p style={{ fontSize: "1.1rem", fontWeight: "bold" }}>
                    {(totalProfileWaterAllTime / 1000).toFixed(2)} Liters
                  </p>
                </div>
              </div>

            </div>
          </div>

        </div>

      </div>

      {/* SECTION: COLLECTIVE FAMILY HYDRATION BOARD */}
      <div className="glass-card">
        <h3 style={{ marginBottom: "14px", display: "flex", alignItems: "center", gap: "8px" }}>
          <Users size={18} color="var(--primary)" /> Family Hydration Board
        </h3>
        
        <p style={{ color: "var(--text-secondary)", fontSize: "0.85rem", marginBottom: "16px" }}>
          Get updated collectively! Check today's progress and average intakes across all profiles.
        </p>

        <div className="grid-3" style={{ gap: "14px" }}>
          {profiles.map(prof => {
            // Get today's consumption for this specific profile
            const profTodayTotal = waterLogs
              .filter(log => log.profileId === prof.id && log.timestamp.startsWith(todayStr))
              .reduce((sum, log) => sum + log.amount, 0);

            const profTarget = prof.targetWater || waterTargets[prof.id] || 2000;
            const profPercent = Math.min(100, Math.round((profTodayTotal / profTarget) * 100));

            // Calculate average for this specific profile
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
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <div style={{ width: "10px", height: "10px", borderRadius: "50%", background: prof.avatarColor || "#3b82f6" }}></div>
                    <strong style={{ fontSize: "0.95rem" }}>{prof.name}</strong>
                  </div>
                  <span style={{ fontSize: "0.75rem", background: "var(--bg-card-hover)", padding: "2px 6px", borderRadius: "4px", color: "var(--text-secondary)" }}>
                    {prof.role}
                  </span>
                </div>

                <div style={{ marginTop: "12px", fontSize: "0.85rem" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                    <span style={{ color: "var(--text-secondary)" }}>Today:</span>
                    <strong>{profTodayTotal} / {profTarget} ml</strong>
                  </div>
                  
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ color: "var(--text-secondary)" }}>Daily Avg:</span>
                    <strong>{pAverage} ml</strong>
                  </div>
                </div>

                {/* Progress Bar */}
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
              </div>
            );
          })}
        </div>
      </div>

      {/* BOTTOM GRID: TIMELINE WATER LOG HISTORY */}
      <div className="glass-card">
        <h3 style={{ marginBottom: "16px", display: "flex", alignItems: "center", gap: "8px" }}>
          <Calendar size={18} color="var(--primary)" /> Water Intake History & Log
        </h3>

        {sortedDates.length === 0 ? (
          <div style={{ textAlign: "center", padding: "30px 10px", color: "var(--text-secondary)" }}>
            <Info size={24} style={{ marginBottom: "8px", verticalAlign: "middle" }} /> No logs found for this profile yet. Start drinking and log above!
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "16px", maxHeight: "400px", overflowY: "auto", paddingRight: "4px" }}>
            {sortedDates.map(dateStr => {
              const logsForDate = profileLogs.filter(log => log.timestamp.split("T")[0] === dateStr);
              const dateTotal = logsForDate.reduce((sum, l) => sum + l.amount, 0);
              
              // Format date header nicely
              const dateObj = new Date(dateStr + "T00:00:00");
              const formattedDate = dateObj.toLocaleDateString([], { 
                weekday: 'short', 
                month: 'short', 
                day: 'numeric',
                year: 'numeric'
              });

              return (
                <div key={dateStr} style={{ borderBottom: "1px solid var(--border-color)", paddingBottom: "12px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px", background: "var(--bg-card-hover)", padding: "6px 12px", borderRadius: "6px" }}>
                    <strong style={{ fontSize: "0.9rem", color: "var(--text-primary)" }}>{formattedDate}</strong>
                    <span style={{ fontSize: "0.85rem", color: "#60a5fa", fontWeight: "bold" }}>Total: {dateTotal} ml</span>
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                    {logsForDate.map(log => {
                      const logTime = new Date(log.timestamp).toLocaleTimeString([], { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      });

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
                            style={{ 
                              padding: "4px 8px", 
                              minHeight: "28px", 
                              border: "none", 
                              background: "none",
                              color: "var(--text-muted)"
                            }}
                            title="Delete record (requires admin passcode)"
                          >
                            <Trash2 size={14} className="hover-danger" style={{ transition: "color 0.2s" }} />
                          </button>
                        </div>
                      );
                    })}
                  </div>
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


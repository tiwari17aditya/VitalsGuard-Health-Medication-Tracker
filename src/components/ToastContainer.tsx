import React from "react";
import { CheckCircle, AlertTriangle, AlertCircle, Info, X } from "lucide-react";
import { useApp } from "../context/AppContext";

export const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useApp();

  if (toasts.length === 0) return null;

  return (
    <div className="toast-container">
      {toasts.map(toast => {
        let Icon = Info;
        let borderColor = "var(--primary)";

        if (toast.type === "success") {
          Icon = CheckCircle;
          borderColor = "var(--success)";
        } else if (toast.type === "warning") {
          Icon = AlertTriangle;
          borderColor = "var(--warning)";
        } else if (toast.type === "error") {
          Icon = AlertCircle;
          borderColor = "var(--danger)";
        }

        return (
          <div key={toast.id} className="toast" style={{ borderLeft: `4px solid ${borderColor}` }}>
            <Icon size={20} color={borderColor} style={{ flexShrink: 0, marginTop: "2px" }} />
            <div style={{ flex: 1 }}>
              <h4 style={{ fontSize: "0.9rem", fontWeight: "bold" }}>{toast.title}</h4>
              <p style={{ fontSize: "0.825rem", color: "var(--text-secondary)" }}>{toast.message}</p>
            </div>
            <button
              onClick={() => removeToast(toast.id)}
              style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer" }}
            >
              <X size={16} />
            </button>
          </div>
        );
      })}
    </div>
  );
};

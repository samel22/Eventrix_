import { Check, CircleAlert, X } from "lucide-react";

// Render one accessible notification with a manual dismiss button.
export default function Toast({ toast, onDismiss }) {
  return (
    <div className={`toast toast-${toast.type}`} role="status">
      {toast.type === "error" ? <CircleAlert size={18} /> : <Check size={18} />}
      <span>{toast.message}</span>
      <button type="button" className="icon-button" onClick={() => onDismiss(toast.id)} aria-label="Dismiss">
        <X size={15} />
      </button>
    </div>
  );
}

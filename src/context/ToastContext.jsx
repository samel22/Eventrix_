import { createContext, useCallback, useContext, useMemo, useState } from "react";
import Toast from "../components/Toast.jsx";

const ToastContext = createContext(null);

// Show short-lived success or error messages above the current page.
export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const removeToast = useCallback((id) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const notify = useCallback((message, type = "success") => {
    const id = `${Date.now()}-${Math.random()}`;
    setToasts((current) => [...current, { id, message, type }]);
    window.setTimeout(() => removeToast(id), 3600);
  }, [removeToast]);

  const value = useMemo(() => ({ notify }), [notify]);
  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="toast-stack" aria-live="polite">
        {toasts.map((toast) => <Toast key={toast.id} toast={toast} onDismiss={removeToast} />)}
      </div>
    </ToastContext.Provider>
  );
}

// Give pages a consistent way to display a toast message.
export function useToast() {
  const context = useContext(ToastContext);
  if (!context) throw new Error("useToast must be used inside ToastProvider.");
  return context;
}

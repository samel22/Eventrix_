import { createContext, useContext, useEffect, useMemo, useState } from "react";
import api from "../services/api.js";

const AuthContext = createContext(null);

// Share the signed-in user and account actions across the app.
export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("eventrix-user")) || null;
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState(Boolean(localStorage.getItem("eventrix-token")));

  useEffect(() => {
    const token = localStorage.getItem("eventrix-token");
    if (!token) {
      setLoading(false);
      return;
    }

    api.get("/auth/me")
      .then(({ data }) => {
        const account = data.data;
        const nextUser = { id: account._id, name: account.name, email: account.email, role: account.role };
        setUser(nextUser);
        localStorage.setItem("eventrix-user", JSON.stringify(nextUser));
      })
      .catch(() => {
        localStorage.removeItem("eventrix-token");
        localStorage.removeItem("eventrix-user");
        setUser(null);
      })
      .finally(() => setLoading(false));
  }, []);

  // Save a successful login response so protected pages can be refreshed.
  async function saveSession(request) {
    const { data } = await request;
    localStorage.setItem("eventrix-token", data.data.token);
    localStorage.setItem("eventrix-user", JSON.stringify(data.data.user));
    setUser(data.data.user);
    return data.data.user;
  }

  function login(email, password) {
    return saveSession(api.post("/auth/login", { email, password }));
  }

  function register(details) {
    return saveSession(api.post("/auth/register", details));
  }

  function logout() {
    localStorage.removeItem("eventrix-token");
    localStorage.removeItem("eventrix-user");
    setUser(null);
  }

  const value = useMemo(() => ({
    user,
    loading,
    login,
    register,
    logout
  }), [user, loading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// Read account state from any component without prop drilling.
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside AuthProvider.");
  return context;
}

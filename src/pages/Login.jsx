import { ArrowRight, CalendarDays } from "lucide-react";
import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { useToast } from "../context/ToastContext.jsx";
import { getErrorMessage } from "../services/api.js";

// Sign in an attendee or organizer and continue to the requested page.
export default function Login() {
  const { login } = useAuth();
  const { notify } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ email: "", password: "" });
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);

  function validate() {
    const nextErrors = {};
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) nextErrors.email = "Enter a valid email address.";
    if (!form.password) nextErrors.password = "Enter your password.";
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  async function submit(event) {
    event.preventDefault();
    if (!validate()) return;
    setBusy(true);
    try {
      const user = await login(form.email, form.password);
      notify(`Welcome back, ${user.name.split(" ")[0]}.`);
      const defaultPath = user.role === "organizer" ? "/organizer" : "/events";
      navigate(location.state?.from?.pathname || location.state?.from || defaultPath, { replace: true });
    } catch (error) {
      notify(getErrorMessage(error), "error");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-art">
        <Link className="brand auth-brand" to="/"><span className="brand-mark"><CalendarDays size={19} /></span><span>eventrix<span className="brand-period">.</span></span></Link>
        <div className="auth-art-copy"><span className="eyebrow">YOUR CITY, MORE ALIVE</span><h2>Make the<br />weekend <em>count.</em></h2><p>The best stories start with a plan. Find yours here.</p></div>
        <div className="auth-art-footer">FIND YOUR PEOPLE. FEEL THE MOMENT.</div>
      </div>
      <div className="auth-form-wrap">
        <div className="auth-form-card">
          <span className="eyebrow">WELCOME BACK</span>
          <h1>Good to see you.</h1>
          <p className="auth-subtitle">Sign in to pick up where you left off.</p>
          <form onSubmit={submit} noValidate>
            <label className="form-field">Email address
              <input type="email" autoComplete="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} placeholder="you@example.com" aria-invalid={Boolean(errors.email)} />
              {errors.email && <small className="field-error">{errors.email}</small>}
            </label>
            <label className="form-field">Password
              <input type="password" autoComplete="current-password" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} placeholder="Your password" aria-invalid={Boolean(errors.password)} />
              {errors.password && <small className="field-error">{errors.password}</small>}
            </label>
            <button className="button button-primary button-full auth-submit" disabled={busy}>{busy ? "Signing you in..." : "Sign in"} <ArrowRight size={16} /></button>
          </form>
          <p className="auth-switch">New to Eventrix? <Link to="/register">Create an account</Link></p>
          <div className="demo-note"><span>DEMO ORGANIZER</span><br />organizer@eventrix.demo<br />EventrixDemo2026!</div>
        </div>
      </div>
    </div>
  );
}

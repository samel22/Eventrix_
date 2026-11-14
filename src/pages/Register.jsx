import { ArrowRight, CalendarDays } from "lucide-react";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { useToast } from "../context/ToastContext.jsx";
import { getErrorMessage } from "../services/api.js";

// Create a new attendee account after checking the form fields.
export default function Register() {
  const { register } = useAuth();
  const { notify } = useToast();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", password: "", confirmPassword: "" });
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);

  function validate() {
    const nextErrors = {};
    if (form.name.trim().length < 2) nextErrors.name = "Enter your name.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) nextErrors.email = "Enter a valid email address.";
    if (form.password.length < 8) nextErrors.password = "Use at least 8 characters.";
    if (form.password !== form.confirmPassword) nextErrors.confirmPassword = "Your passwords do not match.";
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  async function submit(event) {
    event.preventDefault();
    if (!validate()) return;
    setBusy(true);
    try {
      await register({ name: form.name, email: form.email, password: form.password });
      notify("Your account is ready. Let's find a good plan.");
      navigate("/events", { replace: true });
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
        <div className="auth-art-copy"><span className="eyebrow">A LITTLE MORE OUT THERE</span><h2>Put the<br />good stuff <em>on.</em></h2><p>Discover the experiences that make a city feel like yours.</p></div>
        <div className="auth-art-footer">GOOD THINGS HAPPEN IN PERSON.</div>
      </div>
      <div className="auth-form-wrap">
        <div className="auth-form-card">
          <span className="eyebrow">COME ON IN</span>
          <h1>Make yourself at home.</h1>
          <p className="auth-subtitle">Create an account and find your next thing.</p>
          <form onSubmit={submit} noValidate>
            <label className="form-field">Your name
              <input autoComplete="name" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} placeholder="Alex Morgan" aria-invalid={Boolean(errors.name)} />
              {errors.name && <small className="field-error">{errors.name}</small>}
            </label>
            <label className="form-field">Email address
              <input type="email" autoComplete="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} placeholder="you@example.com" aria-invalid={Boolean(errors.email)} />
              {errors.email && <small className="field-error">{errors.email}</small>}
            </label>
            <label className="form-field">Password
              <input type="password" autoComplete="new-password" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} placeholder="At least 8 characters" aria-invalid={Boolean(errors.password)} />
              {errors.password && <small className="field-error">{errors.password}</small>}
            </label>
            <label className="form-field">Confirm password
              <input type="password" autoComplete="new-password" value={form.confirmPassword} onChange={(event) => setForm({ ...form, confirmPassword: event.target.value })} placeholder="Enter your password again" aria-invalid={Boolean(errors.confirmPassword)} />
              {errors.confirmPassword && <small className="field-error">{errors.confirmPassword}</small>}
            </label>
            <button className="button button-primary button-full auth-submit" disabled={busy}>{busy ? "Creating your account..." : "Create account"} <ArrowRight size={16} /></button>
          </form>
          <p className="auth-switch">Already have an account? <Link to="/login">Sign in</Link></p>
        </div>
      </div>
    </div>
  );
}

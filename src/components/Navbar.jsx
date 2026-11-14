import { CalendarDays, Heart, LogOut, Menu, Ticket, UserRound, X } from "lucide-react";
import { useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

// Show the links that match the signed-in visitor's role.
export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  function signOut() {
    logout();
    setMenuOpen(false);
    navigate("/");
  }

  function closeMenu() {
    setMenuOpen(false);
  }

  return (
    <header className="site-header">
      <div className="nav-shell">
        <Link className="brand" to="/" onClick={closeMenu}>
          <span className="brand-mark"><CalendarDays size={19} /></span>
          <span>eventrix<span className="brand-period">.</span></span>
        </Link>
        <button className="mobile-menu icon-button" type="button" onClick={() => setMenuOpen(!menuOpen)} aria-label="Toggle navigation">
          {menuOpen ? <X size={21} /> : <Menu size={21} />}
        </button>
        <nav className={`nav-content ${menuOpen ? "nav-open" : ""}`}>
          <div className="nav-links">
            <NavLink to="/events" onClick={closeMenu}>Discover</NavLink>
            {user?.role === "user" && <NavLink to="/saved" onClick={closeMenu}><Heart size={15} /> Saved</NavLink>}
            {user && <NavLink to="/my-bookings" onClick={closeMenu}><Ticket size={15} /> My Bookings</NavLink>}
            {user?.role === "organizer" && <NavLink to="/organizer" onClick={closeMenu}>Dashboard</NavLink>}
          </div>
          <div className="nav-actions">
            {user ? (
              <>
                <Link className="nav-profile" to="/profile" onClick={closeMenu}>
                  <span className="nav-profile-avatar">{user.name?.trim().charAt(0).toUpperCase() || <UserRound size={15} />}</span>
                  <span>{user.name?.split(" ")[0] || "Profile"}</span>
                </Link>
                <button className="button button-outline button-small" type="button" onClick={signOut}>
                  <LogOut size={15} /> Sign out
                </button>
              </>
            ) : (
              <>
                <Link className="nav-login" to="/login" onClick={closeMenu}>Log in</Link>
                <Link className="button button-primary button-small" to="/register" onClick={closeMenu}>Get started</Link>
              </>
            )}
          </div>
        </nav>
      </div>
    </header>
  );
}

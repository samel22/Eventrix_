import { Link, Navigate, Outlet, Route, Routes } from "react-router-dom";
import Navbar from "./components/Navbar.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import CreateEvent from "./pages/CreateEvent.jsx";
import EventDetails from "./pages/EventDetails.jsx";
import Events from "./pages/Events.jsx";
import Home from "./pages/Home.jsx";
import Login from "./pages/Login.jsx";
import MyBookings from "./pages/MyBookings.jsx";
import OrganizerDashboard from "./pages/OrganizerDashboard.jsx";
import Register from "./pages/Register.jsx";
import SavedEvents from "./pages/SavedEvents.jsx";
import TicketPass from "./pages/TicketPass.jsx";

// Keep shared navigation and footer around the main public pages.
function SiteLayout() {
  return (
    <div className="app-shell">
      <Navbar />
      <main className="site-main"><Outlet /></main>
      <footer className="site-footer">
        <Link className="brand footer-brand" to="/"><span className="brand-mark">e</span><span>eventrix<span className="brand-period">.</span></span></Link>
        <p>Find your people. Feel the moment.</p>
        <span>© {new Date().getFullYear()} Eventrix</span>
      </footer>
    </div>
  );
}

// Send unknown URLs back to the event calendar.
function NotFound() {
  return <div className="page-wrap not-found"><span className="eyebrow">WRONG TURN</span><h1>This page wandered off.</h1><Link className="button button-primary" to="/events">Find an event</Link></div>;
}

// Keep account screens focused and protect attendee and organizer pages.
export default function App() {
  return (
    <Routes>
      <Route element={<SiteLayout />}>
        <Route index element={<Home />} />
        <Route path="events" element={<Events />} />
        <Route path="event/:id" element={<EventDetails />} />
        <Route path="events/:id" element={<EventDetails />} />
        <Route element={<ProtectedRoute />}>
          <Route path="profile" element={<MyBookings />} />
          <Route path="my-bookings" element={<MyBookings />} />
          <Route path="pass/:id" element={<TicketPass />} />
        </Route>
        <Route element={<ProtectedRoute role="user" />}>
          <Route path="saved" element={<SavedEvents />} />
        </Route>
        <Route element={<ProtectedRoute role="organizer" />}>
          <Route path="organizer" element={<OrganizerDashboard />} />
          <Route path="organizer/events/new" element={<CreateEvent />} />
          <Route path="organizer/events/:id/edit" element={<CreateEvent />} />
        </Route>
      </Route>
      <Route path="login" element={<Login />} />
      <Route path="register" element={<Register />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

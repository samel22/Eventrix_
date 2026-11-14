import { ArrowRight, CalendarDays, IndianRupee, Plus, Ticket, Users } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import EmptyState from "../components/EmptyState.jsx";
import { Loader } from "../components/Loader.jsx";
import { formatDate } from "../components/EventCard.jsx";
import { useToast } from "../context/ToastContext.jsx";
import api, { getErrorMessage } from "../services/api.js";
import { formatPrice } from "../utils/formatPrice.js";

// Show organizer performance, event management actions, and attendee lists.
export default function OrganizerDashboard() {
  const { notify } = useToast();
  const [analytics, setAnalytics] = useState(null);
  const [events, setEvents] = useState([]);
  const [attendees, setAttendees] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadDashboard() {
    setLoading(true);
    setError("");
    try {
      const [analyticsResponse, eventResponse] = await Promise.all([
        api.get("/events/analytics"),
        api.get("/events/mine")
      ]);
      setAnalytics(analyticsResponse.data.data);
      setEvents(eventResponse.data.data);
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadDashboard(); }, []);

  async function showAttendees(eventId) {
    if (attendees[eventId]) {
      setAttendees((current) => ({ ...current, [eventId]: null }));
      return;
    }
    try {
      const { data } = await api.get(`/events/${eventId}/attendees`);
      setAttendees((current) => ({ ...current, [eventId]: data.data }));
    } catch (requestError) {
      notify(getErrorMessage(requestError), "error");
    }
  }

  async function deleteEvent(eventId) {
    if (!window.confirm("Delete this event? This cannot be undone.")) return;
    try {
      await api.delete(`/events/${eventId}`);
      notify("Event deleted.");
      await loadDashboard();
    } catch (requestError) {
      notify(getErrorMessage(requestError), "error");
    }
  }

  if (loading) return <Loader label="Preparing your organizer dashboard..." />;
  if (error) return <div className="page-wrap error-state"><p>{error}</p><button className="button button-outline" onClick={loadDashboard}>Try again</button></div>;

  const maxRevenue = Math.max(...(analytics?.events || []).map((item) => item.revenue), 1);
  return (
    <div className="page-wrap dashboard-page">
      <section className="dashboard-heading">
        <div><span className="eyebrow">THE MAKER'S DESK</span><h1>Your events, <span>in motion.</span></h1><p>A clear view of what's happening and who's coming.</p></div>
        <Link className="button button-primary" to="/organizer/events/new"><Plus size={17} /> Create an event</Link>
      </section>
      <div className="stat-grid">
        <article className="stat-card"><span className="stat-icon cyan"><CalendarDays size={19} /></span><span className="eyebrow">YOUR EVENTS</span><strong>{analytics.totalEvents}</strong><small>on the calendar</small></article>
        <article className="stat-card"><span className="stat-icon violet"><Ticket size={19} /></span><span className="eyebrow">TICKETS BOOKED</span><strong>{analytics.totalBookings}</strong><small>confirmed bookings</small></article>
        <article className="stat-card"><span className="stat-icon green"><IndianRupee size={19} /></span><span className="eyebrow">TOTAL REVENUE</span><strong>{formatPrice(analytics.totalRevenue)}</strong><small>from confirmed bookings</small></article>
        <article className="stat-card"><span className="stat-icon orange"><Users size={19} /></span><span className="eyebrow">SEATS SOLD</span><strong>{analytics.seatsSold}</strong><small>people showing up</small></article>
      </div>
      <section className="dashboard-panel chart-panel">
        <div className="panel-heading"><div><span className="eyebrow">A QUICK READ</span><h2>Revenue by event</h2></div><span className="chart-caption">Confirmed ticket sales</span></div>
        {analytics.events.length ? (
          <div className="bar-chart">
            {analytics.events.map((item) => (
              <div className="bar-row" key={item.title}>
                <span className="bar-label" title={item.title}>{item.title}</span>
                <div className="bar-track"><div className="bar-fill" style={{ width: `${Math.max(3, (item.revenue / maxRevenue) * 100)}%` }} /></div>
                <strong className="bar-value">{formatPrice(item.revenue)}</strong>
              </div>
            ))}
          </div>
        ) : <p className="muted-text">Revenue will show here once your first ticket is booked.</p>}
      </section>
      <section className="dashboard-panel">
        <div className="panel-heading"><div><span className="eyebrow">YOUR LINEUP</span><h2>Events you are hosting</h2></div><Link className="text-link" to="/organizer/events/new">Create another <ArrowRight size={15} /></Link></div>
        {events.length ? (
          <div className="organizer-events">
            {events.map((event) => (
              <article className="organizer-event" key={event._id}>
                <div className="organizer-event-main">
                  <div className="organizer-event-date"><CalendarDays size={16} /><span>{formatDate(event.date)}</span></div>
                  <h3>{event.title}</h3>
                  <p>{event.category} <span className="dot-separator">·</span> {event.seatsAvailable} of {event.totalSeats} spots left</p>
                </div>
                <div className="organizer-event-actions">
                  <button className="text-button" type="button" onClick={() => showAttendees(event._id)}>{attendees[event._id] ? "Hide attendees" : "Attendees"}</button>
                  <Link className="text-button" to={`/organizer/events/${event._id}/edit`}>Edit</Link>
                  <button className="text-button danger-text" type="button" onClick={() => deleteEvent(event._id)}>Delete</button>
                </div>
                {attendees[event._id] && (
                  <div className="attendees-panel">
                    <strong>Confirmed attendees ({attendees[event._id].length})</strong>
                    {attendees[event._id].length ? attendees[event._id].map((booking) => (
                      <div className="attendee-row" key={booking._id}><span>{booking.user.name} <small>{booking.user.email}</small></span><span>{booking.quantity} {booking.quantity === 1 ? "ticket" : "tickets"}</span></div>
                    )) : <p className="muted-text">No one has booked this event yet.</p>}
                  </div>
                )}
              </article>
            ))}
          </div>
        ) : <EmptyState title="Your first event starts here." message="Create an event and give people a reason to show up." action="Create an event" to="/organizer/events/new" />}
      </section>
    </div>
  );
}

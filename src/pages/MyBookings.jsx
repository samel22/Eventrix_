import { useEffect, useState } from "react";
import { CalendarDays } from "lucide-react";
import { Link } from "react-router-dom";
import BookingCard from "../components/BookingCard.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { useToast } from "../context/ToastContext.jsx";
import api, { getErrorMessage } from "../services/api.js";

// List current ticket bookings and keep the seat count current after canceling.
export default function MyBookings() {
  const { user } = useAuth();
  const { notify } = useToast();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState("");
  const [error, setError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError("");
    api.get("/bookings/my-bookings")
      .then(({ data }) => {
        if (active) setBookings(data.data);
      })
      .catch((requestError) => {
        if (active) setError(getErrorMessage(requestError));
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, [reloadKey]);

  async function cancelBooking(id) {
    if (!window.confirm("Cancel this booking? The seats will be made available again.")) return;
    setBusyId(id);
    const previousBooking = bookings.find((booking) => booking._id === id);
    setBookings((current) => current.map((booking) => (
      booking._id === id ? { ...booking, status: "cancelled", cancellationPending: true } : booking
    )));
    try {
      const { data } = await api.delete(`/bookings/${id}`);
      setBookings((current) => current.map((booking) => (
        booking._id === id ? data.data : booking
      )));
      notify("Booking cancelled. The seats are available again.");
    } catch (requestError) {
      setBookings((current) => current.map((booking) => (
        booking._id === id
          ? { ...booking, status: previousBooking?.status || "confirmed", cancellationPending: false }
          : booking
      )));
      notify(getErrorMessage(requestError), "error");
    } finally {
      setBusyId("");
    }
  }

  return (
    <div className="page-wrap">
      <section className="page-intro">
        <div className="profile-heading">
          <div className="profile-avatar" aria-hidden="true">{user?.name?.trim().charAt(0).toUpperCase() || "E"}</div>
          <div>
            <span className="eyebrow">YOUR PLANS, ALL HERE</span>
            <h1>{user?.name || "Your profile"}<span>.</span></h1>
            <p>{user?.email}</p>
          </div>
        </div>
      </section>
      <section className="profile-bookings">
        <div className="profile-bookings-heading">
          <div><span className="eyebrow">YOUR EVENT HISTORY</span><h2>My Bookings</h2></div>
          <span className="booking-count">{bookings.length} {bookings.length === 1 ? "booking" : "bookings"}</span>
        </div>
        {loading ? (
          <div className="booking-list" aria-label="Loading bookings">
            {[1, 2].map((item) => (
              <div className="booking-skeleton" key={item} aria-hidden="true">
                <span className="skeleton skeleton-image" />
                <span className="skeleton skeleton-line" />
                <span className="skeleton skeleton-line wide" />
                <span className="skeleton skeleton-line medium" />
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="error-state"><p>{error}</p><button className="button button-outline" type="button" onClick={() => setReloadKey((key) => key + 1)}>Try again</button></div>
        ) : bookings.length ? (
          <div className="booking-list">
            {bookings.map((booking) => (
              <BookingCard key={booking._id} booking={booking} onCancel={cancelBooking} busy={busyId === booking._id} />
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <span className="empty-icon"><CalendarDays size={23} /></span>
            <h3>No bookings yet</h3>
            <p>No bookings yet - Explore Events to find your next good story.</p>
            <Link className="button button-primary" to="/events">Explore Events</Link>
          </div>
        )}
      </section>
    </div>
  );
}

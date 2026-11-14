import { ArrowLeft, CalendarDays, CalendarPlus, Download, MapPin, Ticket, Users, X } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { QRCodeSVG } from "qrcode.react";
import { useAuth } from "../context/AuthContext.jsx";
import { useToast } from "../context/ToastContext.jsx";
import { Loader } from "../components/Loader.jsx";
import ReviewSection from "../components/ReviewSection.jsx";
import { RatingStars } from "../components/RatingStars.jsx";
import ShareEventMenu from "../components/ShareEventMenu.jsx";
import SeatSelectionModal from "../components/SeatSelectionModal.jsx";
import { formatDate } from "../components/EventCard.jsx";
import { useWishlist } from "../hooks/useWishlist.js";
import api, { getErrorMessage } from "../services/api.js";
import { downloadCalendar, downloadQrCode } from "../utils/eventDownloads.js";
import { getEventImage } from "../utils/eventImages.js";
import { formatPrice } from "../utils/formatPrice.js";
import { normalizeEvent } from "../utils/normalizeEvent.js";

// Show event information and let a signed-in attendee reserve tickets.
export default function EventDetails() {
  const { id } = useParams();
  const { user } = useAuth();
  const { savedIds, toggleSaved } = useWishlist();
  const { notify } = useToast();
  const navigate = useNavigate();
  const [event, setEvent] = useState(null);
  const [selectedSeats, setSelectedSeats] = useState([]);
  const [seatMapOpen, setSeatMapOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState(false);
  const [bookingError, setBookingError] = useState("");
  const [error, setError] = useState("");
  const [now, setNow] = useState(Date.now());
  const [successBooking, setSuccessBooking] = useState(null);
  const handleReviewSummary = useCallback((summary) => {
    setEvent((current) => current && ({ ...current, ...summary }));
  }, []);
  const closeSeatMap = useCallback(() => setSeatMapOpen(false), []);

  useEffect(() => {
    api.get(`/events/${id}`)
      .then(({ data }) => setEvent(normalizeEvent(data.data)))
      .catch((requestError) => setError(getErrorMessage(requestError)))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 30_000);
    return () => window.clearInterval(timer);
  }, []);

  async function bookTickets() {
    if (!user) {
      setSeatMapOpen(false);
      navigate("/login", { state: { from: `/event/${id}` } });
      return;
    }
    if (user.role !== "user") {
      notify("Attendee accounts are used to book tickets.", "error");
      return;
    }
    if (!selectedSeats.length) {
      setBookingError("Select at least one available seat.");
      return;
    }
    if (selectedSeats.length > availableSeats) {
      setBookingError(`Only ${availableSeats} seats are available. Adjust your selection.`);
      return;
    }

    setBooking(true);
    setBookingError("");
    try {
      const { data } = await api.post(`/bookings/events/${id}`, {
        seatIds: selectedSeats,
        quantity: selectedSeats.length
      });
      const bookedEvent = data.data.event ? normalizeEvent(data.data.event) : null;
      setEvent((current) => ({
        ...current,
        seatsAvailable: bookedEvent?.seatsAvailable ?? current.seatsAvailable - selectedSeats.length,
        bookedSeats: bookedEvent?.bookedSeats ?? [...(current.bookedSeats || []), ...selectedSeats]
      }));
      setSuccessBooking(data.data);
      setSelectedSeats([]);
      setSeatMapOpen(false);
    } catch (requestError) {
      const message = getErrorMessage(requestError);
      setBookingError(message);
      if (requestError.response?.status === 409) {
        try {
          const { data } = await api.get(`/events/${id}`);
          const updatedEvent = normalizeEvent(data.data);
          setEvent(updatedEvent);
          setSelectedSeats((current) => {
            const stillFree = current.filter((seatId) => !(updatedEvent.bookedSeats || []).includes(seatId));
            const limit = Number(updatedEvent.seatsAvailable);
            return Number.isFinite(limit) ? stillFree.slice(0, limit) : stillFree;
          });
        } catch (refreshError) {
          notify(getErrorMessage(refreshError), "error");
        }
      }
    } finally {
      setBooking(false);
    }
  }

  if (loading) return <Loader label="Finding the event..." />;
  if (error || !event) return <div className="page-wrap error-state">{error || "Event not found."}<Link to="/events" className="text-link">Back to events</Link></div>;

  const saved = savedIds.includes(event._id);
  const availableSeats = Number(event.seatsAvailable);
  const soldOut = !Number.isFinite(availableSeats) || availableSeats < 1;
  const eventStart = new Date(event.date).getTime();
  const eventDateInvalid = !Number.isFinite(eventStart);
  const eventHasPassed = !eventDateInvalid && eventStart <= now;
  const bookingDisabled = soldOut || eventHasPassed || eventDateInvalid || booking || !Number(event.totalSeats);

  function toggleSeat(seatId) {
    if (selectedSeats.includes(seatId)) {
      setSelectedSeats((current) => current.filter((selected) => selected !== seatId));
      setBookingError("");
      return;
    }
    if (selectedSeats.length >= availableSeats) {
      setBookingError("You cannot select more seats than are available.");
      return;
    }
    setBookingError("");
    setSelectedSeats((current) => [...current, seatId]);
  }

  function addEventToCalendar() {
    try {
      downloadCalendar(event);
    } catch (downloadError) {
      notify(downloadError.message, "error");
    }
  }

  function downloadBookingQr() {
    try {
      downloadQrCode(`booking-qr-${successBooking._id}`, `eventrix-ticket-${successBooking._id}.svg`);
    } catch (downloadError) {
      notify(downloadError.message, "error");
    }
  }

  return (
    <div className="page-wrap details-page">
      <Link to="/events" className="back-link"><ArrowLeft size={16} /> Back to all events</Link>
      <div className="details-layout">
        <main className="details-main">
          <div className="details-cover" style={{ backgroundImage: `url("${event.imageUrl || getEventImage(event.category)}")` }}>
            <span className="category-pill">{event.category}</span>
            <button type="button" className={`save-button details-save ${saved ? "is-saved" : ""}`} onClick={() => toggleSaved(event._id)} aria-label={saved ? "Remove from saved events" : "Save event"}>
              <span>{saved ? "Saved" : "Save"}</span>
            </button>
          </div>
          <div className="details-title">
            <span className="eyebrow">A DATE FOR YOUR CALENDAR</span>
            <h1>{event.title}</h1>
            <p className="details-organizer">Hosted by {event.organizer?.name || "Eventrix"}</p>
            <div className="details-social">
              {event.reviewCount > 0 ? (
                <span className="details-rating"><RatingStars rating={event.averageRating} /> <strong>{Number(event.averageRating).toFixed(1)}</strong><small>({event.reviewCount} {event.reviewCount === 1 ? "review" : "reviews"})</small></span>
              ) : <span className="details-rating-empty">No reviews yet</span>}
              <ShareEventMenu event={event} />
            </div>
          </div>
          <div className="details-facts">
            <div><span className="fact-icon"><CalendarDays size={18} /></span><span><small>WHEN</small><strong>{formatDate(event.date)}</strong><small>{new Date(event.date).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}</small></span></div>
            <div><span className="fact-icon"><MapPin size={18} /></span><span><small>WHERE</small><strong>{event.venue}</strong><small>See you there</small></span></div>
            <div><span className="fact-icon"><Users size={18} /></span><span><small>AVAILABILITY</small><strong>{event.seatsAvailable} spots</strong><small>Limited capacity</small></span></div>
          </div>
          <section className="details-description">
            <h2>About the experience</h2>
            <p>{event.description}</p>
            <button className="button button-outline calendar-button" type="button" onClick={addEventToCalendar}>
              <CalendarPlus size={16} /> Add to Calendar
            </button>
          </section>
        </main>
        <aside className="ticket-panel">
          <span className="eyebrow">MAKE IT A PLAN</span>
          <div className="ticket-price">{event.price === 0 ? "Free" : formatPrice(event.price)}<small> / person</small></div>
          <p className="availability-note">
            {eventDateInvalid ? "This event date is unavailable." : eventHasPassed ? "This event has passed." : soldOut ? "This event is sold out or its availability could not be loaded." : `${availableSeats} seats still available`}
          </p>
          <div className="price-total"><span>Price per seat</span><strong>{formatPrice(event.price)}</strong></div>
          <button className="button button-primary button-full" type="button" onClick={() => {
            setBookingError("");
            setSeatMapOpen(true);
          }} disabled={bookingDisabled}>
            <Ticket size={17} /> {eventDateInvalid ? "Date unavailable" : eventHasPassed ? "Event has passed" : soldOut ? "Sold out" : !Number(event.totalSeats) ? "Seat map unavailable" : "Reserve My Spot"}
          </button>
          <p className="secure-note">Choose your seats in the map. Your booking is confirmed after checkout.</p>
        </aside>
      </div>
      <ReviewSection eventId={id} onSummaryChange={handleReviewSummary} />
      {seatMapOpen && (
        <SeatSelectionModal
          event={event}
          selectedSeatIds={selectedSeats}
          onToggleSeat={toggleSeat}
          onConfirm={bookTickets}
          onClose={closeSeatMap}
          booking={booking}
          error={bookingError}
        />
      )}
      {successBooking && (
        <div className="dialog-backdrop" onMouseDown={(click) => {
          if (click.target === click.currentTarget) setSuccessBooking(null);
        }}>
          <section className="booking-success-dialog" role="dialog" aria-modal="true" aria-labelledby="booking-success-title">
            <button className="dialog-close icon-button" type="button" onClick={() => setSuccessBooking(null)} aria-label="Close booking confirmation"><X size={20} /></button>
            <span className="eyebrow">YOU ARE ON THE LIST</span>
            <h2 id="booking-success-title">Spot reserved!</h2>
            <p>Check My Bookings in your profile.</p>
            <div className="success-qr">
              <QRCodeSVG id={`booking-qr-${successBooking._id}`} value={successBooking._id} size={160} level="M" />
              <span>Booking ID: {successBooking._id}</span>
              <span>Seats: {(successBooking.seatIds || []).join(", ")}</span>
            </div>
            <ShareEventMenu event={event} className="success-share-menu" label="Share this event" />
            <button className="button button-outline button-full" type="button" onClick={downloadBookingQr}>
              <Download size={16} /> Download QR ticket
            </button>
            <Link className="button button-primary button-full" to="/profile" onClick={() => setSuccessBooking(null)}>
              Go to My Bookings
            </Link>
          </section>
        </div>
      )}
    </div>
  );
}


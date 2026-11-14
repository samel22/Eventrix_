import { CalendarDays, CalendarPlus, Download, MapPin, Ticket } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { Link } from "react-router-dom";
import { useToast } from "../context/ToastContext.jsx";
import ShareEventMenu from "./ShareEventMenu.jsx";
import { formatDate } from "./EventCard.jsx";
import { downloadCalendar, downloadQrCode } from "../utils/eventDownloads.js";
import { getEventImage } from "../utils/eventImages.js";
import { formatPrice } from "../utils/formatPrice.js";
import { normalizeEvent } from "../utils/normalizeEvent.js";

// Display a booking, its unique ticket pass, and its cancel action.
export default function BookingCard({ booking, onCancel, busy }) {
  const { notify } = useToast();
  const event = normalizeEvent(booking.event || {});
  const date = event.date ? new Date(event.date) : null;
  const qrId = `booking-card-qr-${booking._id}`;

  function downloadQr() {
    try {
      downloadQrCode(qrId, `eventrix-ticket-${booking._id}.svg`);
    } catch (error) {
      notify(error.message, "error");
    }
  }

  function addToCalendar() {
    try {
      downloadCalendar(event);
    } catch (error) {
      notify(error.message, "error");
    }
  }

  return (
    <article className={`booking-card ${booking.status === "cancelled" ? "booking-cancelled" : ""}`}>
      <img className="booking-event-image" src={event.imageUrl || getEventImage(event.category)} alt={`${event.title || "Event"} cover`} />
      <div className="booking-date">
        <span>{date ? date.toLocaleDateString("en-IN", { month: "short" }).toUpperCase() : "EVENT"}</span>
        <strong>{date ? date.getDate() : "—"}</strong>
      </div>
      <div className="booking-info">
        <span className={`status-pill status-${booking.status}`}>{booking.status === "cancelled" ? "Cancelled" : "Confirmed"}</span>
        <h3>{event.title || "Event details unavailable"}</h3>
        {date && (
          <p><CalendarDays size={14} /> {formatDate(event.date)} at {date.toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" })}</p>
        )}
        {event.venue && <p><MapPin size={14} /> {event.venue}</p>}
        <p>{booking.ticketType || "General Admission"} <span className="dot-separator">·</span> {booking.quantity} {booking.quantity === 1 ? "seat" : "seats"}</p>
        {booking.seatIds?.length > 0 && <p className="booking-seat-list">Seats: {booking.seatIds.join(", ")}</p>}
        <span className="booking-code">Booking ID: {booking._id}</span>
        {booking.bookingCode && <span className="booking-code">Ticket code: {booking.bookingCode}</span>}
        {booking.status === "cancelled" && !booking.cancellationPending && Number.isFinite(event.seatsAvailable) && (
          <span className="booking-restored-seats">{event.seatsAvailable} spots available again</span>
        )}
        {booking.status === "confirmed" && date && (
          <button className="text-button booking-calendar" type="button" onClick={addToCalendar}>
            <CalendarPlus size={14} /> Add to Calendar
          </button>
        )}
      </div>
      <div className="booking-actions">
        <strong>{formatPrice(booking.totalPrice)}</strong>
        <small>Total paid</small>
        {booking.status === "confirmed" && (
          <div className="booking-qr">
            <QRCodeSVG id={qrId} value={booking._id} size={88} level="M" />
            <button className="text-button" type="button" onClick={downloadQr}><Download size={14} /> Download QR</button>
          </div>
        )}
        {booking.status === "confirmed" ? (
          <>
            <Link className="button button-primary button-small" to={`/pass/${booking._id}`}><Ticket size={15} /> Ticket pass</Link>
            <ShareEventMenu event={event} label="Share this event" />
            <button className="text-button" type="button" disabled={busy} onClick={() => onCancel(booking._id)}>{busy ? "Cancelling..." : "Cancel booking"}</button>
          </>
        ) : <span className="muted-text">Cancelled</span>}
      </div>
    </article>
  );
}

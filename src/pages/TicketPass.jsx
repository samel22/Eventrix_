import { ArrowLeft, CalendarDays, CalendarPlus, Download, MapPin, Ticket } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { formatDate } from "../components/EventCard.jsx";
import { Loader } from "../components/Loader.jsx";
import { useToast } from "../context/ToastContext.jsx";
import api, { getErrorMessage } from "../services/api.js";
import { downloadCalendar, downloadQrCode } from "../utils/eventDownloads.js";
import { getEventImage } from "../utils/eventImages.js";
import { formatPrice } from "../utils/formatPrice.js";
import { normalizeEvent } from "../utils/normalizeEvent.js";

// Display the unique booking code as a simple scannable-style ticket pass.
export default function TicketPass() {
  const { id } = useParams();
  const { notify } = useToast();
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    api.get(`/bookings/${id}/pass`)
      .then(({ data }) => setBooking(data.data))
      .catch((requestError) => setError(getErrorMessage(requestError)))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <Loader label="Loading your ticket pass..." />;
  if (error || !booking) return <div className="page-wrap error-state">{error || "Ticket pass not found."}</div>;
  if (!booking.event) return <div className="page-wrap error-state">The event details for this booking are no longer available.</div>;
  const event = normalizeEvent(booking.event);

  function downloadQr() {
    try {
      downloadQrCode(`ticket-pass-qr-${booking._id}`, `eventrix-ticket-${booking._id}.svg`);
    } catch (downloadError) {
      notify(downloadError.message, "error");
    }
  }

  function addToCalendar() {
    try {
      downloadCalendar(event);
    } catch (downloadError) {
      notify(downloadError.message, "error");
    }
  }

  return (
    <div className="pass-page">
      <Link to="/my-bookings" className="back-link"><ArrowLeft size={16} /> Back to my tickets</Link>
      <div className="pass-heading"><span className="eyebrow">YOU ARE ON THE LIST</span><h1>Your ticket <span>pass.</span></h1><p>Keep this pass handy when you arrive.</p></div>
      <article className="ticket-pass">
        <div className="ticket-pass-image" style={{ backgroundImage: `url("${event.imageUrl || getEventImage(event.category)}")` }}>
          <div className="ticket-pass-shade" />
          <span className="category-pill">{event.category}</span>
          <div className="pass-event-title"><span>EVENTRIX PRESENTS</span><h2>{event.title}</h2></div>
        </div>
        <div className="pass-details">
          <div className="pass-facts">
            <div><CalendarDays size={17} /><span><small>DATE & TIME</small><strong>{formatDate(event.date)}</strong><small>{new Date(event.date).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}</small></span></div>
            <div><MapPin size={17} /><span><small>VENUE</small><strong>{event.venue}</strong></span></div>
          </div>
          <div className="pass-perforation"><span /><i /><span /></div>
          <div className="pass-code-row">
            <div><small>BOOKING CODE</small><strong className="pass-code">{booking.bookingCode}</strong><small>{booking.quantity} {booking.quantity === 1 ? "ticket" : "tickets"} · {formatPrice(booking.totalPrice)}</small></div>
            <div className="ticket-qr-wrap">
              <QRCodeSVG id={`ticket-pass-qr-${booking._id}`} value={booking._id} size={112} level="M" />
              <button className="text-button" type="button" onClick={downloadQr}><Download size={14} /> Download QR</button>
            </div>
          </div>
          {booking.seatIds?.length > 0 && <p className="pass-seat-list"><strong>SEATS</strong><span>{booking.seatIds.join(", ")}</span></p>}
          <button className="button button-outline calendar-button" type="button" onClick={addToCalendar}><CalendarPlus size={16} /> Add to Calendar</button>
          <p className="pass-footnote"><Ticket size={14} /> This is a demo ticket pass. Your booking is saved to your Eventrix account.</p>
        </div>
      </article>
    </div>
  );
}

import { Check, X } from "lucide-react";
import { useEffect } from "react";
import { createPortal } from "react-dom";
import { formatDate } from "./EventCard.jsx";
import { formatPrice } from "../utils/formatPrice.js";
import { createSeatIds } from "../utils/seatMap.js";

export default function SeatSelectionModal({
  event,
  selectedSeatIds,
  onToggleSeat,
  onConfirm,
  onClose,
  booking,
  error
}) {
  const seatsPerRow = Math.max(1, Number(event.seatsPerRow) || 10);
  const seatIds = createSeatIds(Math.max(0, Number(event.totalSeats) || 0), seatsPerRow);
  const availableSeats = Number(event.seatsAvailable);
  const seatRows = [];
  for (let index = 0; index < seatIds.length; index += seatsPerRow) {
    seatRows.push(seatIds.slice(index, index + seatsPerRow));
  }
  const bookedSeats = new Set(event.bookedSeats || []);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    function handleKeyDown(keyEvent) {
      if (keyEvent.key === "Escape" && !booking) onClose();
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [booking, onClose]);

  return createPortal(
    <div className="seat-modal-backdrop" onMouseDown={(mouseEvent) => {
      if (mouseEvent.target === mouseEvent.currentTarget && !booking) onClose();
    }}>
      <section className="seat-modal-dialog" role="dialog" aria-modal="true" aria-labelledby="seat-modal-title">
        <header className="seat-modal-header">
          <div>
            <span className="eyebrow">CHOOSE YOUR SPOTS</span>
            <h2 id="seat-modal-title">Select seats</h2>
            <p>{event.title} <span>·</span> {formatDate(event.date)}</p>
          </div>
          <button type="button" className="icon-button" onClick={onClose} disabled={booking} aria-label="Close seat selection">
            <X size={20} />
          </button>
        </header>

        <div className="seat-modal-body">
          <div className="seat-legend">
            <span><i className="seat-legend-available" /> Available</span>
            <span><i className="seat-legend-selected" /> Selected</span>
            <span><i className="seat-legend-booked" /> Booked</span>
          </div>
          <div className="seat-stage">STAGE</div>
          {seatRows.length ? (
            <div className="seat-map" role="group" aria-label="Event seat map">
              {seatRows.map((row) => (
                <div className="seat-map-row" key={row[0]} style={{ "--seat-columns": seatsPerRow }}>
                  {row.map((seatId) => {
                    const isBooked = bookedSeats.has(seatId);
                    const isSelected = selectedSeatIds.includes(seatId);
                    const selectionLimitReached = Number.isFinite(availableSeats) &&
                      selectedSeatIds.length >= availableSeats && !isSelected;
                    return (
                      <button
                        key={seatId}
                        type="button"
                        className={`seat-button${isBooked ? " seat-booked" : ""}${isSelected ? " seat-selected" : ""}${selectionLimitReached ? " seat-limit-reached" : ""}`}
                        aria-label={`Seat ${seatId}${isBooked ? ", booked" : isSelected ? ", selected" : ", available"}`}
                        aria-pressed={isSelected}
                        disabled={isBooked || selectionLimitReached}
                        onClick={() => onToggleSeat(seatId)}
                      >
                        {isSelected ? <Check size={14} /> : seatId}
                      </button>
                    );
                  })}
                </div>
              ))}
            </div>
          ) : <p className="seat-empty">The organizer has not configured a seat layout for this event.</p>}
        </div>

        <footer className="seat-modal-footer">
          <div className="seat-selection-summary">
            <span>{selectedSeatIds.length ? selectedSeatIds.join(", ") : "No seats selected"}</span>
            <strong>{formatPrice(event.price * selectedSeatIds.length)}</strong>
            <small>{selectedSeatIds.length} {selectedSeatIds.length === 1 ? "seat" : "seats"} · {formatPrice(event.price)} per seat</small>
          </div>
          {error && <p className="seat-booking-error" role="alert">{error}</p>}
          <button className="button button-primary seat-confirm-button" type="button" onClick={onConfirm} disabled={booking || selectedSeatIds.length === 0}>
            {booking ? "Confirming booking..." : "Confirm booking"}
          </button>
        </footer>
      </section>
    </div>,
    document.body
  );
}

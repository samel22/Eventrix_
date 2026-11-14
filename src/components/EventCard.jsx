import { ArrowUpRight, CalendarDays, Heart, MapPin } from "lucide-react";
import { Link } from "react-router-dom";
import ShareEventMenu from "./ShareEventMenu.jsx";
import { RatingStars } from "./RatingStars.jsx";
import { getEventImage } from "../utils/eventImages.js";
import { formatPrice } from "../utils/formatPrice.js";
import { normalizeEvent } from "../utils/normalizeEvent.js";

// Format event dates consistently across cards and details.
export function formatDate(date) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric"
  }).format(new Date(date));
}

// Show the key event facts and a wishlist action at a glance.
export default function EventCard({ event, saved, onToggleSave }) {
  const displayEvent = normalizeEvent(event);
  return (
    <article className="event-card">
      <Link to={`/events/${displayEvent._id}`} className="event-card-image-link" aria-label={`View ${displayEvent.title}`}>
        <div className="event-card-image" style={{ backgroundImage: `url("${displayEvent.imageUrl || getEventImage(displayEvent.category)}")` }}>
          <span className="category-pill">{displayEvent.category}</span>
          <span className="image-arrow"><ArrowUpRight size={17} /></span>
        </div>
      </Link>
      <button
        className={`save-button ${saved ? "is-saved" : ""}`}
        type="button"
        onClick={() => onToggleSave(displayEvent._id)}
        aria-label={saved ? "Remove from saved events" : "Save event"}
      >
        <Heart size={18} fill={saved ? "currentColor" : "none"} />
      </button>
      <div className="event-card-content">
        <div className="event-meta"><CalendarDays size={14} /> {formatDate(displayEvent.date)}</div>
        <h3><Link to={`/events/${displayEvent._id}`}>{displayEvent.title}</Link></h3>
        <p className="event-location"><MapPin size={14} /> {displayEvent.venue}</p>
        <div className="event-card-social">
          {displayEvent.reviewCount > 0 && (
            <span className="event-card-rating"><RatingStars rating={displayEvent.averageRating} size={12} /> {Number(displayEvent.averageRating).toFixed(1)} <small>({displayEvent.reviewCount})</small></span>
          )}
          <ShareEventMenu event={displayEvent} />
        </div>
        <div className="event-card-footer">
          <span className="event-price">{displayEvent.price === 0 ? "Free" : formatPrice(displayEvent.price)}<small> / person</small></span>
          <span className="seats-note">{displayEvent.seatsAvailable} spots left</span>
        </div>
      </div>
    </article>
  );
}

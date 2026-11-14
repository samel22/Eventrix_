import { useEffect, useState } from "react";
import EmptyState from "../components/EmptyState.jsx";
import EventCard from "../components/EventCard.jsx";
import { EventSkeletons } from "../components/Loader.jsx";
import { useWishlist } from "../hooks/useWishlist.js";
import api, { getErrorMessage } from "../services/api.js";
import { normalizeEvent } from "../utils/normalizeEvent.js";

// Show the events saved in this browser wishlist.
export default function SavedEvents() {
  const { savedIds, toggleSaved } = useWishlist();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    api.get("/events", { params: { upcoming: "false" } })
      .then(({ data }) => setEvents(data.data.map(normalizeEvent).filter((event) => savedIds.includes(event._id))))
      .catch((requestError) => setError(getErrorMessage(requestError)))
      .finally(() => setLoading(false));
  }, [savedIds]);

  return (
    <div className="page-wrap">
      <section className="page-intro">
        <span className="eyebrow">YOUR LITTLE BLACK BOOK</span>
        <h1>Plans worth <span>remembering.</span></h1>
        <p>All the experiences you saved, together in one place.</p>
      </section>
      {loading ? <EventSkeletons /> : error ? <div className="error-state">{error}</div> : events.length ? (
        <div className="event-grid">
          {events.map((event) => <EventCard key={event._id} event={event} saved onToggleSave={toggleSaved} />)}
        </div>
      ) : <EmptyState title="A good plan starts with a little curiosity." message="Tap the heart on any event that catches your eye and it will be waiting here." />}
    </div>
  );
}

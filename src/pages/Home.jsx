import { ArrowDownRight, ArrowRight, CalendarDays, Clock3, MapPin, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import EventCard from "../components/EventCard.jsx";
import { EventSkeletons } from "../components/Loader.jsx";
import { useWishlist } from "../hooks/useWishlist.js";
import api, { getErrorMessage } from "../services/api.js";
import { useToast } from "../context/ToastContext.jsx";
import { normalizeEvent } from "../utils/normalizeEvent.js";

// Show a live countdown to the next listed event.
function useCountdown(targetDate) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  if (!targetDate) return null;
  const remaining = Math.max(0, new Date(targetDate).getTime() - now);
  return {
    days: Math.floor(remaining / 86400000),
    hours: Math.floor((remaining / 3600000) % 24),
    minutes: Math.floor((remaining / 60000) % 60),
    seconds: Math.floor((remaining / 1000) % 60)
  };
}

// Introduce Eventrix and highlight the nearest event with a countdown.
export default function Home() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const { savedIds, toggleSaved } = useWishlist();
  const { notify } = useToast();
  const featured = events[0];
  const countdown = useCountdown(featured?.date);

  useEffect(() => {
    api.get("/events")
      .then(({ data }) => setEvents(data.data.map(normalizeEvent)))
      .catch((requestError) => setError(getErrorMessage(requestError)))
      .finally(() => setLoading(false));
  }, []);

  function saveFeatured() {
    if (!featured) return;
    toggleSaved(featured._id);
  }

  return (
    <>
      <section className="hero-section">
        <div className="hero-copy">
          <div className="eyebrow"><span className="eyebrow-dot" /> GOOD THINGS HAPPEN IN PERSON</div>
          <h1>Make room for<br /><span>something real.</span></h1>
          <p>Find the live music, curious conversations, and little adventures that make a city feel like yours.</p>
          <div className="hero-actions">
            <Link className="button button-primary" to="/events">Find your next thing <ArrowRight size={17} /></Link>
            <a className="quiet-link" href="#featured">See what is coming <ArrowDownRight size={16} /></a>
          </div>
          <div className="hero-proof"><span className="proof-avatars"><i>J</i><i>A</i><i>M</i></span><span><strong>Good company</strong><br />starts with showing up.</span></div>
        </div>
        <div className="hero-visual">
          <div className="hero-glow" />
          <div className="hero-image-card">
            <img src="https://images.unsplash.com/photo-1506157786151-b8491531f063?auto=format&fit=crop&w=1400&q=85" alt="Crowd enjoying a live music event" />
            <div className="hero-image-shade" />
            <div className="hero-image-caption">
              <span className="live-tag"><span /> THE CITY, OUT THERE</span>
              <strong>Find your people.<br />Feel the moment.</strong>
            </div>
          </div>
          <div className="floating-note"><Sparkles size={16} /><span><strong>Plans worth keeping</strong><br />Curated for your kind of curious</span></div>
          <div className="hero-index">01 <span /> 04</div>
        </div>
      </section>

      <section className="featured-section page-section" id="featured">
        <div className="section-heading">
          <div><span className="eyebrow">UP NEXT</span><h2>A good reason to leave home.</h2></div>
          <Link className="text-link" to="/events">All events <ArrowRight size={16} /></Link>
        </div>
        {loading ? <EventSkeletons count={1} /> : error ? (
          <div className="inline-error"><span>{error}</span><button type="button" className="text-button" onClick={() => window.location.reload()}>Try again</button></div>
        ) : featured ? (
          <div className="featured-card">
            <div className="featured-image" style={{ backgroundImage: `url("${featured.imageUrl}")` }}>
              <span className="category-pill">{featured.category}</span>
            </div>
            <div className="featured-content">
              <div className="featured-kicker"><span className="kicker-line" /> FEATURED EXPERIENCE</div>
              <h3>{featured.title}</h3>
              <p>{featured.description}</p>
              <div className="featured-details">
                <span><CalendarDays size={16} /> {new Date(featured.date).toLocaleDateString("en-US", { weekday: "short", month: "long", day: "numeric" })}</span>
                <span><MapPin size={16} /> {featured.venue}</span>
                <span><Clock3 size={16} /> {featured.seatsAvailable} spots left</span>
              </div>
              {countdown && (
                <div className="countdown" aria-label="Countdown to featured event">
                  {[["days", "DAYS"], ["hours", "HRS"], ["minutes", "MIN"], ["seconds", "SEC"]].map(([key, label]) => (
                    <div className="countdown-unit" key={key}><strong>{String(countdown[key]).padStart(2, "0")}</strong><span>{label}</span></div>
                  ))}
                </div>
              )}
              <div className="featured-actions">
                <Link className="button button-primary" to={`/events/${featured._id}`}>Get the details <ArrowRight size={16} /></Link>
                <button className="button button-quiet" type="button" onClick={saveFeatured}>{savedIds.includes(featured._id) ? "Saved to wishlist" : "Save for later"}</button>
              </div>
            </div>
          </div>
        ) : (
          <div className="empty-inline"><span>No upcoming events yet. Check back soon.</span><button type="button" className="text-button" onClick={() => notify("New experiences are on their way.")}>Notify me</button></div>
        )}
      </section>

      <section className="page-section home-upcoming">
        <div className="section-heading">
          <div><span className="eyebrow">PICKED FOR YOU</span><h2>Make a day of it.</h2></div>
          <Link className="text-link" to="/events">Explore the calendar <ArrowRight size={16} /></Link>
        </div>
        {loading ? <EventSkeletons /> : (
          <div className="event-grid">
            {events.slice(0, 3).map((event) => (
              <EventCard key={event._id} event={event} saved={savedIds.includes(event._id)} onToggleSave={toggleSaved} />
            ))}
          </div>
        )}
      </section>
      <section className="organizer-strip">
        <div><span className="eyebrow">FOR THE PEOPLE WHO MAKE IT HAPPEN</span><h2>Bring your next idea to life.</h2><p>Make it easy for your people to find you, show up, and bring a friend.</p></div>
        <Link className="button button-outline" to="/login">Organizer sign in <ArrowRight size={16} /></Link>
      </section>
    </>
  );
}

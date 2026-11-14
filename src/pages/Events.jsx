import { CalendarDays, Search, SlidersHorizontal, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import EventCard from "../components/EventCard.jsx";
import { EventSkeletons } from "../components/Loader.jsx";
import { useWishlist } from "../hooks/useWishlist.js";
import api, { getErrorMessage } from "../services/api.js";
import { formatPrice } from "../utils/formatPrice.js";
import { normalizeEvent } from "../utils/normalizeEvent.js";

const categories = ["All", "Music", "Tech", "Food", "Art", "Sports", "Wedding", "Comedy", "Workshop"];

function isInDateRange(dateValue, dateFilter, now = new Date()) {
  if (dateFilter === "all") return true;
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return false;

  if (dateFilter === "month") {
    return date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth();
  }

  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const daysUntilSaturday = (6 - today.getDay() + 7) % 7;
  const saturday = new Date(today);
  saturday.setDate(today.getDate() + (today.getDay() === 0 ? -1 : daysUntilSaturday));
  const mondayAfter = new Date(saturday);
  mondayAfter.setDate(saturday.getDate() + 2);
  return date >= saturday && date < mondayAfter;
}

// Browse, search, filter, and sort upcoming Eventrix listings.
export default function Events() {
  const [events, setEvents] = useState([]);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [dateFilter, setDateFilter] = useState("all");
  const [priceFloor, setPriceFloor] = useState(0);
  const [priceCeiling, setPriceCeiling] = useState(null);
  const [sort, setSort] = useState("date");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);
  const { savedIds, toggleSaved } = useWishlist();

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError("");
    api.get("/events")
      .then(({ data }) => {
        if (active) setEvents(data.data.map(normalizeEvent));
      })
      .catch((requestError) => {
        if (active) setError(getErrorMessage(requestError));
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, [reloadKey]);

  const maximumPrice = Math.max(100, Math.ceil(Math.max(0, ...events.map((event) => Number(event.price) || 0)) / 100) * 100);
  const selectedPriceLimit = Math.max(priceFloor, Math.min(priceCeiling ?? maximumPrice, maximumPrice));
  const visibleEvents = useMemo(() => {
    const query = search.trim().toLocaleLowerCase();
    return events
      .filter((event) => category === "All" || event.category === category)
      .filter((event) => !query || event.title.toLocaleLowerCase().includes(query))
      .filter((event) => Number(event.price) >= priceFloor && Number(event.price) <= selectedPriceLimit)
      .filter((event) => isInDateRange(event.date, dateFilter))
      .sort((left, right) => {
        if (sort === "priceAsc") return left.price - right.price;
        if (sort === "priceDesc") return right.price - left.price;
        return new Date(left.date).getTime() - new Date(right.date).getTime();
      });
  }, [events, search, category, priceFloor, selectedPriceLimit, dateFilter, sort]);

  function clearFilters() {
    setSearch("");
    setCategory("All");
    setDateFilter("all");
    setPriceFloor(0);
    setPriceCeiling(null);
    setSort("date");
  }

  return (
    <div className="page-wrap">
      <section className="page-intro">
        <span className="eyebrow">THE EVENT CALENDAR</span>
        <h1>Find your <span>next thing.</span></h1>
        <p>Good music, fresh ideas, and the kind of plans you will be glad you made.</p>
      </section>
      <div className="event-tools">
        <label className="search-field">
          <Search size={18} />
          <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search experiences..." aria-label="Search events by title" />
          {search && <button className="icon-button" type="button" onClick={() => setSearch("")} aria-label="Clear search"><X size={16} /></button>}
        </label>
        <label className="sort-field"><SlidersHorizontal size={16} /><span className="sr-only">Sort events</span>
          <select value={sort} onChange={(event) => setSort(event.target.value)}>
            <option value="date">Soonest first</option>
            <option value="priceAsc">Price Low-High</option>
            <option value="priceDesc">Price High-Low</option>
          </select>
        </label>
      </div>
      <div className="category-row" aria-label="Filter by event category">
        {categories.map((item) => (
          <button key={item} type="button" className={`filter-chip ${category === item ? "active" : ""}`} onClick={() => setCategory(item)}>{item}</button>
        ))}
      </div>
      <div className="smart-filter-row">
        <label className="date-filter-field">
          <CalendarDays size={16} />
          <span>Date</span>
          <select value={dateFilter} onChange={(event) => setDateFilter(event.target.value)} aria-label="Filter by date">
            <option value="all">Any date</option>
            <option value="weekend">This Weekend</option>
            <option value="month">This Month</option>
          </select>
        </label>
        <label className="price-filter-field">
          <span>{formatPrice(priceFloor)} – {formatPrice(selectedPriceLimit)}</span>
          <span className="price-range-inputs">
            <input
              type="range"
              min="0"
              max={maximumPrice}
              step="100"
              value={priceFloor}
              onChange={(event) => setPriceFloor(Math.min(Number(event.target.value), selectedPriceLimit))}
              aria-label="Minimum event price in rupees"
            />
            <input
              type="range"
              min="0"
              max={maximumPrice}
              step="100"
              value={selectedPriceLimit}
              onChange={(event) => setPriceCeiling(Math.max(Number(event.target.value), priceFloor))}
              aria-label="Maximum event price in rupees"
            />
          </span>
        </label>
      </div>
      <div className="results-caption"><span>{loading ? "Finding your next plan..." : `${visibleEvents.length} ${visibleEvents.length === 1 ? "experience" : "experiences"} to explore`}</span></div>
      {loading ? <EventSkeletons count={6} /> : error ? (
        <div className="error-state"><p>{error}</p><button className="button button-outline" type="button" onClick={() => setReloadKey((key) => key + 1)}>Try again</button></div>
      ) : visibleEvents.length ? (
        <div className="event-grid">
          {visibleEvents.map((event) => <EventCard key={event._id} event={event} saved={savedIds.includes(event._id)} onToggleSave={toggleSaved} />)}
        </div>
      ) : (
        <div className="empty-state">
          <span className="empty-icon"><CalendarDays size={23} /></span>
          <h3>Nothing matches those filters.</h3>
          <p>Try a different search, date, category, or price range.</p>
          <button className="button button-outline" type="button" onClick={clearFilters}>Clear filters</button>
        </div>
      )}
    </div>
  );
}

import { ArrowLeft, ImagePlus, Save } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Loader } from "../components/Loader.jsx";
import { useToast } from "../context/ToastContext.jsx";
import api, { getErrorMessage } from "../services/api.js";
import { eventImagePresets, getEventImage } from "../utils/eventImages.js";

const emptyForm = {
  title: "",
  description: "",
  category: "Music",
  date: "",
  venue: "",
  price: "",
  totalSeats: "",
  seatsPerRow: "10",
  imageUrl: ""
};

function toLocalDateTimeValue(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return new Date(date.getTime() - date.getTimezoneOffset() * 60_000).toISOString().slice(0, 16);
}

// Create or edit an event after validating all required event details.
export default function CreateEvent() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { notify } = useToast();
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState({});
  const [imagePreviewError, setImagePreviewError] = useState(false);
  const [loading, setLoading] = useState(Boolean(id));
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!id) return;
    api.get(`/events/${id}`)
      .then(({ data }) => {
        const event = data.data;
        setForm({
          title: event.title,
          description: event.description,
          category: event.category,
          date: toLocalDateTimeValue(event.date),
          venue: event.venue,
          price: String(event.price),
          totalSeats: String(event.totalSeats),
          seatsPerRow: String(event.seatsPerRow || 10),
          imageUrl: event.imageUrl || getEventImage(event.category)
        });
      })
      .catch((error) => notify(getErrorMessage(error), "error"))
      .finally(() => setLoading(false));
  }, [id]);

  function validate() {
    const nextErrors = {};
    if (form.title.trim().length < 3) nextErrors.title = "Use at least 3 characters for the event title.";
    if (form.description.trim().length < 10) nextErrors.description = "Add at least 10 characters about the experience.";
    if (!form.venue.trim()) nextErrors.venue = "Enter the event venue.";
    if (!form.date || new Date(form.date) <= new Date()) nextErrors.date = "Choose a future date and time.";
    if (form.price === "" || Number(form.price) < 0) nextErrors.price = "Enter a price of zero or more.";
    if (!Number.isInteger(Number(form.totalSeats)) || Number(form.totalSeats) < 1) nextErrors.totalSeats = "Enter at least one available seat.";
    if (!Number.isInteger(Number(form.seatsPerRow)) || Number(form.seatsPerRow) < 1 || Number(form.seatsPerRow) > 50) nextErrors.seatsPerRow = "Enter between 1 and 50 seats per row.";
    if (!/^https?:\/\/.+/i.test(form.imageUrl.trim())) nextErrors.imageUrl = "Choose a preset or enter a complete image URL.";
    else if (imagePreviewError) nextErrors.imageUrl = "The selected image could not be loaded. Choose another image.";
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  function updateField(event) {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
    if (event.target.name === "imageUrl") setImagePreviewError(false);
  }

  function chooseImage(url) {
    setForm((current) => ({ ...current, imageUrl: url }));
    setImagePreviewError(false);
  }

  async function submit(event) {
    event.preventDefault();
    if (!validate()) return;
    setBusy(true);
    const eventData = {
      ...form,
      price: Number(form.price),
      totalSeats: Number(form.totalSeats),
      seatsPerRow: Number(form.seatsPerRow),
      imageUrl: form.imageUrl.trim(),
      date: new Date(form.date).toISOString()
    };
    try {
      if (id) await api.patch(`/events/${id}`, eventData);
      else await api.post("/events", eventData);
      notify(id ? "Your event details are updated." : "Your event is on the calendar.");
      navigate("/organizer");
    } catch (requestError) {
      notify(getErrorMessage(requestError), "error");
    } finally {
      setBusy(false);
    }
  }

  if (loading) return <Loader label="Loading event details..." />;

  return (
    <div className="page-wrap create-page">
      <Link to="/organizer" className="back-link"><ArrowLeft size={16} /> Back to dashboard</Link>
      <div className="form-page-heading"><span className="eyebrow">MAKE IT HAPPEN</span><h1>{id ? "Edit your event." : "Put something good on."}</h1><p>Give people the details they need to say yes.</p></div>
      <form className="event-form" onSubmit={submit} noValidate>
        <div className="form-section-title"><span>01</span><div><h2>The basics</h2><p>Start with the details people will remember.</p></div></div>
        <label className="form-field">Event title
          <input name="title" value={form.title} onChange={updateField} maxLength="100" placeholder="e.g. Rooftop Sessions: Summer Edition" aria-invalid={Boolean(errors.title)} />
          {errors.title && <small className="field-error">{errors.title}</small>}
        </label>
        <label className="form-field">Description
          <textarea name="description" rows="5" maxLength="2000" value={form.description} onChange={updateField} placeholder="What makes this experience worth showing up for?" aria-invalid={Boolean(errors.description)} />
          <span className="field-hint">{form.description.length}/2000 characters</span>
          {errors.description && <small className="field-error">{errors.description}</small>}
        </label>
        <div className="form-row">
          <label className="form-field">Category
            <select name="category" value={form.category} onChange={updateField}>
              <option>Music</option><option>Tech</option><option>Food</option><option>Art</option><option>Sports</option><option>Wedding</option><option>Comedy</option><option>Workshop</option>
            </select>
          </label>
          <label className="form-field">Cover image URL
            <input name="imageUrl" type="url" value={form.imageUrl} onChange={updateField} placeholder="https://example.com/image.jpg" aria-invalid={Boolean(errors.imageUrl)} />
            {errors.imageUrl && <small className="field-error">{errors.imageUrl}</small>}
          </label>
        </div>
        <div className="image-picker">
          <div className="image-picker-heading"><ImagePlus size={15} /><span>Choose an image</span><small>Pick a preset or paste your own URL.</small></div>
          <div className="image-presets">
            {eventImagePresets.map((image) => (
              <button
                className={`image-preset ${form.imageUrl === image.url ? "image-preset-active" : ""}`}
                key={image.url}
                type="button"
                onClick={() => chooseImage(image.url)}
                aria-label={`Use ${image.label} image`}
                aria-pressed={form.imageUrl === image.url}
              >
                <img src={image.url} alt="" loading="lazy" />
                <span>{image.label}</span>
              </button>
            ))}
          </div>
          <div className="image-live-preview">
            {imagePreviewError ? (
              <div className="image-preview-error" role="status">This image could not be loaded. Choose another preset or check the URL.</div>
            ) : (
              <img
                src={form.imageUrl || getEventImage(form.category)}
                alt="Event cover preview"
                onError={() => setImagePreviewError(true)}
                onLoad={() => setImagePreviewError(false)}
              />
            )}
          </div>
        </div>
        <div className="form-section-title section-spaced"><span>02</span><div><h2>When & where</h2><p>Help people put it on the calendar.</p></div></div>
        <div className="form-row">
          <label className="form-field">Date and time
            <input name="date" type="datetime-local" value={form.date} onChange={updateField} aria-invalid={Boolean(errors.date)} />
            {errors.date && <small className="field-error">{errors.date}</small>}
          </label>
          <label className="form-field">Venue
            <input name="venue" value={form.venue} onChange={updateField} placeholder="Venue name, City" aria-invalid={Boolean(errors.venue)} />
            {errors.venue && <small className="field-error">{errors.venue}</small>}
          </label>
        </div>
        <div className="form-section-title section-spaced"><span>03</span><div><h2>Tickets</h2><p>Set the ticket price and how many spots are available.</p></div></div>
        <div className="form-row">
          <label className="form-field">Price per person (INR)
            <input name="price" type="number" min="0" step="1" value={form.price} onChange={updateField} placeholder="1499" aria-invalid={Boolean(errors.price)} />
            {errors.price && <small className="field-error">{errors.price}</small>}
          </label>
          <label className="form-field">Total seats
            <input name="totalSeats" type="number" min="1" step="1" value={form.totalSeats} onChange={updateField} placeholder="100" aria-invalid={Boolean(errors.totalSeats)} />
            {errors.totalSeats && <small className="field-error">{errors.totalSeats}</small>}
          </label>
          <label className="form-field">Seats per row
            <input name="seatsPerRow" type="number" min="1" max="50" step="1" value={form.seatsPerRow} onChange={updateField} placeholder="10" aria-invalid={Boolean(errors.seatsPerRow)} />
            {errors.seatsPerRow && <small className="field-error">{errors.seatsPerRow}</small>}
          </label>
        </div>
        <div className="form-actions"><Link className="button button-quiet" to="/organizer">Cancel</Link><button className="button button-primary" disabled={busy}><Save size={16} /> {busy ? "Saving event..." : id ? "Save changes" : "Publish event"}</button></div>
      </form>
    </div>
  );
}

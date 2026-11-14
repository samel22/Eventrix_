import { MessageSquare, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { useToast } from "../context/ToastContext.jsx";
import api, { getErrorMessage } from "../services/api.js";
import { RatingPicker, RatingStars } from "./RatingStars.jsx";

function formatReviewDate(value) {
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric"
  }).format(new Date(value));
}

export default function ReviewSection({ eventId, onSummaryChange }) {
  const { user } = useAuth();
  const { notify } = useToast();
  const [reviews, setReviews] = useState([]);
  const [myReview, setMyReview] = useState(null);
  const [canReview, setCanReview] = useState(false);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError("");
    const requests = [
      api.get(`/events/${eventId}/reviews`),
      user ? api.get(`/events/${eventId}/reviews/mine`) : Promise.resolve(null)
    ];
    Promise.allSettled(requests)
      .then(([reviewResult, eligibilityResult]) => {
        if (!active) return;
        if (reviewResult.status === "rejected") {
          setError(getErrorMessage(reviewResult.reason));
          return;
        }
        const currentReviews = reviewResult.value.data.data;
        setReviews(currentReviews);
        const eligibility = eligibilityResult.status === "fulfilled"
          ? eligibilityResult.value?.data.data
          : null;
        const ownReview = eligibility?.review || null;
        setCanReview(Boolean(eligibility?.canReview));
        setMyReview(ownReview);
        setRating(ownReview?.rating || 0);
        setComment(ownReview?.comment || "");
        if (eligibilityResult.status === "rejected") setError(getErrorMessage(eligibilityResult.reason));
        onSummaryChange?.(summarizeReviews(currentReviews));
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, [eventId, user, onSummaryChange]);

  async function submitReview(event) {
    event.preventDefault();
    if (!rating) {
      notify("Choose a star rating before submitting.", "error");
      return;
    }
    setSaving(true);
    try {
      const request = myReview
        ? api.patch(`/events/${eventId}/reviews/${myReview._id}`, { rating, comment })
        : api.post(`/events/${eventId}/reviews`, { rating, comment });
      const { data } = await request;
      const savedReview = data.data;
      setMyReview(savedReview);
      setCanReview(true);
      const nextReviews = reviews.some((review) => review._id === savedReview._id)
        ? reviews.map((review) => review._id === savedReview._id ? savedReview : review)
        : [savedReview, ...reviews];
      setReviews(nextReviews);
      onSummaryChange?.(summarizeReviews(nextReviews));
      notify(myReview ? "Review updated." : "Thanks for sharing your review.");
    } catch (requestError) {
      notify(getErrorMessage(requestError), "error");
    } finally {
      setSaving(false);
    }
  }

  async function deleteReview() {
    if (!myReview) return;
    setSaving(true);
    try {
      await api.delete(`/events/${eventId}/reviews/${myReview._id}`);
      const nextReviews = reviews.filter((review) => review._id !== myReview._id);
      setReviews(nextReviews);
      onSummaryChange?.(summarizeReviews(nextReviews));
      setMyReview(null);
      setRating(0);
      setComment("");
      setCanReview(false);
      notify("Review deleted.");
      try {
        const { data } = await api.get(`/events/${eventId}/reviews/mine`);
        setCanReview(Boolean(data.data.canReview));
      } catch (requestError) {
        notify(getErrorMessage(requestError), "error");
      }
    } catch (requestError) {
      notify(getErrorMessage(requestError), "error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="reviews-section" aria-labelledby="reviews-title">
      <div className="reviews-heading">
        <div><span className="eyebrow">ATTENDEE NOTES</span><h2 id="reviews-title">Reviews</h2></div>
        <span className="review-count">{reviews.length} {reviews.length === 1 ? "review" : "reviews"}</span>
      </div>
      {loading ? <p className="muted-text">Loading reviews...</p> : error ? (
        <>
          <div className="inline-error" role="alert">{error}</div>
          {reviews.length > 0 && <div className="review-list">{reviews.map((review) => (
            <article className="review-card" key={review._id}>
              <div className="review-card-heading"><strong>{review.user?.name || "Eventrix attendee"}</strong><RatingStars rating={review.rating} /><time dateTime={review.createdAt}>{formatReviewDate(review.createdAt)}</time></div>
              <p>{review.comment}</p>
            </article>
          ))}</div>}
        </>
      ) : (
        <>
          {reviews.length ? (
            <div className="review-list">
              {reviews.map((review) => (
                <article className="review-card" key={review._id}>
                  <div className="review-card-heading">
                    <strong>{review.user?.name || "Eventrix attendee"}</strong>
                    <RatingStars rating={review.rating} />
                    <time dateTime={review.createdAt}>{formatReviewDate(review.createdAt)}</time>
                  </div>
                  <p>{review.comment}</p>
                </article>
              ))}
            </div>
          ) : <p className="reviews-empty"><MessageSquare size={16} /> No reviews yet. Be the first to share your experience.</p>}

          {canReview ? (
            <form className="review-form" onSubmit={submitReview}>
              <h3>{myReview ? "Edit your review" : "Leave a review"}</h3>
              <RatingPicker value={rating} onChange={setRating} />
              <label className="form-field">Your experience
                <textarea value={comment} onChange={(event) => setComment(event.target.value)} maxLength="2000" rows="4" placeholder="What should other attendees know?" required />
              </label>
              <div className="review-form-actions">
                <button className="button button-primary button-small" type="submit" disabled={saving || !comment.trim()}>
                  {saving ? "Saving..." : myReview ? "Update review" : "Post review"}
                </button>
                {myReview && <button className="text-button danger-text" type="button" onClick={deleteReview} disabled={saving}><Trash2 size={14} /> Delete review</button>}
              </div>
            </form>
          ) : (
            <p className="review-eligibility">
              {user ? "Book this event to leave a review." : <> <Link to="/login">Sign in</Link> and book this event to leave a review.</>}
            </p>
          )}
        </>
      )}
    </section>
  );
}

function summarizeReviews(reviews) {
  const ratingTotal = reviews.reduce((total, review) => total + review.rating, 0);
  return {
    averageRating: reviews.length ? ratingTotal / reviews.length : 0,
    reviewCount: reviews.length
  };
}

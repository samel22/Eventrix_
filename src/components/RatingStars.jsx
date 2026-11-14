import { Star } from "lucide-react";

export function RatingStars({ rating = 0, size = 14 }) {
  return (
    <span className="rating-stars" aria-label={`${Number(rating).toFixed(1)} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((star) => (
        <Star key={star} size={size} fill={star <= Math.round(rating) ? "currentColor" : "none"} />
      ))}
    </span>
  );
}

export function RatingPicker({ value, onChange }) {
  return (
    <div className="rating-picker" role="group" aria-label="Choose a rating">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          className="rating-picker-star"
          aria-label={`${star} star${star === 1 ? "" : "s"}`}
          aria-pressed={value === star}
          onClick={() => onChange(star)}
        >
          <Star size={23} fill={star <= value ? "currentColor" : "none"} />
        </button>
      ))}
    </div>
  );
}

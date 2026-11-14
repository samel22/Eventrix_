import Booking from "../models/Booking.js";
import Event from "../models/Event.js";
import Review from "../models/Review.js";

export async function listReviews(req, res, next) {
  try {
    const event = await Event.exists({ _id: req.params.id });
    if (!event) return res.status(404).json({ success: false, message: "Event not found." });

    const reviews = await Review.find({ event: req.params.id })
      .populate("user", "name")
      .sort({ createdAt: -1 });
    return res.json({ success: true, data: reviews });
  } catch (error) {
    return next(error);
  }
}

export async function getReviewEligibility(req, res, next) {
  try {
    const event = await Event.exists({ _id: req.params.id });
    if (!event) return res.status(404).json({ success: false, message: "Event not found." });

    const [review, confirmedBooking] = await Promise.all([
      Review.findOne({ event: req.params.id, user: req.user.id }),
      Booking.exists({ event: req.params.id, user: req.user.id, status: "confirmed" })
    ]);
    return res.json({
      success: true,
      data: { canReview: Boolean(confirmedBooking || review), review }
    });
  } catch (error) {
    return next(error);
  }
}

export async function createReview(req, res, next) {
  try {
    const rating = Number(req.body.rating);
    const comment = typeof req.body.comment === "string" ? req.body.comment.trim() : "";
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      return res.status(400).json({ success: false, message: "Choose a rating from 1 to 5 stars." });
    }
    if (!comment || comment.length > 2000) {
      return res.status(400).json({ success: false, message: "Write a comment of up to 2,000 characters." });
    }

    const event = await Event.exists({ _id: req.params.id });
    if (!event) return res.status(404).json({ success: false, message: "Event not found." });
    const confirmedBooking = await Booking.exists({
      event: req.params.id,
      user: req.user.id,
      status: "confirmed"
    });
    if (!confirmedBooking) {
      return res.status(403).json({ success: false, message: "Book this event to leave a review." });
    }

    const review = await Review.create({
      user: req.user.id,
      event: req.params.id,
      rating,
      comment
    });
    await review.populate("user", "name");
    return res.status(201).json({ success: true, data: review });
  } catch (error) {
    return next(error);
  }
}

export async function updateReview(req, res, next) {
  try {
    const rating = Number(req.body.rating);
    const comment = typeof req.body.comment === "string" ? req.body.comment.trim() : "";
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      return res.status(400).json({ success: false, message: "Choose a rating from 1 to 5 stars." });
    }
    if (!comment || comment.length > 2000) {
      return res.status(400).json({ success: false, message: "Write a comment of up to 2,000 characters." });
    }

    const review = await Review.findOneAndUpdate(
      { _id: req.params.reviewId, event: req.params.id, user: req.user.id },
      { $set: { rating, comment } },
      { new: true, runValidators: true }
    ).populate("user", "name");
    if (!review) return res.status(404).json({ success: false, message: "Your review was not found." });
    return res.json({ success: true, data: review });
  } catch (error) {
    return next(error);
  }
}

export async function deleteReview(req, res, next) {
  try {
    const review = await Review.findOneAndDelete({
      _id: req.params.reviewId,
      event: req.params.id,
      user: req.user.id
    });
    if (!review) return res.status(404).json({ success: false, message: "Your review was not found." });
    return res.json({ success: true, message: "Review deleted." });
  } catch (error) {
    return next(error);
  }
}

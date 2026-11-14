import { Router } from "express";
import {
  createEvent,
  deleteEvent,
  getAnalytics,
  getAttendees,
  getEvent,
  getMyEvents,
  listEvents,
  toggleWishlist,
  updateEvent
} from "../controllers/eventController.js";
import {
  createReview,
  deleteReview,
  getReviewEligibility,
  listReviews,
  updateReview
} from "../controllers/reviewController.js";
import { requireAuth, requireOrganizer } from "../middleware/authMiddleware.js";

const router = Router();

router.get("/", listEvents);
router.get("/mine", requireAuth, requireOrganizer, getMyEvents);
router.get("/analytics", requireAuth, requireOrganizer, getAnalytics);
router.get("/:id/attendees", requireAuth, requireOrganizer, getAttendees);
router.get("/:id/reviews/mine", requireAuth, getReviewEligibility);
router.get("/:id/reviews", listReviews);
router.post("/:id/reviews", requireAuth, createReview);
router.patch("/:id/reviews/:reviewId", requireAuth, updateReview);
router.delete("/:id/reviews/:reviewId", requireAuth, deleteReview);
router.post("/", requireAuth, requireOrganizer, createEvent);
router.patch("/:id", requireAuth, requireOrganizer, updateEvent);
router.delete("/:id", requireAuth, requireOrganizer, deleteEvent);
router.post("/:id/wishlist", requireAuth, toggleWishlist);
router.get("/:id", getEvent);

export default router;

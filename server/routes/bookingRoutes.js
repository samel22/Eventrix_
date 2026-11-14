import { Router } from "express";
import {
  cancelBooking,
  createBooking,
  getBookingPass,
  getMyBookings
} from "../controllers/bookingController.js";
import { requireAuth } from "../middleware/authMiddleware.js";

const router = Router();

router.use(requireAuth);
router.get("/my-bookings", getMyBookings);
router.get("/mine", getMyBookings);
router.post("/events/:eventId", createBooking);
router.get("/:id/pass", getBookingPass);
router.delete("/:id", cancelBooking);
router.patch("/:id/cancel", cancelBooking);

export default router;

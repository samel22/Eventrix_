import crypto from "node:crypto";
import Booking from "../models/Booking.js";
import Event from "../models/Event.js";
import { createSeatIds } from "../utils/seatMap.js";

// Create a unique, readable ticket code for a confirmed booking.
function createBookingCode() {
  return `EV-${crypto.randomBytes(4).toString("hex").toUpperCase()}`;
}

// Reserve seats with one atomic database update to prevent overselling.
export async function createBooking(req, res, next) {
  try {
    const seatIds = req.body.seatIds;
    if (!Array.isArray(seatIds) || seatIds.length < 1 || seatIds.some((seatId) => typeof seatId !== "string") ||
      new Set(seatIds).size !== seatIds.length) {
      return res.status(400).json({ success: false, message: "Select one or more different seats." });
    }
    const quantity = seatIds.length;

    const now = new Date();
    const currentEvent = await Event.findById(req.params.eventId).select("date seatsAvailable totalSeats seatsPerRow bookedSeats");
    if (!currentEvent) {
      return res.status(404).json({ success: false, message: "Event not found." });
    }
    const validSeats = new Set(createSeatIds(currentEvent.totalSeats, currentEvent.seatsPerRow || 10));
    if (seatIds.some((seatId) => !validSeats.has(seatId))) {
      return res.status(400).json({ success: false, message: "One or more selected seats are invalid." });
    }

    const event = await Event.findOneAndUpdate(
      {
        _id: req.params.eventId,
        seatsAvailable: { $gte: quantity },
        date: { $gt: now },
        bookedSeats: { $nin: seatIds }
      },
      {
        $inc: { seatsAvailable: -quantity },
        $addToSet: { bookedSeats: { $each: seatIds } }
      },
      { new: true }
    );
    if (!event) {
      const latestEvent = await Event.findById(req.params.eventId)
        .select("date seatsAvailable totalSeats seatsPerRow bookedSeats");
      if (!latestEvent) {
        return res.status(404).json({ success: false, message: "Event not found." });
      }
      if (latestEvent.date.getTime() <= now.getTime()) {
        return res.status(409).json({ success: false, message: "This event has passed." });
      }
      const latestValidSeats = new Set(createSeatIds(latestEvent.totalSeats, latestEvent.seatsPerRow || 10));
      if (seatIds.some((seatId) => !latestValidSeats.has(seatId))) {
        return res.status(409).json({ success: false, message: "The seat layout changed. Refresh and choose your seats again." });
      }
      if (seatIds.some((seatId) => latestEvent.bookedSeats.includes(seatId))) {
        return res.status(409).json({ success: false, message: "Seat already taken" });
      }
      return res.status(409).json({ success: false, message: "Not enough seats are available for this booking." });
    }

    try {
      const booking = await Booking.create({
        event: event.id,
        user: req.user.id,
        quantity,
        seatIds,
        ticketType: req.body.ticketType || "General Admission",
        totalPrice: event.price * quantity,
        bookingCode: createBookingCode()
      });
      await booking.populate("event", "title description category date venue imageUrl price seatsAvailable totalSeats seatsPerRow bookedSeats");
      return res.status(201).json({ success: true, data: booking });
    } catch (error) {
      await Event.updateOne(
        { _id: event.id },
        { $inc: { seatsAvailable: quantity }, $pullAll: { bookedSeats: seatIds } }
      );
      throw error;
    }
  } catch (error) {
    return next(error);
  }
}

// List the current user's bookings with event details.
export async function getMyBookings(req, res, next) {
  try {
    const bookings = await Booking.find({ user: req.user.id })
      .populate("event", "title description category date venue imageUrl price seatsAvailable totalSeats seatsPerRow bookedSeats")
      .sort({ createdAt: -1 });
    return res.json({ success: true, data: bookings });
  } catch (error) {
    return next(error);
  }
}

// Cancel a ticket once and return its reserved seats to the event.
export async function cancelBooking(req, res, next) {
  try {
    const booking = await Booking.findOneAndUpdate(
      { _id: req.params.id, user: req.user.id, status: "confirmed" },
      { $set: { status: "cancelled" } },
      { new: true }
    );
    if (!booking) {
      return res.status(404).json({ success: false, message: "Active booking not found." });
    }

    let event;
    try {
      event = await Event.findByIdAndUpdate(
        booking.event,
        {
          $inc: { seatsAvailable: booking.quantity },
          $pullAll: { bookedSeats: booking.seatIds || [] }
        },
        { new: true }
      );
    } catch (error) {
      await Booking.updateOne(
        { _id: booking._id, status: "cancelled" },
        { $set: { status: "confirmed" } }
      );
      throw error;
    }
    if (!event) {
      await Booking.updateOne(
        { _id: booking._id, status: "cancelled" },
        { $set: { status: "confirmed" } }
      );
      return res.status(409).json({ success: false, message: "The event was removed; contact the organizer about your refund." });
    }
    await booking.populate("event", "title description category date venue imageUrl price seatsAvailable totalSeats seatsPerRow bookedSeats");
    return res.json({ success: true, data: booking });
  } catch (error) {
    return next(error);
  }
}

// Find one booking pass while ensuring it belongs to the signed-in user.
export async function getBookingPass(req, res, next) {
  try {
    const booking = await Booking.findOne({ _id: req.params.id, user: req.user.id })
      .populate("event", "title description category date venue imageUrl price seatsAvailable totalSeats seatsPerRow bookedSeats organizer");
    if (!booking) return res.status(404).json({ success: false, message: "Booking pass not found." });
    return res.json({ success: true, data: booking });
  } catch (error) {
    return next(error);
  }
}

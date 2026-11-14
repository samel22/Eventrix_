import Booking from "../models/Booking.js";
import Event from "../models/Event.js";
import Review from "../models/Review.js";
import User from "../models/User.js";
import { createSeatIds } from "../utils/seatMap.js";

const eventFields = ["title", "description", "category", "date", "venue", "price", "totalSeats", "seatsPerRow", "imageUrl"];

async function addReviewSummaries(events) {
  if (!events.length) return [];
  const summaries = await Review.aggregate([
    { $match: { event: { $in: events.map((event) => event._id) } } },
    { $group: { _id: "$event", averageRating: { $avg: "$rating" }, reviewCount: { $sum: 1 } } }
  ]);
  const summaryByEvent = new Map(summaries.map((summary) => [String(summary._id), summary]));
  return events.map((event) => {
    const plainEvent = event.toObject();
    const summary = summaryByEvent.get(String(event._id));
    return {
      ...plainEvent,
      averageRating: summary?.averageRating || 0,
      reviewCount: summary?.reviewCount || 0
    };
  });
}

// Copy only editable event fields from the request body.
function getEventInput(body) {
  return Object.fromEntries(eventFields
    .filter((field) => body[field] !== undefined)
    .map((field) => [field, body[field]]));
}

// List events with optional search, category, price, and date filters.
export async function listEvents(req, res, next) {
  try {
    const filter = {};
    if (req.query.category && req.query.category !== "All") filter.category = req.query.category;
    if (req.query.search) filter.title = { $regex: req.query.search, $options: "i" };
    if (req.query.upcoming !== "false") filter.date = { $gte: new Date() };

    const sortOptions = {
      date: { date: 1 },
      priceAsc: { price: 1 },
      priceDesc: { price: -1 }
    };
    const sort = sortOptions[req.query.sort] || { date: 1 };
    const events = await Event.find(filter).populate("organizer", "name").sort(sort);
    return res.json({ success: true, data: await addReviewSummaries(events) });
  } catch (error) {
    return next(error);
  }
}

// Return one event and its organizer for the details page.
export async function getEvent(req, res, next) {
  try {
    const event = await Event.findById(req.params.id).populate("organizer", "name");
    if (!event) return res.status(404).json({ success: false, message: "Event not found." });
    const [enrichedEvent] = await addReviewSummaries([event]);
    return res.json({ success: true, data: enrichedEvent });
  } catch (error) {
    return next(error);
  }
}

// Add a new event owned by the signed-in organizer.
export async function createEvent(req, res, next) {
  try {
    const input = getEventInput(req.body);
    if (typeof input.imageUrl !== "string" || !input.imageUrl.trim()) {
      return res.status(400).json({ success: false, message: "Choose an event image before publishing." });
    }
    input.totalSeats = Number(input.totalSeats);
    input.seatsPerRow = Number(input.seatsPerRow ?? 10);
    if (!Number.isInteger(input.totalSeats) || input.totalSeats < 1 ||
      !Number.isInteger(input.seatsPerRow) || input.seatsPerRow < 1 || input.seatsPerRow > 50) {
      return res.status(400).json({ success: false, message: "Enter a valid capacity and between 1 and 50 seats per row." });
    }
    if (await Event.exists({ imageUrl: input.imageUrl.trim() })) {
      return res.status(409).json({ success: false, message: "Each event needs a different cover image." });
    }
    input.imageUrl = input.imageUrl.trim();
    input.seatsAvailable = input.totalSeats;
    const event = await Event.create({ ...input, organizer: req.user.id });
    return res.status(201).json({ success: true, data: event });
  } catch (error) {
    return next(error);
  }
}

// Update an organizer's event without allowing its ticket count below seats sold.
export async function updateEvent(req, res, next) {
  try {
    const event = await Event.findOne({ _id: req.params.id, organizer: req.user.id });
    if (!event) return res.status(404).json({ success: false, message: "Event not found." });

    const input = getEventInput(req.body);
    if (input.imageUrl !== undefined) {
      if (typeof input.imageUrl !== "string") {
        return res.status(400).json({ success: false, message: "Choose a valid event image URL." });
      }
      input.imageUrl = input.imageUrl.trim();
      if (!input.imageUrl) {
        return res.status(400).json({ success: false, message: "Choose an event image before saving." });
      }
      if (await Event.exists({ _id: { $ne: event._id }, imageUrl: input.imageUrl })) {
        return res.status(409).json({ success: false, message: "Each event needs a different cover image." });
      }
    }
    const nextTotalSeats = Number(input.totalSeats ?? event.totalSeats);
    const nextSeatsPerRow = Number(input.seatsPerRow ?? event.seatsPerRow ?? 10);
    if (!Number.isInteger(nextTotalSeats) || nextTotalSeats < 1 ||
      !Number.isInteger(nextSeatsPerRow) || nextSeatsPerRow < 1 || nextSeatsPerRow > 50) {
      return res.status(400).json({ success: false, message: "Enter a valid capacity and between 1 and 50 seats per row." });
    }
    const seatsSold = event.totalSeats - event.seatsAvailable;
    if (nextTotalSeats < seatsSold) {
      return res.status(400).json({ success: false, message: `Total seats cannot be less than ${seatsSold} tickets already sold.` });
    }
    const validSeats = new Set(createSeatIds(nextTotalSeats, nextSeatsPerRow));
    if (event.bookedSeats.some((seatId) => !validSeats.has(seatId))) {
      return res.status(400).json({ success: false, message: "Capacity or seats per row cannot remove seats that are already booked." });
    }
    if (input.totalSeats !== undefined) {
      event.seatsAvailable = nextTotalSeats - seatsSold;
    }
    if (input.seatsPerRow !== undefined) input.seatsPerRow = nextSeatsPerRow;

    Object.assign(event, input);
    await event.save();
    return res.json({ success: true, data: event });
  } catch (error) {
    return next(error);
  }
}

// Delete an event only when it has no confirmed bookings.
export async function deleteEvent(req, res, next) {
  try {
    const event = await Event.findOne({ _id: req.params.id, organizer: req.user.id });
    if (!event) return res.status(404).json({ success: false, message: "Event not found." });

    const hasBookings = await Booking.exists({ event: event.id, status: "confirmed" });
    if (hasBookings) {
      return res.status(409).json({ success: false, message: "Cancel confirmed bookings before deleting this event." });
    }
    await Review.deleteMany({ event: event.id });
    await event.deleteOne();
    return res.json({ success: true, message: "Event deleted." });
  } catch (error) {
    return next(error);
  }
}

// Return events created by the current organizer.
export async function getMyEvents(req, res, next) {
  try {
    const events = await Event.find({ organizer: req.user.id }).sort({ date: 1 });
    return res.json({ success: true, data: events });
  } catch (error) {
    return next(error);
  }
}

// Return event totals, booking revenue, seats sold, and recent event sales.
export async function getAnalytics(req, res, next) {
  try {
    const events = await Event.find({ organizer: req.user.id }).select("_id title totalSeats seatsAvailable");
    const eventIds = events.map((event) => event._id);
    const bookings = await Booking.find({ event: { $in: eventIds }, status: "confirmed" })
      .select("event totalPrice quantity");

    const statsByEvent = new Map(events.map((event) => [
      String(event._id),
      { title: event.title, revenue: 0, seatsSold: 0 }
    ]));
    for (const booking of bookings) {
      const stats = statsByEvent.get(String(booking.event));
      if (stats) {
        stats.revenue += booking.totalPrice;
        stats.seatsSold += booking.quantity;
      }
    }

    const eventStats = [...statsByEvent.values()];
    const analytics = {
      totalEvents: events.length,
      totalBookings: bookings.length,
      totalRevenue: bookings.reduce((sum, booking) => sum + booking.totalPrice, 0),
      seatsSold: bookings.reduce((sum, booking) => sum + booking.quantity, 0),
      events: eventStats.slice(0, 6)
    };
    return res.json({ success: true, data: analytics });
  } catch (error) {
    return next(error);
  }
}

// Return confirmed ticket holders for an event owned by this organizer.
export async function getAttendees(req, res, next) {
  try {
    const event = await Event.findOne({ _id: req.params.id, organizer: req.user.id });
    if (!event) return res.status(404).json({ success: false, message: "Event not found." });

    const attendees = await Booking.find({ event: event.id, status: "confirmed" })
      .populate("user", "name email")
      .sort({ createdAt: -1 });
    return res.json({ success: true, data: attendees });
  } catch (error) {
    return next(error);
  }
}

// Save or remove an event from the current user's wishlist.
export async function toggleWishlist(req, res, next) {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ success: false, message: "Event not found." });

    const user = await User.findById(req.user.id);
    const alreadySaved = user.savedEvents.some((id) => String(id) === String(event.id));
    const shouldSave = typeof req.body.saved === "boolean" ? req.body.saved : !alreadySaved;
    if (shouldSave) user.savedEvents.addToSet(event.id);
    else user.savedEvents.pull(event.id);
    await user.save();

    return res.json({
      success: true,
      data: { saved: shouldSave, savedEvents: user.savedEvents }
    });
  } catch (error) {
    return next(error);
  }
}

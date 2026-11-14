import mongoose from "mongoose";

const eventSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 100 },
    description: { type: String, required: true, trim: true, maxlength: 2000 },
    category: {
      type: String,
      required: true,
      enum: ["Music", "Tech", "Food", "Art", "Sports", "Wedding", "Comedy", "Workshop"]
    },
    date: { type: Date, required: true },
    venue: { type: String, required: true, trim: true, maxlength: 160 },
    price: { type: Number, required: true, min: 0 },
    totalSeats: { type: Number, required: true, min: 1 },
    seatsPerRow: { type: Number, required: true, min: 1, max: 50, default: 10 },
    seatsAvailable: { type: Number, required: true, min: 0 },
    bookedSeats: { type: [String], default: [] },
    imageUrl: { type: String, required: true, trim: true },
    organizer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    }
  },
  { timestamps: true }
);

const Event = mongoose.model("Event", eventSchema);
export default Event;

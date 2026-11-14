import mongoose from "mongoose";

const bookingSchema = new mongoose.Schema(
  {
    event: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Event",
      required: true
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    quantity: { type: Number, required: true, min: 1 },
    seatIds: { type: [String], default: [] },
    ticketType: { type: String, required: true, default: "General Admission" },
    totalPrice: { type: Number, required: true, min: 0 },
    bookingCode: { type: String, required: true, unique: true },
    status: { type: String, enum: ["confirmed", "cancelled"], default: "confirmed" }
  },
  { timestamps: true }
);

const Booking = mongoose.model("Booking", bookingSchema);
export default Booking;

import mongoose from "mongoose";

const reviewSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    event: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Event",
      required: true
    },
    rating: { type: Number, required: true, min: 1, max: 5, validate: Number.isInteger },
    comment: { type: String, required: true, trim: true, maxlength: 2000 }
  },
  { timestamps: true }
);

reviewSchema.index({ user: 1, event: 1 }, { unique: true });

const Review = mongoose.model("Review", reviewSchema);
export default Review;

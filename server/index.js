import "dotenv/config";
import cors from "cors";
import express from "express";
import { connectDatabase } from "./config/db.js";
import authRoutes from "./routes/authRoutes.js";
import bookingRoutes from "./routes/bookingRoutes.js";
import eventRoutes from "./routes/eventRoutes.js";

const app = express();
const port = process.env.PORT || 5000;

app.use(cors({
  origin: process.env.CLIENT_URL || "http://localhost:5173"
}));
app.use(express.json({ limit: "1mb" }));

app.get("/api/health", (req, res) => {
  res.json({ success: true, message: "Eventrix API is running." });
});
app.use("/api/auth", authRoutes);
app.use("/api/events", eventRoutes);
app.use("/api/bookings", bookingRoutes);

// Return predictable JSON messages for invalid routes and server errors.
app.use((req, res) => {
  res.status(404).json({ success: false, message: "API route not found." });
});
app.use((error, req, res, next) => {
  console.error(error);
  if (error.name === "ValidationError") {
    return res.status(400).json({ success: false, message: error.message });
  }
  if (error.code === 11000) {
    const message = error.keyPattern?.user && error.keyPattern?.event
      ? "You have already reviewed this event."
      : "This record already exists.";
    return res.status(409).json({ success: false, message });
  }
  if (error.name === "CastError") {
    return res.status(400).json({ success: false, message: "The requested ID is invalid." });
  }
  return res.status(500).json({ success: false, message: "Something went wrong. Please try again." });
});

// Start listening only after the database connection succeeds.
connectDatabase()
  .then(() => app.listen(port, () => console.log(`Eventrix API listening on http://localhost:${port}`)))
  .catch((error) => {
    console.error("Could not start Eventrix API:", error.message);
    process.exitCode = 1;
  });

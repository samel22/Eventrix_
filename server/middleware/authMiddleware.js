import jwt from "jsonwebtoken";
import User from "../models/User.js";

// Verify the bearer token and attach the current account to the request.
export async function requireAuth(req, res, next) {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
      return res.status(401).json({ success: false, message: "Please sign in first." });
    }

    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(payload.id).select("-password");
    if (!user) {
      return res.status(401).json({ success: false, message: "This account no longer exists." });
    }

    req.user = user;
    return next();
  } catch (error) {
    if (error.name === "JsonWebTokenError" || error.name === "TokenExpiredError") {
      return res.status(401).json({ success: false, message: "Your session expired. Please sign in again." });
    }
    return next(error);
  }
}

// Allow only organizers to use event-management endpoints.
export function requireOrganizer(req, res, next) {
  if (req.user?.role !== "organizer") {
    return res.status(403).json({ success: false, message: "Organizer access is required." });
  }
  return next();
}

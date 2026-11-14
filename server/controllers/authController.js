import jwt from "jsonwebtoken";
import User from "../models/User.js";

// Return the public account details and a signed login token.
function createSession(user) {
  const token = jwt.sign(
    { id: user._id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );
  return {
    token,
    user: { id: user._id, name: user.name, email: user.email, role: user.role }
  };
}

// Create a regular attendee account after validating its basic fields.
export async function register(req, res, next) {
  try {
    const { name, email, password } = req.body;
    if (!name?.trim() || !email?.trim() || !password) {
      return res.status(400).json({ success: false, message: "Name, email, and password are required." });
    }
    if (password.length < 8) {
      return res.status(400).json({ success: false, message: "Password must be at least 8 characters." });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase().trim() });
    if (existingUser) {
      return res.status(409).json({ success: false, message: "An account with this email already exists." });
    }

    const user = await User.create({ name, email, password, role: "user" });
    return res.status(201).json({ success: true, data: createSession(user) });
  } catch (error) {
    return next(error);
  }
}

// Check the submitted password and start a new login session.
export async function login(req, res, next) {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, message: "Email and password are required." });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() }).select("+password");
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ success: false, message: "Email or password is incorrect." });
    }

    return res.json({ success: true, data: createSession(user) });
  } catch (error) {
    return next(error);
  }
}

// Return the latest account and saved-event details for a signed-in user.
export async function getMe(req, res, next) {
  try {
    const user = await User.findById(req.user.id).populate("savedEvents", "title imageUrl date");
    return res.json({ success: true, data: user });
  } catch (error) {
    return next(error);
  }
}

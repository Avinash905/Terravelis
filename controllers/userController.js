const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/userModel");
const { isDbConnected } = require("../db/conn");
const { getJwtSecret } = require("../middleware/auth");

const memoryUsers = new Map();

const AVATAR_PALETTE = [
  "#38bdf8",
  "#22d3ee",
  "#818cf8",
  "#34d399",
  "#f472b6",
  "#fb923c",
  "#a78bfa",
];

const sanitizeUser = (u) => ({
  id: String(u._id || u.id),
  name: u.name,
  email: u.email,
  avatarColor: u.avatarColor || "#38bdf8",
  homeCity: u.homeCity || "",
  watchlist: u.watchlist || [],
});

const signUserToken = (u) =>
  jwt.sign(
    {
      id: String(u._id || u.id),
      email: u.email,
      name: u.name,
    },
    getJwtSecret(),
    { expiresIn: "7d" }
  );

const register = async (req, res, next) => {
  try {
    const name = (req.body?.name || "").trim();
    const email = (req.body?.email || "").trim().toLowerCase();
    const password = req.body?.password || "";
    const homeCity = (req.body?.homeCity || "").trim();

    if (!name || !email || !password) {
      return res.status(400).json({ message: "Name, email, and password are required" });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ message: "Please provide a valid email address" });
    }
    if (password.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters" });
    }

    const avatarColor = AVATAR_PALETTE[Math.floor(Math.random() * AVATAR_PALETTE.length)];
    const hashedPassword = await bcrypt.hash(password, 10);

    if (isDbConnected()) {
      const existing = await User.findOne({ email });
      if (existing) {
        return res.status(409).json({ message: "An account with this email already exists" });
      }
      const created = await User.create({
        name,
        email,
        password: hashedPassword,
        avatarColor,
        homeCity,
        watchlist: [],
      });
      const token = signUserToken(created);
      return res.status(201).json({ token, user: sanitizeUser(created) });
    }

    if (memoryUsers.has(email)) {
      return res.status(409).json({ message: "An account with this email already exists" });
    }
    const memUser = {
      id: `mem-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      name,
      email,
      password: hashedPassword,
      avatarColor,
      homeCity,
      watchlist: [],
    };
    memoryUsers.set(email, memUser);
    const token = signUserToken(memUser);
    return res.status(201).json({ token, user: sanitizeUser(memUser) });
  } catch (err) {
    return next(err);
  }
};

const login = async (req, res, next) => {
  try {
    const email = (req.body?.email || "").trim().toLowerCase();
    const password = req.body?.password || "";

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    let user = null;
    if (isDbConnected()) {
      user = await User.findOne({ email });
    } else {
      user = memoryUsers.get(email) || null;
    }

    if (!user) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const token = signUserToken(user);
    return res.json({ token, user: sanitizeUser(user) });
  } catch (err) {
    return next(err);
  }
};

const getMe = async (req, res, next) => {
  try {
    if (isDbConnected()) {
      const user = await User.findById(req.user.id).select("-password");
      if (!user) return res.status(404).json({ message: "User not found" });
      return res.json({ user: sanitizeUser(user) });
    }

    const memUser = Array.from(memoryUsers.values()).find((u) => u.id === req.user.id);
    if (!memUser) return res.status(404).json({ message: "Session expired" });
    return res.json({ user: sanitizeUser(memUser) });
  } catch (err) {
    return next(err);
  }
};

const addToWatchlist = async (req, res, next) => {
  try {
    const name = (req.body?.name || "").trim();
    const country = (req.body?.country || "").trim();
    const countryCode = (req.body?.countryCode || "").trim();
    const lat = Number(req.body?.lat);
    const lng = Number(req.body?.lng);

    if (!name || Number.isNaN(lat) || Number.isNaN(lng)) {
      return res.status(400).json({ message: "Valid location name and coordinates required" });
    }

    const item = {
      itemId: `${lat.toFixed(2)}:${lng.toFixed(2)}`,
      name,
      country,
      countryCode,
      lat,
      lng,
      addedAt: new Date(),
    };

    if (isDbConnected()) {
      const user = await User.findById(req.user.id);
      if (!user) return res.status(404).json({ message: "User not found" });
      const exists = user.watchlist.some((w) => w.itemId === item.itemId);
      if (!exists) {
        user.watchlist.unshift(item);
        if (user.watchlist.length > 30) user.watchlist.length = 30;
        await user.save();
      }
      return res.json({ watchlist: user.watchlist });
    }

    const memUser = Array.from(memoryUsers.values()).find((u) => u.id === req.user.id);
    if (!memUser) return res.status(404).json({ message: "User not found" });
    if (!memUser.watchlist.some((w) => w.itemId === item.itemId)) {
      memUser.watchlist.unshift(item);
    }
    return res.json({ watchlist: memUser.watchlist });
  } catch (err) {
    return next(err);
  }
};

const removeFromWatchlist = async (req, res, next) => {
  try {
    const { itemId } = req.params;
    if (isDbConnected()) {
      const user = await User.findById(req.user.id);
      if (!user) return res.status(404).json({ message: "User not found" });
      user.watchlist = user.watchlist.filter((w) => w.itemId !== itemId);
      await user.save();
      return res.json({ watchlist: user.watchlist });
    }

    const memUser = Array.from(memoryUsers.values()).find((u) => u.id === req.user.id);
    if (!memUser) return res.status(404).json({ message: "User not found" });
    memUser.watchlist = memUser.watchlist.filter((w) => w.itemId !== itemId);
    return res.json({ watchlist: memUser.watchlist });
  } catch (err) {
    return next(err);
  }
};

module.exports = {
  register,
  login,
  getMe,
  addToWatchlist,
  removeFromWatchlist,
};

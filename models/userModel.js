const mongoose = require("mongoose");

const watchlistItemSchema = new mongoose.Schema(
  {
    itemId: { type: String, required: true },
    name: { type: String, required: true, trim: true },
    country: { type: String, default: "", trim: true },
    countryCode: { type: String, default: "", trim: true },
    lat: { type: Number, required: true },
    lng: { type: Number, required: true },
    addedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 60,
    },
    email: {
      type: String,
      unique: true,
      required: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
    },
    avatarColor: {
      type: String,
      default: "#38bdf8",
    },
    homeCity: {
      type: String,
      default: "",
      trim: true,
    },
    watchlist: {
      type: [watchlistItemSchema],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

const User = mongoose.model("User", userSchema);

module.exports = User;

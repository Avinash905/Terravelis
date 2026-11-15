const mongoose = require("mongoose");

const beaconSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      default: null,
    },
    authorName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 40,
    },
    avatarColor: {
      type: String,
      default: "#22d3ee",
    },
    city: {
      type: String,
      required: true,
      trim: true,
      maxlength: 80,
    },
    country: {
      type: String,
      default: "",
      trim: true,
      maxlength: 80,
    },
    countryCode: {
      type: String,
      default: "",
      trim: true,
      maxlength: 6,
    },
    lat: {
      type: Number,
      required: true,
      min: -90,
      max: 90,
    },
    lng: {
      type: Number,
      required: true,
      min: -180,
      max: 180,
    },
    message: {
      type: String,
      required: true,
      trim: true,
      maxlength: 180,
    },
    category: {
      type: String,
      enum: ["signal", "travel", "tech", "music", "vibe"],
      default: "signal",
    },
    likes: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

const Beacon = mongoose.model("Beacon", beaconSchema);

module.exports = Beacon;

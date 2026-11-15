const mongoose = require("mongoose");

let connected = false;

const connectDB = async () => {
  const uri = process.env.MONGO_URI;
  if (!uri) {
    console.log("[DB] No MONGO_URI set, using in-memory store.");
    return false;
  }

  try {
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 6000,
    });
    connected = true;
    console.log("[DB] Connected to MongoDB.");
    mongoose.connection.on("disconnected", () => {
      connected = false;
    });
    mongoose.connection.on("reconnected", () => {
      connected = true;
    });
    return true;
  } catch (err) {
    connected = false;
    console.warn(`[DB] MongoDB unavailable (${err.message}), using in-memory store.`);
    return false;
  }
};

const isDbConnected = () => connected && mongoose.connection.readyState === 1;

module.exports = { connectDB, isDbConnected };

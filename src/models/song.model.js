const mongoose = require("mongoose");

const songSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    duration: {
      type: Number, // in seconds
      required: true,
    },
    genre: {
      type: String,
      trim: true,
      default: "Unknown",
    },
    artistId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    artistName: {
      type: String,
      required: true,
    },
    audioUrl: {
      type: String,
      required: true,
    },
    albumId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Album"
    },
    coverArtUrl: {
      type: String,
      default: "",
    },
    uploadDate: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: false }
);

const Song = mongoose.model("Song", songSchema);

module.exports = Song;

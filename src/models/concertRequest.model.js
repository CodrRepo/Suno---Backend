const mongoose = require("mongoose");

const concertRequestSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    artistId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "accepted", "rejected"],
      default: "pending",
    },
    date: {
      type: Date,
      required: true,
    },
    contactNo: {
      type: String,
      required: true,
      match: [/^\+\d{11,14}$/, "contactNo must be in format +<country code><10 digits> (e.g. +911234567890)"],
    },
    message: {
      type: String,
      required: true,
      maxlength: 300,
    }
  },
  { timestamps: true }
);

const ConcertRequest = mongoose.model("ConcertRequest", concertRequestSchema);
module.exports = ConcertRequest;
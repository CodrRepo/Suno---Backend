const mongoose = require("mongoose");

const listeningHistorySchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    songId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Song",
      required: true,
    },
    playedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

listeningHistorySchema.index({ userId: 1, playedAt: -1 });

const ListeningHistory = mongoose.model("ListeningHistory", listeningHistorySchema);

module.exports = ListeningHistory;

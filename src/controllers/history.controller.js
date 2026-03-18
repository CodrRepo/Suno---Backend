const ListeningHistory = require("../models/history.model");
const Song = require("../models/song.model");

// POST /api/history — record a song play
async function addToHistory(req, res) {
  try {
    const { songId } = req.body || {};

    if (!songId) {
      return res.status(400).json({ message: "songId is required" });
    }

    const entry = await ListeningHistory.findOneAndUpdate(
      { userId: req.user._id, songId },
      { $set: { playedAt: new Date() } },
      { upsert: true, new: true }
    );

    return res.status(201).json({
      message: "Added to listening history",
      entry: {
        _id: entry._id,
        userId: entry.userId,
        songId: entry.songId,
        playedAt: entry.playedAt,
      },
    });
  } catch (error) {
    return res.status(500).json({ message: "Server error", error: error.message });
  }
}

// GET /api/history — get current user's listening history (paginated)
async function getHistory(req, res) {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 20));
    const skip = (page - 1) * limit;

    const [history, total] = await Promise.all([
      ListeningHistory.find({ userId: req.user._id })
        .sort({ playedAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate("songId", "title genre audioUrl coverArtUrl duration artistId artistName"),
      ListeningHistory.countDocuments({ userId: req.user._id }),
    ]);

    return res.status(200).json({
      total,
      page,
      totalPages: Math.ceil(total / limit),
      history,
    });
  } catch (error) {
    return res.status(500).json({ message: "Server error", error: error.message });
  }
}

// DELETE /api/history/:id — remove a single history entry
async function deleteHistoryEntry(req, res) {
  try {
    const entry = await ListeningHistory.findOneAndDelete({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!entry) {
      return res.status(404).json({ message: "History entry not found" });
    }

    return res.status(200).json({ message: "History entry removed" });
  } catch (error) {
    return res.status(500).json({ message: "Server error", error: error.message });
  }
}

// DELETE /api/history — clear all history for the current user
async function clearHistory(req, res) {
  try {
    await ListeningHistory.deleteMany({ userId: req.user._id });
    return res.status(200).json({ message: "Listening history cleared" });
  } catch (error) {
    return res.status(500).json({ message: "Server error", error: error.message });
  }
}

// GET /api/history/recommendations — songs based on listening habits
async function getRecommendations(req, res) {
  try {
    const limit = Math.min(20, parseInt(req.query.limit) || 10);
    const fields = "title genre audioUrl coverArtUrl duration artistId artistName";

    // Analyse last 30 plays for genre/artist preferences
    const history = await ListeningHistory.find({ userId: req.user._id })
      .sort({ playedAt: -1 })
      .limit(30)
      .populate("songId", "genre artistId");

    const genreCount = {};
    const artistCount = {};
    const playedIds = new Set();

    for (const entry of history) {
      const song = entry.songId;
      if (!song) continue;
      playedIds.add(song._id.toString());
      const g = song.genre || "Unknown";
      genreCount[g] = (genreCount[g] || 0) + 1;
      if (song.artistId) {
        const a = song.artistId.toString();
        artistCount[a] = (artistCount[a] || 0) + 1;
      }
    }

    const topGenres = Object.entries(genreCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([g]) => g);

    const topArtistIds = Object.entries(artistCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([id]) => id);

    let songs;

    if (topGenres.length === 0) {
      // No history — return latest uploads
      songs = await Song.find({})
        .select(fields)
        .sort({ uploadDate: -1 })
        .limit(limit);
    } else {
      // Fetch preferred-genre/artist songs (no played exclusion — Best Picks = taste, not novelty)
      // Unplayed songs first, then played ones as fallback within the same genre
      const [unplayed, played] = await Promise.all([
        Song.find({
          _id: { $nin: [...playedIds] },
          $or: [{ genre: { $in: topGenres } }, { artistId: { $in: topArtistIds } }],
        })
          .select(fields)
          .limit(limit),
        Song.find({
          _id: { $in: [...playedIds] },
          $or: [{ genre: { $in: topGenres } }, { artistId: { $in: topArtistIds } }],
        })
          .select(fields)
          .limit(limit),
      ]);

      songs = [...unplayed, ...played].slice(0, limit);

      // Backfill with latest uploads if still not enough
      if (songs.length < limit) {
        const have = new Set(songs.map((s) => s._id.toString()));
        const backfill = await Song.find({ _id: { $nin: [...have] } })
          .select(fields)
          .sort({ uploadDate: -1 })
          .limit(limit - songs.length);
        songs = [...songs, ...backfill];
      }
    }

    return res.status(200).json({ songs });
  } catch (error) {
    return res.status(500).json({ message: "Server error", error: error.message });
  }
}

module.exports = { addToHistory, getHistory, deleteHistoryEntry, clearHistory, getRecommendations };

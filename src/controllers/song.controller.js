const Song = require("../models/song.model");

async function uploadSong(req, res) {
  try {
    const { title, duration, genre, artistName, albumId } = req.body;

    if (!title || !duration) {
      return res.status(400).json({ message: "title and duration are required" });
    }

    if (!artistName || !artistName.trim()) {
      return res.status(400).json({ message: "artistName is required" });
    }

    const parsedDuration = Number(duration);
    if (isNaN(parsedDuration) || parsedDuration <= 0) {
      return res.status(400).json({ message: "duration must be a positive number (in seconds)" });
    }

    if (!req.files?.audio?.[0]) {
      return res.status(400).json({ message: "Audio file is required" });
    }

    const audioUrl = req.files.audio[0].path; // Cloudinary secure URL
    const coverArtUrl = req.files.coverArt?.[0]?.path || "";

    const song = await Song.create({
      title,
      duration: parsedDuration,
      genre: genre || "Unknown",
      artistId: req.user._id,
      artistName: artistName.trim(),
      audioUrl,
      coverArtUrl,
      ...(albumId ? { albumId } : {}),
    });

    return res.status(201).json({
      message: "Song uploaded successfully",
      song: {
        id: song._id,
        title: song.title,
        duration: song.duration,
        genre: song.genre,
        artistId: song.artistId,
        artistName: song.artistName,
        audioUrl: song.audioUrl,
        coverArtUrl: song.coverArtUrl,
        uploadDate: song.uploadDate,
      },
    });
  } catch (error) {
    return res.status(500).json({ message: "Server error", error: error.message });
  }
}

async function getAllSongs(req, res) {
  try {
    const songs = await Song.find()
      .populate("artistId", "name artistName profilePicture")
      .sort({ uploadDate: -1 });

    return res.status(200).json({ songs });
  } catch (error) {
    return res.status(500).json({ message: "Server error", error: error.message });
  }
}

async function getSongById(req, res) {
  try {
    const song = await Song.findById(req.params.id);

    if (!song) {
      return res.status(404).json({ message: "Song not found" });
    }

    return res.status(200).json({ song });
  } catch (error) {
    return res.status(500).json({ message: "Server error", error: error.message });
  }
}

async function getSongsByAlbum(req, res) {
  try {
    const songs = await Song.find({ albumId: req.params.albumId })
      .populate("artistId", "name artistName profilePicture")
      .sort({ uploadDate: 1 });

    return res.status(200).json({ songs });
  } catch (error) {
    return res.status(500).json({ message: "Server error", error: error.message });
  }
}

async function getSongsByArtist(req, res) {
  try {
    const songs = await Song.find({ artistId: req.params.artistId })
      .populate("artistId", "name artistName profilePicture")
      .sort({ uploadDate: -1 });

    return res.status(200).json({ songs });
  } catch (error) {
    return res.status(500).json({ message: "Server error", error: error.message });
  }
}

async function getSongsByGenre(req, res) {
  try {
    const songs = await Song.find({ genre: req.params.genre })
      .populate("artistId", "name artistName profilePicture")
      .sort({ uploadDate: -1 })
      .limit(20);
    return res.status(200).json({ songs });
  } catch (error) {
    return res.status(500).json({ message: "Server error", error: error.message });
  }
}

async function updateSong(req, res) {
  try {
    const song = await Song.findById(req.params.id);
    if (!song) return res.status(404).json({ message: "Song not found" });
    if (song.artistId.toString() !== req.user._id.toString())
      return res.status(403).json({ message: "Forbidden" });

    const { title, genre, artistName } = req.body;
    if (title?.trim()) song.title = title.trim();
    if (genre !== undefined) song.genre = genre.trim() || "Unknown";
    if (artistName?.trim()) song.artistName = artistName.trim();
    if (req.file?.path) song.coverArtUrl = req.file.path;

    await song.save();
    const populated = await song.populate("artistId", "name artistName profilePicture");
    return res.json({ song: populated });
  } catch (error) {
    return res.status(500).json({ message: "Server error", error: error.message });
  }
}

async function deleteSong(req, res) {
  try {
    const song = await Song.findById(req.params.id);
    if (!song) return res.status(404).json({ message: "Song not found" });
    if (song.artistId.toString() !== req.user._id.toString())
      return res.status(403).json({ message: "Forbidden" });
    await song.deleteOne();
    return res.json({ message: "Song deleted" });
  } catch (error) {
    return res.status(500).json({ message: "Server error", error: error.message });
  }
}

module.exports = { uploadSong, getAllSongs, getSongById, getSongsByAlbum, getSongsByArtist, getSongsByGenre, updateSong, deleteSong };

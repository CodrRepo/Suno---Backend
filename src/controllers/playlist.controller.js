const Playlist = require("../models/playlist.model");

async function createPlaylist(req, res) {
  try {
    const { name, description } = req.body || {};

    if (!name || name.trim() === "") {
      return res.status(400).json({ message: "Playlist name is required" });
    }

    const playlist = await Playlist.create({
      name: name.trim(),
      description: description ? description.trim() : "",
      userId: req.user._id,
      coverImage: req.file?.path || "",
    });

    return res.status(201).json({
      message: "Playlist created successfully",
      playlist: {
        id: playlist._id,
        name: playlist.name,
        description: playlist.description,
        userId: playlist.userId,
        songs: playlist.songs,
        coverImage: playlist.coverImage,
        isPublic: playlist.isPublic,
        createdAt: playlist.createdAt,
      },
    });
  } catch (error) {
    return res.status(500).json({ message: "Server error", error: error.message });
  }
}

async function getMyPlaylists(req, res) {
  try {
    const playlists = await Playlist.find({ userId: req.user._id })
      .sort({ createdAt: -1 })
      .lean();
    return res.json({ playlists });
  } catch (error) {
    return res.status(500).json({ message: "Server error", error: error.message });
  }
}

async function getPlaylistById(req, res) {
  try {
    const playlist = await Playlist.findById(req.params.playlistId)
      .populate("userId", "name artistName")
      .populate("songs", "title duration genre artistName audioUrl coverArtUrl albumId artistId")
      .lean();

    if (!playlist) return res.status(404).json({ message: "Playlist not found" });
    return res.json({ playlist });
  } catch (error) {
    return res.status(500).json({ message: "Server error", error: error.message });
  }
}

async function updatePlaylist(req, res) {
  try {
    const playlist = await Playlist.findById(req.params.playlistId);
    if (!playlist) return res.status(404).json({ message: "Playlist not found" });
    if (playlist.userId.toString() !== req.user._id.toString())
      return res.status(403).json({ message: "Forbidden" });

    const { name, description, isPublic } = req.body || {};
    if (name !== undefined) playlist.name = name.trim();
    if (description !== undefined) playlist.description = description.trim();
    if (isPublic !== undefined) playlist.isPublic = isPublic;

    await playlist.save();
    return res.json({ message: "Playlist updated", playlist });
  } catch (error) {
    return res.status(500).json({ message: "Server error", error: error.message });
  }
}

async function deletePlaylist(req, res) {
  try {
    const playlist = await Playlist.findById(req.params.playlistId);
    if (!playlist) return res.status(404).json({ message: "Playlist not found" });
    if (playlist.userId.toString() !== req.user._id.toString())
      return res.status(403).json({ message: "Forbidden" });
    if (playlist.isFavorites)
      return res.status(403).json({ message: "Cannot delete Favorite Songs playlist" });

    await playlist.deleteOne();
    return res.json({ message: "Playlist deleted" });
  } catch (error) {
    return res.status(500).json({ message: "Server error", error: error.message });
  }
}

async function getFavoritesPlaylist(req, res) {
  try {
    const playlist = await Playlist.findOneAndUpdate(
      { userId: req.user._id, isFavorites: true },
      {
        $setOnInsert: {
          name: "Favorite Songs",
          isFavorites: true,
          userId: req.user._id,
          songs: [],
          coverImage: "https://res.cloudinary.com/dj974ecp3/image/upload/v1774252570/favourite_brd4yh.webp",
        },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    ).populate("songs", "_id title duration artistName coverArtUrl audioUrl");

    return res.json({ playlist });
  } catch (error) {
    return res.status(500).json({ message: "Server error", error: error.message });
  }
}

async function toggleFavorite(req, res) {
  try {
    const { songId } = req.body || {};
    if (!songId) return res.status(400).json({ message: "songId is required" });

    const playlist = await Playlist.findOneAndUpdate(
      { userId: req.user._id, isFavorites: true },
      {
        $setOnInsert: {
          name: "Favorite Songs",
          isFavorites: true,
          userId: req.user._id,
          songs: [],
          coverImage: "",
        },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    const alreadyIn = playlist.songs.some((id) => id.toString() === songId);
    if (alreadyIn) {
      playlist.songs = playlist.songs.filter((id) => id.toString() !== songId);
    } else {
      playlist.songs.push(songId);
    }
    await playlist.save();

    return res.json({ isFavorited: !alreadyIn, playlistId: playlist._id });
  } catch (error) {
    return res.status(500).json({ message: "Server error", error: error.message });
  }
}

async function getTopFavoritedSong(req, res) {
  try {
    const top = await Playlist.aggregate([
      { $match: { isFavorites: true } },
      { $unwind: "$songs" },
      { $group: { _id: "$songs", totalAdds: { $sum: 1 } } },
      { $sort: { totalAdds: -1 } },
      { $limit: 1 },
      {
        $lookup: {
          from: "songs",
          localField: "_id",
          foreignField: "_id",
          as: "song",
        },
      },
      { $unwind: "$song" },
      {
        $project: {
          _id: "$song._id",
          title: "$song.title",
          duration: "$song.duration",
          genre: "$song.genre",
          artistName: "$song.artistName",
          audioUrl: "$song.audioUrl",
          coverArtUrl: "$song.coverArtUrl",
          artistId: "$song.artistId",
          albumId: "$song.albumId",
          uploadDate: "$song.uploadDate",
          totalAdds: 1,
        },
      },
    ]);

    return res.json({ song: top[0] || null });
  } catch (error) {
    return res.status(500).json({ message: "Server error", error: error.message });
  }
}

async function addSongToPlaylist(req, res) {
  try {
    const { songId } = req.body || {};
    if (!songId) return res.status(400).json({ message: "songId is required" });

    const playlist = await Playlist.findById(req.params.playlistId);
    if (!playlist) return res.status(404).json({ message: "Playlist not found" });
    if (playlist.userId.toString() !== req.user._id.toString())
      return res.status(403).json({ message: "Forbidden" });
    if (playlist.songs.some((id) => id.toString() === songId))
      return res.status(400).json({ message: "Song already in playlist" });

    playlist.songs.push(songId);
    await playlist.save();
    return res.json({ message: "Song added" });
  } catch (error) {
    return res.status(500).json({ message: "Server error", error: error.message });
  }
}

async function removeSongFromPlaylist(req, res) {
  try {
    const { playlistId, songId } = req.params;
    const playlist = await Playlist.findById(playlistId);
    if (!playlist) return res.status(404).json({ message: "Playlist not found" });
    if (playlist.userId.toString() !== req.user._id.toString())
      return res.status(403).json({ message: "Forbidden" });

    playlist.songs = playlist.songs.filter((id) => id.toString() !== songId);
    await playlist.save();
    return res.json({ message: "Song removed" });
  } catch (error) {
    return res.status(500).json({ message: "Server error", error: error.message });
  }
}

module.exports = {
  createPlaylist,
  getMyPlaylists,
  getPlaylistById,
  updatePlaylist,
  deletePlaylist,
  addSongToPlaylist,
  removeSongFromPlaylist,
  getFavoritesPlaylist,
  toggleFavorite,
  getTopFavoritedSong,
};

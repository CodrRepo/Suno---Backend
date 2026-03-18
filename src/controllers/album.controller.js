const Album = require("../models/album.model");

async function createAlbum(req, res) {
  try {
    const { name, description, genre } = req.body;

    if (!name || !description) {
      return res.status(400).json({ message: "name and description are required" });
    }

    const coverImage = req.file?.path || "";

    const album = await Album.create({
      userId: req.user._id,
      name,
      description,
      coverImage,
      genre: genre || "Other",
    });

    return res.status(201).json({ message: "Album created successfully", album });
  } catch (error) {
    return res.status(500).json({ message: "Server error", error: error.message });
  }
}

async function getMyAlbums(req, res) {
  try {
    const albums = await Album.find({ userId: req.user._id })
      .populate("userId", "name artistName")
      .sort({ createdAt: -1 });
    return res.status(200).json({ albums });
  } catch (error) {
    return res.status(500).json({ message: "Server error", error: error.message });
  }
}

async function getAllAlbums(req, res) {
  try {
    const albums = await Album.find().populate("userId", "name artistName");
    return res.status(200).json({ albums });
  } catch (error) {
    return res.status(500).json({ message: "Server error", error: error.message });
  }
}

async function getAlbumById(req, res) {
  try {
    const { albumId } = req.params;

    const album = await Album.findById(albumId).populate("userId", "name artistName");
    if (!album) {
      return res.status(404).json({ message: "Album not found" });
    }

    return res.status(200).json({ album });
  } catch (error) {
    return res.status(500).json({ message: "Server error", error: error.message });
  }
}

async function updateAlbum(req, res) {
  try {
    const { albumId } = req.params;

    const album = await Album.findById(albumId);
    if (!album) return res.status(404).json({ message: 'Album not found' });
    if (album.userId.toString() !== req.user._id.toString())
      return res.status(403).json({ message: 'Forbidden: You do not own this album' });

    const { name, description, genre } = req.body;
    if (name) album.name = name;
    if (description !== undefined) album.description = description;
    if (genre) album.genre = genre;
    if (req.file?.path) album.coverImage = req.file.path;

    await album.save();
    return res.status(200).json({ message: 'Album updated successfully', album });
  } catch (error) {
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
}

async function deleteAlbum(req, res) {
  try {
    const { albumId } = req.params;

    const album = await Album.findById(albumId);
    if (!album) {
      return res.status(404).json({ message: "Album not found" });
    }

    if (album.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Forbidden: You do not own this album" });
    }

    await Album.findByIdAndDelete(albumId);

    return res.status(200).json({ message: "Album deleted successfully" });
  } catch (error) {
    return res.status(500).json({ message: "Server error", error: error.message });
  }
}

module.exports = { createAlbum, getMyAlbums, getAllAlbums, getAlbumById, updateAlbum, deleteAlbum };

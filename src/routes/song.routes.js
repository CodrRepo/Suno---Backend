const express = require("express");
const { verifyToken, requireArtist } = require("../middleware/auth.middleware");
const { uploadSongFiles, uploadSongCover } = require("../middleware/upload.middleware");
const songController = require("../controllers/song.controller");

const router = express.Router();

// POST /api/songs/upload — artist only
router.post(
  "/upload",
  verifyToken,
  requireArtist,
  uploadSongFiles,
  songController.uploadSong
);

// GET /api/songs — all songs
router.get("/", verifyToken, songController.getAllSongs);

// GET /api/songs/artist/:artistId — songs by a specific artist
router.get("/artist/:artistId", verifyToken, songController.getSongsByArtist);

// GET /api/songs/album/:albumId — songs in a specific album
router.get("/album/:albumId", verifyToken, songController.getSongsByAlbum);

// GET /api/songs/genre/:genre — songs by genre
router.get("/genre/:genre", verifyToken, songController.getSongsByGenre);

// GET /api/songs/:id — single song by ID
router.get("/:id", verifyToken, songController.getSongById);

// PATCH /api/songs/:id — update song (artist only, owner)
router.patch("/:id", verifyToken, requireArtist, uploadSongCover, songController.updateSong);

// DELETE /api/songs/:id — delete song (artist only, owner)
router.delete("/:id", verifyToken, requireArtist, songController.deleteSong);

module.exports = router;

const express = require("express");
const { verifyToken, requireArtist } = require("../middleware/auth.middleware");
const { uploadAlbumCover } = require("../middleware/upload.middleware");
const albumController = require("../controllers/album.controller");

const router = express.Router();

// POST /api/albums — create a new album (artist only)
router.post("/", verifyToken, requireArtist, uploadAlbumCover, albumController.createAlbum);

// GET /api/albums/my — get albums created by the logged-in user
router.get("/my", verifyToken, albumController.getMyAlbums);

// GET /api/albums — get all albums
router.get("/", albumController.getAllAlbums);

// GET /api/albums/:albumId — get a single album by id
router.get("/:albumId", albumController.getAlbumById);

// PATCH /api/albums/:albumId — update album (artist only)
router.patch("/:albumId", verifyToken, requireArtist, uploadAlbumCover, albumController.updateAlbum);

// DELETE /api/albums/:albumId — delete the entire album (artist only)
router.delete("/:albumId", verifyToken, requireArtist, albumController.deleteAlbum);

module.exports = router;

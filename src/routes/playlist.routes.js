const express = require("express");
const { verifyToken } = require("../middleware/auth.middleware");
const { uploadPlaylistCover } = require("../middleware/upload.middleware");
const playlistController = require("../controllers/playlist.controller");

const router = express.Router();

router.post("/", verifyToken, uploadPlaylistCover, playlistController.createPlaylist);
router.get("/my", verifyToken, playlistController.getMyPlaylists);
router.get("/favorites", verifyToken, playlistController.getFavoritesPlaylist);
router.get("/favorites/top-song", verifyToken, playlistController.getTopFavoritedSong);
router.post("/favorites/toggle", verifyToken, playlistController.toggleFavorite);
router.get("/:playlistId", verifyToken, playlistController.getPlaylistById);
router.patch("/:playlistId", verifyToken, playlistController.updatePlaylist);
router.delete("/:playlistId", verifyToken, playlistController.deletePlaylist);
router.post("/:playlistId/songs", verifyToken, playlistController.addSongToPlaylist);
router.delete("/:playlistId/songs/:songId", verifyToken, playlistController.removeSongFromPlaylist);

module.exports = router;

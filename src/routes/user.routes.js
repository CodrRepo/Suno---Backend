const express = require("express");
const router = express.Router();
const { verifyToken } = require("../middleware/auth.middleware");
const { uploadAvatar } = require("../middleware/upload.middleware");
const { getMe, updateMe, deleteMe, updateProfileType, getArtists, getArtistById, toggleFollow, updateAvatar } = require("../controllers/user.controller");

// Wraps a multer middleware so its errors return JSON instead of an HTML page
function handleUpload(multerMiddleware) {
  return (req, res, next) => {
    multerMiddleware(req, res, (err) => {
      if (!err) return next()
      const status = err.code === 'LIMIT_FILE_SIZE' ? 413 : 400
      return res.status(status).json({ message: err.message || 'File upload failed' })
    })
  }
}

router.get("/artists", verifyToken, getArtists);
router.get("/artists/:artistId", verifyToken, getArtistById);
router.post("/artists/:artistId/follow", verifyToken, toggleFollow);
router.get("/me", verifyToken, getMe);
router.patch("/me/avatar", verifyToken, handleUpload(uploadAvatar), updateAvatar);
router.patch("/me", verifyToken, updateMe);
router.patch("/me/profile-type", verifyToken, updateProfileType);
router.delete("/me", verifyToken, deleteMe);

module.exports = router;

const cloudinary = require("cloudinary").v2;
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const multer = require("multer");

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Single storage engine that handles both audio and cover art fields dynamically
const storage = new CloudinaryStorage({
  cloudinary,
  params: async (req, file) => {
    if (file.fieldname === "audio") {
      return {
        folder: "suno/songs/audio",
        resource_type: "video", // Cloudinary uses "video" resource type for audio files
        allowed_formats: ["mp3", "wav", "flac", "aac", "ogg"],
      };
    }
    // coverArt
    return {
      folder: "suno/songs/covers",
      resource_type: "image",
      allowed_formats: ["jpg", "jpeg", "png", "webp"],
    };
  },
});

const uploadSongFiles = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50 MB max per file
}).fields([
  { name: "audio", maxCount: 1 },
  { name: "coverArt", maxCount: 1 },
]);

const albumCoverStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "suno/albums/covers",
    resource_type: "image",
    allowed_formats: ["jpg", "jpeg", "png", "webp"],
  },
});

const uploadAlbumCover = multer({
  storage: albumCoverStorage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB max
}).single("coverImage");

const avatarStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "suno/user/avatar",
    resource_type: "image",
    allowed_formats: ["jpg", "jpeg", "png", "webp"],
  },
});

const uploadAvatar = multer({
  storage: avatarStorage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB max
}).single("avatar");

const playlistCoverStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "suno/playlists/covers",
    resource_type: "image",
    allowed_formats: ["jpg", "jpeg", "png", "webp"],
  },
});

const uploadPlaylistCover = multer({
  storage: playlistCoverStorage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB max
}).single("coverImage");

const uploadSongCover = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
}).single("coverArt");

module.exports = { cloudinary, uploadSongFiles, uploadAlbumCover, uploadAvatar, uploadPlaylistCover, uploadSongCover };

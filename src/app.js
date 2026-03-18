const express = require("express");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const authRoutes = require("./routes/auth.routes");
const songRoutes = require("./routes/song.routes");
const playlistRoutes = require("./routes/playlist.routes");
const historyRoutes = require("./routes/history.routes");
const concertRequestRoutes = require("./routes/concertRequest.routes");
const albumRoutes = require("./routes/album.routes");
const userRoutes = require("./routes/user.routes");
const adminRoutes = require("./routes/admin.routes");

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// CORS configuration - allows both development and production origins
const allowedOrigins = [
  process.env.CLIENT_URL || "https://sunomusic.vercel.app",
  "http://localhost:5173", // Vite default dev server
  "http://localhost:4173", // Vite preview server
];

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);

    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/songs", songRoutes);
app.use("/api/playlists", playlistRoutes);
app.use("/api/history", historyRoutes);
app.use("/api/concert-requests", concertRequestRoutes);
app.use("/api/albums", albumRoutes);
app.use("/api/users", userRoutes);
app.use("/api/admin", adminRoutes);

// Global JSON error handler — catches anything that calls next(err) including
// unhandled multer/cloudinary errors from other routes
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  const status = err.status || err.statusCode || 500;
  const message = err.message || "Internal server error";
  return res.status(status).json({ message });
});

module.exports = app;
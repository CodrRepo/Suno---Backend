const express = require("express");
const { verifyToken, requireArtist } = require("../middleware/auth.middleware");
const concertRequestController = require("../controllers/concertRequest.controller");

const router = express.Router();

// GET /api/concert-requests — current user fetches their requests (as listener and as artist)
router.get("/", verifyToken, concertRequestController.getRequests);

// POST /api/concert-requests — any authenticated user sends a request to an artist
router.post("/", verifyToken, concertRequestController.createConcertRequest);

// PATCH /api/concert-requests/:id/status — only the target artist can accept/reject
router.patch("/:id/status", verifyToken, requireArtist, concertRequestController.updateStatus);

// DELETE /api/concert-requests/:id — listener withdraws their own pending request
router.delete("/:id", verifyToken, concertRequestController.deleteRequest);

module.exports = router;
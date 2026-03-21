const concertRequestModel = require("../models/concertRequest.model");
const User = require("../models/user.model");

// GET /api/concert-requests — returns requests as both listener and artist
async function getRequests(req, res) {
  try {
    const userId = req.user._id;

    // Auto-reject any pending requests whose concert date has already passed
    await concertRequestModel.updateMany(
      { status: "pending", date: { $lt: new Date() } },
      { $set: { status: "rejected" } }
    );

    console.log("Fetching concert requests for user:", req.user);
    const [asListener, asArtist] = await Promise.all([
      concertRequestModel
        .find({ userId })
        .populate("artistId", "name artistName profilePicture")
        .sort({ createdAt: -1 }),
      concertRequestModel
        .find({ artistId: userId })
        .populate("userId", "name profilePicture")
        .sort({ createdAt: -1 }),
    ]);

    return res.status(200).json({ asListener, asArtist });
  } catch (error) {
    return res.status(500).json({ message: "Server error", error: error.message });
  }
}

// POST /api/concert-requests — listener sends a request to an artist
async function createConcertRequest(req, res) {
  try {
    const { artistId, contactNo, message, date } = req.body || {};

    if (!artistId || !contactNo || !message || !date) {
      return res.status(400).json({ message: "artistId, contactNo, message, and date are required" });
    }

    const contactNoRegex = /^\+\d{11,14}$/;
    if (!contactNoRegex.test(contactNo)) {
      return res.status(400).json({ message: "contactNo must be in format +<country code><10 digits> (e.g. +911234567890)" });
    }

    const concertDate = new Date(date);
    if (isNaN(concertDate.getTime()) || concertDate <= new Date()) {
      return res.status(400).json({ message: "date must be a valid future date" });
    }

    const artist = await User.findOne({ _id: artistId});
    if (!artist) {
      return res.status(404).json({ message: "Artist not found" });
    }

    if(artist.artistName === ""){
      return res.status(400).json({ message: "The specified user is not an artist" });
    }

    if (req.user._id.equals(artistId)) {
      return res.status(400).json({ message: "You cannot send a concert request to yourself" });
    }

    const existing = await concertRequestModel.findOne({
      userId: req.user._id,
      artistId,
      status: "pending",
    });
    if (existing) {
      return res.status(409).json({ message: "A pending request to this artist already exists" });
    }

    const request = await concertRequestModel.create({
      userId: req.user._id,
      artistId,
      contactNo,
      message,
      date: concertDate,
    });

    return res.status(201).json({
      message: "Concert request sent successfully",
      request,
    });
  } catch (error) {
    return res.status(500).json({ message: "Server error", error: error.message });
  }
}

// PATCH /api/concert-requests/:id/status — artist accepts or rejects
async function updateStatus(req, res) {
  try {
    const { status } = req.body || {};
    const allowed = ["accepted", "rejected"];

    if (!status || !allowed.includes(status)) {
      return res.status(400).json({ message: `status must be one of: ${allowed.join(", ")}` });
    }

    const request = await concertRequestModel.findById(req.params.id);
    if (!request) {
      return res.status(404).json({ message: "Concert request not found" });
    }

    if (!request.artistId.equals(req.user._id)) {
      return res.status(403).json({ message: "Forbidden: Only the target artist can update this request" });
    }

    if (request.status !== "pending") {
      return res.status(409).json({ message: `Request has already been ${request.status}` });
    }

    request.status = status;
    await request.save();

    return res.status(200).json({
      message: `Concert request ${status}`,
      request,
    });
  } catch (error) {
    return res.status(500).json({ message: "Server error", error: error.message });
  }
}

// DELETE /api/concert-requests/:id — listener withdraws their pending request
async function deleteRequest(req, res) {
  try {
    const request = await concertRequestModel.findById(req.params.id);
    if (!request) {
      return res.status(404).json({ message: "Concert request not found" });
    }

    if (!request.userId.equals(req.user._id)) {
      return res.status(403).json({ message: "Forbidden: Only the requester can withdraw this request" });
    }

    if (request.status !== "pending") {
      return res.status(409).json({ message: "Only pending requests can be withdrawn" });
    }

    await request.deleteOne();
    return res.status(200).json({ message: "Request withdrawn" });
  } catch (error) {
    return res.status(500).json({ message: "Server error", error: error.message });
  }
}

module.exports = { getRequests, createConcertRequest, updateStatus, deleteRequest };


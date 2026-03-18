const express = require("express");
const { verifyToken } = require("../middleware/auth.middleware");
const historyController = require("../controllers/history.controller");

const router = express.Router();

router.get("/recommendations", verifyToken, historyController.getRecommendations);
router.post("/", verifyToken, historyController.addToHistory);
router.get("/", verifyToken, historyController.getHistory);
router.delete("/", verifyToken, historyController.clearHistory);
router.delete("/:id", verifyToken, historyController.deleteHistoryEntry);

module.exports = router;

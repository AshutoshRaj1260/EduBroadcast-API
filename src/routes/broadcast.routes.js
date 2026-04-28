const express = require("express");
const rateLimit = require("express-rate-limit");
const router = express.Router();
const broadcastController = require("../controllers/broadcast.controller");

// Apply rate limiting to the public broadcasting API (Bonus Feature)
const broadcastLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute window
  max: 60, // limit each IP to 60 requests per windowMs
  message: {
    message: "Too many requests from this IP, please try again after a minute",
  },
});

// Public endpoint corresponding to: GET /content/live/teacher-1
// This route does not require authentication as it is accessed by students
router.get(
  "/:teacherIdParam",
  broadcastLimiter,
  broadcastController.getLiveContent,
);

module.exports = router;

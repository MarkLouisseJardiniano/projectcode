const express = require("express");
const router = express.Router();
const Ratings = require("../schema/ratingsAndFeedbackSchema.js");
const Driver = require("../schema/drivers.js");
const User = require("../schema/auth.js");
const Booking = require("../schema/ride.js");

router.get("/ratings", async (req, res) => {
  try {
    const ratings = await Ratings.find();
    res.json(ratings);
  } catch (err) {
    console.error("Error fetching ratings:", err);
    res.status(500).json({ message: "Server Error" });
  }
});

router.get("/ratings/:driverId", async (req, res) => {
  try {
    const { driverId } = req.params;

    if (!driverId) {
      return res.status(400).json({ message: "Driver ID is required." });
    }

    const ratings = await Ratings.find({ driver: driverId });

    if (ratings.length === 0) {
      return res
        .status(404)
        .json({ message: "No ratings found for this driver." });
    }

    const totalRatings = ratings.reduce(
      (acc, rating) => acc + rating.rating,
      0
    );
    const averageRating = totalRatings / ratings.length;

    res.json({ status: "ok", data: { averageRating, ratings } });
  } catch (err) {
    console.error("Error fetching ratings:", err);
    res.status(500).json({ message: "Server Error" });
  }
});

router.post("/ratings", async (req, res) => {
  try {
    const { bookingId, driverId, userId, rating, feedback } = req.body;

    if (!bookingId || !userId || !driverId) {
      return res
        .status(400)
        .json({ message: "Booking ID, User ID, and Driver ID are required" });
    }

    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(400).json({ message: "Booking not found" });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(400).json({ message: "User not found" });
    }

    const driver = await Driver.findById(driverId);
    if (!driver) {
      return res.status(400).json({ message: "Driver not found" });
    }

    if (typeof rating !== "number" || rating < 1 || rating > 5) {
      return res.status(400).json({ message: "Invalid rating value" });
    }

    const newRatingsAndFeedback = new Ratings({
      booking: bookingId,
      user: userId,
      driver: driverId,
      rating,
      feedback,
    });

    await newRatingsAndFeedback.save();
    res.status(201).json({
      message: "Rating Submitted Successfully",
      data: newRatingsAndFeedback,
    });
  } catch (error) {
    console.error("Error creating rating:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

module.exports = router;

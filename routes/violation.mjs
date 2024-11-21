const express = require("express");
const router = express.Router();
const Violations = require("../schema/violationSchema.mjs");
const Driver = require("../schema/drivers.js");
const User = require("../schema/auth.js");
const Booking = require("../schema/ride.js");

router.get("/violation", async (req, res) => {
  try {
    const violations = await Violations.find()
      .populate("user", "name")
      .populate("driver", "name");
    res.status(200).json({ status: "ok", data: violations });
  } catch (err) {
    console.error("Error fetching violations:", err);
    res.status(500).json({ status: "error", message: "Server Error" });
  }
});

router.get("/violation/:driverId", async (req, res) => {
  try {
    const driverId = req.params.driverId;
    const violations = await Violations.find({ driver: driverId }).populate(
      "user",
      "name"
    );

    if (!violations || violations.length === 0) {
      return res.status(404).json({
        status: "error",
        message: "No violations found for this driver.",
      });
    }

    res.status(200).json({ status: "ok", data: violations });
  } catch (error) {
    console.error("Error checking violation status:", error);
    res.status(500).json({ status: "error", message: "Server Error" });
  }
});

router.post("/violation", async (req, res) => {
  try {
    const { bookingId, driverId, userId, report, description } = req.body;

    if (!bookingId || !driverId || !userId) {
      return res
        .status(400)
        .json({ status: "error", message: "Ids not found" });
    }

    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res
        .status(400)
        .json({ status: "error", message: "Booking not found" });
    }
    const driver = await Driver.findById(driverId);
    if (!driver) {
      return res
        .status(400)
        .json({ status: "error", message: "Driver not found" });
    }
    const user = await User.findById(userId);
    if (!user) {
      return res
        .status(400)
        .json({ status: "error", message: "User not found" });
    }

    const newViolation = new Violations({
      booking: bookingId,
      driver: driverId,
      user: userId,
      report,
      description,
    });

    await newViolation.save();
    res.status(201).json({ status: "ok", data: newViolation });
  } catch (error) {
    console.error("Error creating violation:", error);
    res
      .status(500)
      .json({ status: "error", message: "Error creating violation" });
  }
});

module.exports = router;

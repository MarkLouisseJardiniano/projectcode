const express = require("express");
const router = express.Router();
const Fare = require("../schema/fare.js");

router.get("/fares", async (req, res) => {
  try {
    const fares = await Fare.find();
    res.json(fares);
  } catch (err) {
    console.error("Error fetching fares:", err);
    res.status(500).json({ message: "Server Error" });
  }
});

router.post("/set-fare", async (req, res) => {
  const { vehicleType, baseFare, farePerKm, bookingFee } = req.body;

  if (
    !vehicleType ||
    baseFare === undefined ||
    farePerKm === undefined ||
    bookingFee === undefined
  ) {
    return res.status(400).json({ error: "All fields are required" });
  }

  try {
    const fareDetails = await Fare.findOneAndUpdate(
      { vehicleType },
      { baseFare, farePerKm, bookingFee },
      { new: true, upsert: true }
    );
    res.status(200).json(fareDetails);
  } catch (error) {
    console.error("Error setting fare:", error);
    res.status(500).json({ error: "Error setting fare" });
  }
});

router.put("/edit-fare/:id", async (req, res) => {
  try {
    const fareId = req.params.id;
    const { baseFare, farePerKm, bookingFee } = req.body;

    const updateFare = await Fare.findByIdAndUpdate(
      fareId,
      { baseFare, farePerKm, bookingFee },
      { new: true }
    );
    if (!updateFare) {
      return res.status(404).json({ message: "Fare not Found" });
    }
    res.status(200).json({ status: "ok", data: updateFare });
  } catch (error) {
    console.error("Error updating fare data:", error);
    res.status(500).json({ message: "Server Error" });
  }
});

module.exports = router;

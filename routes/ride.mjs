const express = require("express");
const multer = require("multer");
const sharp = require("sharp");
const fs = require("fs");
const path = require("path");
const router = express.Router();
const Booking = require("../schema/ride.mjs");
const Driver = require("../schema/drivers.mjs");
const User = require("../schema/auth.mjs");
const RatingsAndFeedbacks = require("../schema/ratingsAndFeedbackSchema.mjs");
const upload = require("../middleware/upload.mjs");
const Fare = require("../schema/fare.js");
const { Expo } = require("expo-server-sdk");
let expo = new Expo();
const JWT_SECRET = "IWEFHsdfIHCW362weg47HGV3GB4678{]JKAsadFIH";
const authenticateUser = require("../middleware/verify.js");

// Get all bookings
router.get("/booking", async (req, res) => {
  try {
    const bookings = await Booking.find();
    res.json(bookings);
  } catch (err) {
    console.error("Error fetching bookings:", err);
    res.status(500).json({ message: "Server Error" });
  }
});
router.get("/available", async (req, res) => {
  try {
    const { driverId } = req.query;

    // Validate that the driverId is provided
    if (!driverId) {
      console.error("Driver ID is required");
      return res.status(400).json({ message: "Driver ID is required" });
    }

    // Find the driver by ID
    const driver = await Driver.findById(driverId);
    if (!driver) {
      console.error(`Driver not found: ${driverId}`);
      return res.status(404).json({ message: "Driver not found" });
    }

    // Get the driver's vehicle type
    const vehicleType = driver.vehicleInfo2.vehicleType;

    // Check for the driver's current booking (accepted or rejected)
    const currentBooking = await Booking.findOne({
      driver: driverId,
      status: { $in: ["accepted", "rejected"] },
    }).sort({ updatedAt: -1 });

    // Build the query to find pending special and shared rides with "Create" action
    const query = {
      status: "pending",
      vehicleType: vehicleType,
      $or: [
        { rideType: "Special" },
        { rideType: "Shared Ride", rideAction: "Create" },
      ],
    };

    // If the driver has a current booking, exclude it
    if (currentBooking) {
      query._id = { $ne: currentBooking._id };
    }

    // Fetch matching bookings sorted by creation date
    const newBookings = await Booking.find(query).sort({ createdAt: 1 });

    // Return the found bookings
    res.status(200).json({ status: "ok", data: newBookings });
  } catch (error) {
    console.error("Error fetching bookings:", error);
    res.status(500).json({ message: "Server Error", error: error.message });
  }
});

router.get("/available/shared", async (req, res) => {
  try {
    // Define the query to find accepted shared rides
    const query = {
      status: "accepted",
      rideType: "Shared Ride",
    };

    // Fetch the shared rides from the database
    const sharedRides = await Booking.find(query).sort({ createdAt: 1 });

    // If no rides are found, return an empty array with a success status
    if (sharedRides.length === 0) {
      return res.status(200).json({ status: "ok", data: [] });
    }

    // Respond with the found rides
    res.status(200).json({ status: "ok", data: sharedRides });
  } catch (error) {
    // Log the error for debugging purposes
    console.error("Error fetching shared rides:", error);

    // Respond with a 500 error if something goes wrong
    res.status(500).json({ message: "Server Error", error: error.message });
  }
});

router.get("/accepted", async (req, res) => {
  try {
    const acceptedBooking = await Booking.find({ status: "accepted" });
    res.status(200).json({ status: "ok", data: acceptedBooking });
  } catch (error) {
    console.error("Error fetching accepted bookings:", error);
    res.status(500).json({ message: "Server Error" });
  }
});
router.post("/create/special", async (req, res) => {
  const {
    userId,
    pickupLocation,
    destinationLocation,
    vehicleType,
    rideType,
    fare,
  } = req.body;

  if (
    !userId ||
    !pickupLocation ||
    !destinationLocation ||
    !vehicleType ||
    !rideType ||
    fare == null
  ) {
    return res.status(400).json({ error: "All fields are required" });
  }

  try {
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const newBooking = new Booking({
      name: user.name,
      user: userId,
      pickupLocation,
      destinationLocation,
      vehicleType,
      rideType: "Special",
      fare,
      status: "pending",
    });

    await newBooking.save();
    res.status(201).json(newBooking);
  } catch (error) {
    console.error("Error creating booking:", error);
    res.status(500).json({ error: "Error creating booking" });
  }
});

router.get("/joining/shared/:bookingId", async (req, res) => {
  try {
    const { bookingId } = req.params;

    if (!bookingId) {
      return res.status(400).json({ message: "Booking ID is required" });
    }

    const currentBooking = await Booking.findById(bookingId);
    if (!currentBooking || currentBooking.rideType !== "Shared Ride") {
      return res.status(404).json({ message: "Shared ride not found" });
    }

    const joinBooking = await Booking.find({
      parentBooking: currentBooking._id,
      rideAction: "Join",
      status: ["pending", "accepted"],
      vehicleType: currentBooking.vehicleType, // Ensure vehicle type matches
      rideType: "Shared Ride",
    }).sort({ createdAt: 1 }); // Get the earliest pending shared ride

    // Respond with the next available booking or a message if none found
    if (joinBooking.length > 0) {
      res.status(200).json({
        status: "ok",
        data: joinBooking,
      });
    } else {
      res.status(404).json({ message: "No pending join bookings available" });
    }
  } catch (error) {
    console.error("Error fetching next shared ride:", error);
    res.status(500).json({ message: "Server Error" });
  }
});

// Create a new ride (special or shared)
router.post("/create/shared", async (req, res) => {
  const {
    userId,
    pickupLocation,
    destinationLocation,
    vehicleType,
    rideType,
    rideAction,
    fare,
  } = req.body;

  // Validate required fields
  if (
    !userId ||
    !pickupLocation ||
    !destinationLocation ||
    !vehicleType ||
    !rideType ||
    fare == null
  ) {
    return res.status(400).json({ error: "All fields are required" });
  }

  // Validate rideAction only if rideType is "Shared"
  if (rideType === "Shared Ride" && !rideAction) {
    return res.status(400).json({
      error: "Ride Action (Create or Join) is required for Shared Rides",
    });
  }

  try {
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Create a new booking for the ride
    const newBooking = new Booking({
      name: user.name,
      user: userId,
      pickupLocation,
      destinationLocation,
      vehicleType,
      rideType,
      rideAction: rideType === "Shared Ride" ? "Create" : null, // Only set rideAction for shared rides
      fare,
      status: "pending",
    });

    await newBooking.save();
    res.status(201).json(newBooking);
  } catch (error) {
    console.error("Error creating booking:", error);
    res.status(500).json({ error: "Error creating booking" });
  }
});

router.post("/join/shared", async (req, res) => {
  const {
    bookingId,
    userId,
    pickupLocation,
    destinationLocation,
    vehicleType,
    fare,
  } = req.body;

  // Validate required fields
  if (
    !bookingId ||
    !userId ||
    !pickupLocation ||
    !destinationLocation ||
    !vehicleType ||
    fare == null
  ) {
    return res.status(400).json({ error: "All fields are required" });
  }

  try {
    const existingBooking = await Booking.findById(bookingId);
    if (!existingBooking) {
      return res.status(404).json({ error: "Booking not found" });
    }

    // Check if the booking is a shared ride that is in 'Create' mode
    if (
      existingBooking.rideType !== "Shared Ride" ||
      existingBooking.rideAction === "Join"
    ) {
      return res.status(400).json({
        error: "You can only join a shared ride that is in 'Create' status.",
      });
    }

    // Ensure the driver has accepted the ride
    if (!["accepted", "Arrived", "On board"].includes(existingBooking.status)) {
      return res.status(403).json({
        error:
          "You cannot join this ride until the driver has accepted, arrived, or is on board.",
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Create a new booking for the joining passenger
    const newBooking = new Booking({
      name: user.name,
      user: userId,
      pickupLocation,
      destinationLocation,
      vehicleType,
      rideType: "Shared Ride", // Keep rideType as shared
      rideAction: "Join", // Set action to Join
      fare,
      status: "pending",
      parentBooking: existingBooking._id, // Link to the parent shared ride
    });

    await newBooking.save();
    res.status(201).json({
      status: "ok",
      message: "Successfully joined the shared ride",
      bookingId: newBooking._id,
      name: user.name,
    });
  } catch (error) {
    console.error("Error joining ride:", error);
    res.status(500).json({ error: "Error joining the shared ride" });
  }
});

router.post("/accept-copassenger", async (req, res) => {
  try {
    const { newBookingId } = req.body;

    // Ensure newBookingId is present
    if (!newBookingId) {
      return res.status(400).json({ message: "New Booking ID is required." });
    }

    // Find the new booking and populate user name
    const newBooking = await Booking.findById(newBookingId).populate(
      "user",
      "name"
    );

    // Check if newBooking exists
    if (!newBooking) {
      return res.status(404).json({ message: "New booking not found." });
    }

    console.log(
      "New booking details with populated user:",
      JSON.stringify(newBooking, null, 2)
    );

    // Ensure the parent booking is a shared ride
    const parentBooking = await Booking.findById(newBooking.parentBooking);
    if (!parentBooking || parentBooking.rideType !== "Shared Ride") {
      return res.status(400).json({
        message: "Cannot accept a co-passenger in a non-shared ride.",
      });
    }

    // Calculate new fare for the co-passenger (30% discount)
    const discountedFare = (newBooking.fare * 0.7).toFixed(2); // Assuming a 30% discount for the co-passenger

    // Add co-passenger details to the parent booking
    parentBooking.copassengers.push({
      _id: newBooking._id,
      userId: newBooking.user._id,
      name: newBooking.user.name,
      pickupLocation: newBooking.pickupLocation,
      destinationLocation: newBooking.destinationLocation,
      fare: discountedFare,
      rideType: newBooking.rideType,
      status: "accepted",
    });

    if (parentBooking.copassengers.length === 1) {
      // First co-passenger
      const parentDiscountedFare = (parentBooking.fare * 0.7).toFixed(2); // 30% discount on parent fare
      parentBooking.fare = parentDiscountedFare; // Update the parent booking's fare
    }

    // Update the status and fare of the new booking (co-passenger's booking)
    newBooking.status = "accepted";
    newBooking.fare = discountedFare; // Update the new booking's fare with the co-passenger discount
    await newBooking.save(); // Save the updated new booking

    // Save the updated parent booking (with potential discount)
    await parentBooking.save();

    return res.status(200).json({
      status: "ok",
      message: "Co-passenger accepted and added to the booking.",
      booking: parentBooking,
      newBookingId: newBooking._id,
    });
  } catch (error) {
    console.error("Error occurred:", error.message);
    return res
      .status(500)
      .json({ message: "Server Error", error: error.message });
  }
});

router.post("/accept", async (req, res) => {
  try {
    const { bookingId, driverId, latitude, longitude } = req.body;

    // Validate required fields
    if (!bookingId || !driverId || latitude == null || longitude == null) {
      return res.status(400).json({
        message: "Booking ID, Driver ID, and driver location are required",
      });
    }

    // Find the booking and check if it's still pending
    const booking = await Booking.findById(bookingId);
    if (!booking || booking.status !== "pending") {
      return res
        .status(400)
        .json({ message: "Booking not available or not pending" });
    }

    // Fetch the driver
    const driver = await Driver.findById(driverId);
    if (!driver) {
      return res.status(404).json({ message: "Driver not found" });
    }

    // Calculate average rating for the driver
    const ratings = await RatingsAndFeedbacks.find({ driver: driverId });
    let averageRating = 0;

    if (ratings.length > 0) {
      const totalRatings = ratings.reduce(
        (acc, rating) => acc + rating.rating,
        0
      );
      averageRating = totalRatings / ratings.length;
    }

    // Accept the booking by updating status, driver info, and driver location
    booking.status = "accepted";
    booking.driver = driverId;
    booking.driverLocation = {
      latitude: latitude,
      longitude: longitude,
    };
    booking.driverRating = { averageRating }; // Add the average rating here
    await booking.save();

    // Check if it's a shared ride
    let newBooking = null;
    if (booking.rideType === "Shared Ride") {
      newBooking = await Booking.findOne({
        status: "pending",
        vehicleType: booking.vehicleType, // Ensure vehicle type matches
        rideType: "Shared Ride",
      }).sort({ createdAt: 1 }); // Get the earliest pending shared ride
    }

    // Respond with accepted booking and any new shared booking
    res.status(200).json({
      status: "ok",
      data: {
        acceptedBooking: booking, // `booking` now includes driverRating
        newBooking: newBooking ? [newBooking] : [],
      },
    });
  } catch (error) {
    console.error("Error accepting booking:", error);
    res.status(500).json({ message: "Server Error" });
  }
});

router.delete("/delete-all", async (req, res) => {
  try {
    const result = await Booking.deleteMany({});
    res.status(200).json({
      status: "ok",
      message: "All bookings deleted",
      deletedCount: result.deletedCount,
    });
  } catch (error) {
    console.error("Error deleting all bookings:", error);
    res.status(500).json({ message: "Server Error" });
  }
});

router.post("/cancel", async (req, res) => {
  try {
    const { bookingId } = req.body;
    if (!bookingId) {
      return res.status(400).json({ message: "Booking ID is required" });
    }

    const booking = await Booking.findById(bookingId);
    if (
      !booking ||
      booking.status === "completed" ||
      booking.status === "canceled"
    ) {
      return res.status(400).json({ message: "Booking cannot be canceled" });
    }

    booking.status = "canceled";
    const updatedBooking = await booking.save();

    res.status(200).json({ status: "ok", data: updatedBooking });
  } catch (error) {
    console.error("Error canceling booking:", error);
    res.status(500).json({ message: "Server Error" });
  }
});

router.post("/create/special", async (req, res) => {
  const {
    userId,
    pickupLocation,
    destinationLocation,
    vehicleType,
    rideType,
    fare,
  } = req.body;

  if (
    !userId ||
    !pickupLocation ||
    !destinationLocation ||
    !vehicleType ||
    !rideType ||
    fare == null
  ) {
    return res.status(400).json({ error: "All fields are required" });
  }

  try {
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const newBooking = new Booking({
      name: user.name,
      user: userId,
      pickupLocation,
      destinationLocation,
      vehicleType,
      rideType: "Special",
      fare,
      status: "pending",
    });

    await newBooking.save();
    res.status(201).json(newBooking);
  } catch (error) {
    console.error("Error creating booking:", error);
    res.status(500).json({ error: "Error creating booking" });
  }
});

router.post("/arrived", async (req, res) => {
  try {
    const bookingId = req.query.bookingId;

    // Log incoming request data for debugging
    console.log("Received request to update booking to 'on board':", bookingId);

    // Check if bookingId is provided
    if (!bookingId) {
      console.error("Booking ID is missing in the request query");
      return res.status(400).json({ message: "Booking ID is required" });
    }

    // Find the booking by its ID
    const booking = await Booking.findById(bookingId);

    // Check if the booking exists
    if (!booking) {
      console.error("Booking not found for ID:", bookingId);
      return res.status(404).json({ message: "Booking not found" });
    }

    // Check if the booking status is accepted
    if (booking.status !== "accepted") {
      console.error(
        `Booking is not in 'accepted' status, unable to set to 'arrived'. Current status: ${booking.status}`
      );
      return res
        .status(400)
        .json({ message: "Booking is not available for 'arrived' status" });
    }

    // Update the booking status to "On board"
    booking.status = "Arrived";
    const updatedBooking = await booking.save();

    // Log successful status update
    console.log("Booking status updated to 'Arrived':", updatedBooking);

    // Respond with success
    res.status(200).json({ status: "ok", data: updatedBooking });
  } catch (error) {
    // Log any errors for debugging
    console.error("Error updating booking to 'on board':", error);
    res.status(500).json({ message: "Server Error" });
  }
});

router.post("/copassenger/arrived", async (req, res) => {
  try {
    // Destructure copassengerId from the request body
    const { copassengerId } = req.body;

    console.log("Received request to update copassenger to 'Arrived':", {
      copassengerId,
    });

    // Validate that copassengerId is provided
    if (!copassengerId) {
      return res.status(400).json({ message: "Copassenger ID is required" });
    }

    // Find the booking containing the copassenger
    const booking = await Booking.findOne({
      "copassengers._id": copassengerId,
    });
    if (!booking) {
      return res
        .status(404)
        .json({ message: "Booking not found for the provided copassenger ID" });
    }

    // Find the copassenger in the booking's copassengers array
    const copassenger = booking.copassengers.find(
      (c) => c._id.toString() === copassengerId
    );
    if (!copassenger) {
      return res
        .status(404)
        .json({ message: "Copassenger not found in booking" });
    }

    // Update the copassenger's status to "Arrived" only if it's not already "Arrived"
    if (copassenger.status == "accepted") {
      copassenger.status = "Arrived"; // Update the status
      await booking.save(); // Save the booking with the updated copassenger status
      console.log("Copassenger status updated to 'Arrived':", {
        copassengerId,
      });
    } else {
      console.log("Copassenger already marked as 'Arrived':", {
        copassengerId,
      });
    }

    // Respond with success and the updated booking
    res.status(200).json({
      status: "ok",
      message: "Copassenger status updated successfully",
      data: booking,
    });
  } catch (error) {
    console.error("Error updating copassenger to 'Arrived':", error);
    res.status(500).json({ message: "Server Error" });
  }
});

router.post("/onboard", async (req, res) => {
  try {
    // Retrieve bookingId from query parameters
    const bookingId = req.query.bookingId;

    // Log incoming request data for debugging
    console.log("Received request to update booking to 'on board':", bookingId);

    // Check if bookingId is provided
    if (!bookingId) {
      console.error("Booking ID is missing in the request query");
      return res.status(400).json({ message: "Booking ID is required" });
    }

    // Find the booking by its ID
    const booking = await Booking.findById(bookingId);

    // Check if the booking exists
    if (!booking) {
      console.error("Booking not found for ID:", bookingId);
      return res.status(404).json({ message: "Booking not found" });
    }

    // Check if the booking status is accepted
    if (booking.status !== "Arrived") {
      console.error(
        `Booking is not in 'arrived' status, unable to set to 'on board'. Current status: ${booking.status}`
      );
      return res
        .status(400)
        .json({ message: "Booking is not available for 'on board' status" });
    }

    // Update the booking status to "On board"
    booking.status = "On board";
    const updatedBooking = await booking.save();

    // Log successful status update
    console.log("Booking status updated to 'on board':", updatedBooking);

    // Respond with success
    res.status(200).json({ status: "ok", data: updatedBooking });
  } catch (error) {
    // Log any errors for debugging
    console.error("Error updating booking to 'on board':", error);
    res.status(500).json({ message: "Server Error" });
  }
});

router.post("/copassenger/onboard", async (req, res) => {
  try {
    // Destructure copassengerId from the request body
    const { copassengerId } = req.body;

    console.log("Received request to update copassenger to 'on board':", {
      copassengerId,
    });

    // Validate that copassengerId is provided
    if (!copassengerId) {
      return res.status(400).json({ message: "Copassenger ID is required" });
    }

    // Find the booking containing the copassenger
    const booking = await Booking.findOne({
      "copassengers._id": copassengerId,
    });
    if (!booking) {
      return res
        .status(404)
        .json({ message: "Booking not found for the provided copassenger ID" });
    }

    // Find the copassenger in the booking's copassengers array
    const copassenger = booking.copassengers.find(
      (c) => c._id.toString() === copassengerId
    );
    if (!copassenger) {
      return res.status(404).json({ message: "Copassenger not found" });
    }

    // Only update the copassenger's status if they are currently accepted
    if (copassenger.status === "Arrived") {
      copassenger.status = "On board"; // Update the copassenger's status
      await booking.save(); // Save the booking with the updated copassenger status
    }

    // Respond with success
    res.status(200).json({ status: "ok", data: booking });
  } catch (error) {
    console.error("Error updating copassenger to 'on board':", error);
    res.status(500).json({ message: "Server Error" });
  }
});

router.post("/dropoff", async (req, res) => {
  try {
    const { bookingId } = req.body;

    // Log incoming request data for debugging
    console.log("Received request to drop off booking:", bookingId);

    if (!bookingId) {
      console.error("Booking ID is missing in the request body");
      return res.status(400).json({ message: "Booking ID is required" });
    }

    // Find the booking by its ID
    const booking = await Booking.findById(bookingId);

    if (!booking) {
      console.error("Booking not found for ID:", bookingId);
      return res.status(404).json({ message: "Booking not found" });
    }

    if (booking.status !== "On board") {
      console.error(
        `Booking is not in 'on board' status, unable to drop off. Current status: ${booking.status}`
      );
      return res
        .status(400)
        .json({ message: "Booking is not available for drop-off" });
    }

    // Update the booking status to "dropped off"
    booking.status = "Dropped off";
    const updatedBooking = await booking.save();

    // Log successful status update
    console.log("Booking status updated to dropped off:", updatedBooking);

    res.status(200).json({ status: "ok", data: updatedBooking });
  } catch (error) {
    // Log any errors for debugging
    console.error("Error updating booking to dropped off:", error);
    res.status(500).json({ message: "Server Error" });
  }
});

router.post("/copassenger/dropoff", async (req, res) => {
  try {
    const { copassengerId } = req.body; // Using copassengerId instead

    if (!copassengerId) {
      return res.status(400).json({ message: "Copassenger ID is required" });
    }

    // Find the booking containing the copassenger
    const booking = await Booking.findOne({
      "copassengers._id": copassengerId,
    });
    if (!booking) {
      return res
        .status(404)
        .json({ message: "Booking not found for the provided copassenger ID" });
    }

    // Find the copassenger and update their status
    const copassenger = booking.copassengers.find(
      (c) => c._id.toString() === copassengerId
    );
    if (!copassenger) {
      return res.status(404).json({ message: "Copassenger not found" });
    }

    if (copassenger.status === "On board") {
      copassenger.status = "Dropped off";
      await booking.save(); // Save the updated booking
    } else {
      return res.status(400).json({ message: "Copassenger is not on board" });
    }

    res.status(200).json({ status: "ok", data: booking });
  } catch (error) {
    console.error("Error completing dropoff:", error);
    res.status(500).json({ message: "Server Error" });
  }
});

router.post("/complete", async (req, res) => {
  try {
    const { bookingId } = req.body;

    // Check if bookingId is provided
    if (!bookingId) {
      return res.status(400).json({ message: "Booking ID is required" });
    }

    // Find the main booking without populating co-passenger user details
    const booking = await Booking.findById(bookingId);
    if (!booking || booking.status !== "Dropped off") {
      return res.status(400).json({ message: "Booking not available" });
    }

    // Update the main booking to completed
    booking.status = "completed";

    // Update each co-passenger's status to completed
    if (booking.copassengers && booking.copassengers.length > 0) {
      booking.copassengers.forEach((copassenger) => {
        copassenger.status = "completed";
      });
    }

    // Save the updated main booking with completed co-passengers
    const updatedBooking = await booking.save(); // Ensure the booking is saved

    // Return the updated booking data
    res.status(200).json({ status: "ok", data: updatedBooking });
  } catch (error) {
    console.error("Error completing booking:", error);
    res.status(500).json({ message: "Server Error" });
  }
});

// Get booking by ID and populate driver information
router.get("/booking/:id", async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id).populate("driver");
    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }
    res.json(booking);
  } catch (err) {
    console.error("Error fetching booking:", err);
    res.status(500).json({ message: "Server Error" });
  }
});

router.get("/activities/:id", async (req, res) => {
  try {
    const userId = req.params.id;

    if (!userId) {
      return res.status(400).json({ message: "User ID is required" });
    }

    const activities = await Booking.find({ user: userId }).populate("driver");
    if (activities.length === 0) {
      return res
        .status(404)
        .json({ message: "No activities found for this user" });
    }

    res.status(200).json({ status: "ok", data: activities });
  } catch (error) {
    console.error("Error getting activities data:", error);
    res.status(500).json({ message: "Server Error" });
  }
});

router.get("/activities/driver/:driverId", async (req, res) => {
  try {
    const driverId = req.params.driverId;

    if (!driverId) {
      return res.status(400).json({ message: "Driver ID is required" });
    }

    const activities = await Booking.find({
      driver: driverId,
      status: { $in: ["accepted", "completed", "cancelled"] },
    });
    if (activities.length === 0) {
      return res
        .status(404)
        .json({ message: "No activities found for this driver" });
    }

    res.status(200).json({ status: "ok", data: activities });
  } catch (error) {
    console.error("Error getting activities data:", error);
    res.status(500).json({ message: "Server Error" });
  }
});
// Get passenger's Expo push token by booking ID
router.get("/booking/:id/passenger-token", async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }
    res.json({ expoPushToken: booking.passengerExpoPushToken }); // Assuming this field exists in your schema
  } catch (error) {
    console.error("Error fetching passenger token:", error);
    res.status(500).json({ message: "Server Error" });
  }
});

router.post("/update-driver-location", async (req, res) => {
  const { driverId, latitude, longitude } = req.body;

  try {
    const booking = await Booking.findOneAndUpdate(
      { driverId }, // Find by driverId
      { driverLocation: { latitude, longitude } },
      { new: true } // Return the updated document
    );

    if (!booking) {
      return res
        .status(404)
        .json({ message: "Booking not found for this driver" });
    }

    res.status(200).json({ message: "Driver location updated", booking });
  } catch (error) {
    console.error("Error updating driver location:", error);
    res.status(500).json({ message: "Error updating driver location", error });
  }
});

router.get("/driver-location/:driverId", async (req, res) => {
  const { driverId } = req.params;

  try {
    const booking = await Booking.findOne(
      { driver: driverId },
      "driverLocation"
    ); // Only retrieve the driverLocation field

    if (booking && booking.driverLocation) {
      res.status(200).json({ driverLocation: booking.driverLocation });
    } else {
      res.status(404).json({ message: "Driver location not found" });
    }
  } catch (error) {
    console.error("Error retrieving driver location:", error);
    res
      .status(500)
      .json({ message: "Error retrieving driver location", error });
  }
});
router.post("/update-booking", async (req, res) => {
  const bookingId = req.body._id; // Get the booking ID from request body

  try {
    const updatedBooking = await Booking.findByIdAndUpdate(
      bookingId,
      req.body,
      { new: true }
    );
    if (updatedBooking) {
      return res.status(200).json(updatedBooking);
    } else {
      return res.status(404).json({ message: "Booking not found." });
    }
  } catch (error) {
    console.error("Error updating booking:", error);
    return res.status(500).json({ message: "Error updating booking", error });
  }
});

router.post(
  "/choose-payment/:bookingId",
  upload.single("receiptImage"),
  async (req, res) => {
    const { bookingId } = req.params;
    const { paymentMethod } = req.body;

    try {
      // Find the booking by bookingId
      const booking = await Booking.findById(bookingId);

      if (!booking) {
        return res.status(404).json({ message: "Booking not found" });
      }

      // Update payment method
      booking.paymentMethod = paymentMethod;

      // If payment method is GCash and an image is uploaded
      if (paymentMethod === "GCash" && req.file) {
        // Resize the image using sharp
        const resizedImageBuffer = await sharp(req.file.buffer)
          .resize(800, 600) // Resize the image to 800x600 (adjust as necessary)
          .toBuffer(); // Get the resized image as a buffer

        // Convert the resized image buffer to base64
        const receiptImageBase64 = resizedImageBuffer.toString("base64");

        const receiptImage = {
          data: receiptImageBase64, // Store the resized image as base64
          contentType: req.file.mimetype, // Store the MIME type of the file
        };

        booking.receiptImage = receiptImage; // Save the image data in MongoDB
      } else if (paymentMethod === "Cash") {
        booking.receiptImage = null; // No image for cash payment
      }

      // Save the updated booking
      await booking.save();

      return res.status(200).json({
        message: "Payment method selected successfully",
        booking,
        receiptImage: req.file ? "Receipt stored in the database" : null, // Indicate image storage
      });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: "Server error" });
    }
  }
);

router.get("/receipt/:bookingId", async (req, res) => {
  const { bookingId } = req.params;

  try {
    const booking = await Booking.findById(bookingId);

    // Check if booking exists and has an image stored
    if (!booking || !booking.receiptImage || !booking.receiptImage.data) {
      return res.status(404).json({ message: "Receipt image not found" });
    }

    // Decode the base64 image and convert to buffer
    const imageBuffer = Buffer.from(booking.receiptImage.data, "base64"); // Decode base64 to buffer
    const contentType = booking.receiptImage.contentType;

    // Set the Content-Type to the image's MIME type
    res.setHeader("Content-Type", contentType);

    // Send the binary data as a response
    res.end(imageBuffer, "binary");
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error retrieving the image" });
  }
});

module.exports = router;

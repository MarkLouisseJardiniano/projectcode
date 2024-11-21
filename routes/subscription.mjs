const express = require("express");
const axios = require("axios");
require("dotenv").config(); // Load environment variables from .env file
const sharp = require("sharp");
const router = express.Router();
const Subscription = require("../schema/subscriptionSchema.js");
const Driver = require("../schema/drivers.js");
const { Storage } = require("@google-cloud/storage");
const storage = new Storage();
const path = require("path");
const multer = require("multer");
const upload = require("multer")();
const bucketName = "hatidbook";
router.post("/upload", upload.single("file"), async (req, res) => {
  try {
    const file = req.file;

    if (!file) {
      return res.status(400).send("No file uploaded");
    }

    const fileName = path.basename(file.originalname);
    const fileDestination = `images/${fileName}`;

    const bucket = storage.bucket(bucketName);
    const fileUpload = bucket.file(fileDestination);

    await fileUpload.save(file.buffer, {
      contentType: file.mimetype,
    });

    const [url] = await fileUpload.getSignedUrl({
      action: "read",
      expires: Date.now() + 24 * 60 * 60 * 1000, // URL expires in 24 hours
    });

    res.send({
      message: `Image uploaded to ${bucketName}/${fileDestination}`,
      signedUrl: url,
    });
  } catch (error) {
    console.error("Error during file upload:", error);
    res.status(500).send(`Error uploading the image: ${error.message}`);
  }
});

router.get("/generate-url", async (req, res) => {
  try {
    const fileName = "images/image.jpg"; // Adjust the file name based on your needs
    const [url] = await storage.bucket(bucketName).file(fileName).getSignedUrl({
      action: "read",
      expires: "03-01-2025",
    });
    console.log("Generated signed URL:", url);
    res.send(`The signed URL is: ${url}`);
  } catch (error) {
    console.error(error);
    res.status(500).send("Error generating signed URL");
  }
});

router.get("/subscription", async (req, res) => {
  try {
    const subscriptions = await Subscription.find();
    res.json(subscriptions);
  } catch (err) {
    console.error("Error fetching subscriptions:", err);
    res.status(500).json({ message: "Server Error" });
  }
});

router.get("/subscription/:driverId", async (req, res) => {
  try {
    const { driverId } = req.params;

    if (driverId) {
      const subscription = await Subscription.findOne({ driver: driverId });

      if (!subscription) {
        return res.status(404).json({ message: "Subscription not found" });
      }

      return res.json(subscription);
    }

    // If no driverId is provided, return all subscriptions
    const subscriptions = await Subscription.find();
    res.json(subscriptions);
  } catch (err) {
    console.error("Error fetching subscriptions:", err);
    res.status(500).json({ message: "Server Error" });
  }
});

router.get("/subscription/status/:driverId", async (req, res) => {
  try {
    const driverId = req.params.driverId;
    const subscription = await Subscription.findOne({ driver: driverId });

    if (!subscription || subscription.endDate < new Date()) {
      return res.status(200).json({ subscribed: false });
    }

    res.status(200).json({ subscribed: true });
  } catch (error) {
    console.error("Error checking subscription status:", error);
    res.status(500).json({ message: "Server Error" });
  }
});

router.get("/subscription/end-date/:driverId", async (req, res) => {
  try {
    const driverId = req.params.driverId;
    const subscription = await Subscription.findOne({ driver: driverId });

    if (!subscription) {
      return res
        .status(200)
        .json({ subscribed: false, remainingTime: "Expired" });
    }

    const currentDate = new Date();
    const endDate = new Date(subscription.endDate);

    // If the subscription has ended, return "Expired"
    if (endDate < currentDate) {
      return res
        .status(200)
        .json({ subscribed: false, remainingTime: "Expired" });
    }

    const remainingTimeMs = endDate - currentDate;

    const daysRemaining = Math.floor(remainingTimeMs / (1000 * 60 * 60 * 24));
    const hoursRemaining = Math.floor(
      (remainingTimeMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
    );
    const minutesRemaining = Math.floor(
      (remainingTimeMs % (1000 * 60 * 60)) / (1000 * 60)
    );

    const formattedRemainingTime = `${daysRemaining} days, ${hoursRemaining} hours`;

    res.status(200).json({
      remainingTime: formattedRemainingTime,
    });
  } catch (error) {
    console.error("Error checking subscription status:", error);
    res.status(500).json({ message: "Server Error" });
  }
});

router.get("/subscription/type/:driverId", async (req, res) => {
  try {
    const driverId = req.params.driverId;
    const subscription = await Subscription.findOne({ driver: driverId });

    if (!subscription) {
      return res.status(200).json({ subscriptionType: null });
    }
    res.status(200).json({
      subscriptionType: subscription.subscriptionType,
    });
  } catch (error) {
    console.error("Error checking subscription status:", error);
    res.status(500).json({ message: "Server Error" });
  }
});
router.post("/subscription", async (req, res) => {
  try {
    const { driverId, subscriptionType, vehicleType } = req.body;

    console.log("Received subscription request:", {
      driverId,
      subscriptionType,
      vehicleType,
    });

    // Validate the required fields
    if (!driverId || !subscriptionType || !vehicleType) {
      console.log("Missing required fields");
      return res.status(400).json({ message: "Missing required fields" });
    }

    // Find the driver from the database
    const driver = await Driver.findById(driverId);
    if (!driver) {
      console.log("Driver not found:", driverId);
      return res.status(404).json({ message: "Driver not found" });
    }

    // Check for any existing active or pending subscriptions
    const existingSubscription = await Subscription.findOne({
      driver: driverId,
      endDate: { $gte: new Date() },
      status: { $in: ["Pending", "Active"] },
    });

    if (existingSubscription) {
      console.log(
        "Driver already has an active or pending subscription:",
        existingSubscription
      );
      return res
        .status(400)
        .json({
          message: "Driver already has an active or pending subscription",
        });
    }

    // Set subscription dates and name based on the subscription type
    const now = new Date();
    let endDate;
    let subscriptionName;

    if (subscriptionType === "Free") {
      endDate = new Date(now.setDate(now.getDate() + 7));
      subscriptionName = "1-Week Free Trial";
    } else if (subscriptionType === "Monthly") {
      endDate = new Date(now.setMonth(now.getMonth() + 1));
      subscriptionName = "1-Month Subscription";
    } else if (subscriptionType === "Quarterly") {
      endDate = new Date(now.setMonth(now.getMonth() + 3));
      subscriptionName = "Quarterly Subscription";
    } else if (subscriptionType === "Annually") {
      endDate = new Date(now.setFullYear(now.getFullYear() + 1));
      subscriptionName = "Annual Subscription";
    } else {
      console.log("Invalid subscription type:", subscriptionType);
      return res.status(400).json({ message: "Invalid subscription type" });
    }

    // Validate vehicle type
    if (!["Jeep", "Tricycle"].includes(vehicleType)) {
      console.log("Invalid vehicle type:", vehicleType);
      return res.status(400).json({ message: "Invalid vehicle type" });
    }

    // Define pricing
    const pricing = {
      Jeep: {
        None: 0,
        Free: 0,
        Monthly: 499,
        Quarterly: 1499,
        Annually: 4799,
      },
      Tricycle: {
        None: 0,
        Free: 0,
        Monthly: 399,
        Quarterly: 1299,
        Annually: 4599,
      },
    };

    // Calculate the price based on the vehicle and subscription type
    const price = pricing[vehicleType][subscriptionType];
    console.log("Calculated price:", price);

    // Create the new subscription record in the database (status is "Pending" until payment is confirmed)
    const newSubscription = new Subscription({
      driver: driverId,
      subscriptionType,
      subscriptionName,
      startDate: new Date(),
      endDate,
      vehicleType,
      status: "Pending", // Status is Pending until payment is confirmed
      price, // Set the price based on the subscription type
    });

    // Save the new subscription to the database
    await newSubscription.save();

    // Return the subscription data without PayMongo integration
    res.status(201).json({
      subscription: newSubscription,
      message:
        "Subscription created successfully, waiting for payment confirmation",
    });
  } catch (error) {
    console.error("Error creating subscription:", error);
    res.status(500).json({ error: "Error creating subscription" });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const user = await Subscription.findByIdAndDelete(id); // Using `findByIdAndDelete` to remove the user by ID

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({ message: "User deleted successfully" });
  } catch (err) {
    console.error("Error deleting user by ID:", err);
    res.status(500).json({ message: "Server Error" });
  }
});

router.post("/payment-accept", async (req, res) => {
  try {
    const { subscriptionId } = req.body;

    if (!subscriptionId) {
      return res.status(400).json({ message: "SubscriptionId not found" });
    }

    const subscription = await Subscription.findById(subscriptionId);

    if (!subscription) {
      return res.status(404).json({ message: "Subscription not found" });
    }

    subscription.status = "Active";
    await subscription.save();

    return res.status(200).json(subscription);
  } catch (error) {
    console.error("Error updating subscription status:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
});

router.post("/subscription/expire", async (req, res) => {
  try {
    const now = new Date();
    console.log("Current Date and Time:", now.toISOString());

    const expiredSubscriptions = await Subscription.find({
      endDate: { $lt: now },
      status: { $in: ["Pending", "Active"] },
    });

    console.log("Expired Subscriptions Found:", expiredSubscriptions);

    const updateResult = await Subscription.updateMany(
      { endDate: { $lt: now }, status: { $in: ["Pending", "Active"] } },
      { $set: { status: "Ended" } }
    );

    console.log("Update Result:", updateResult);

    res
      .status(200)
      .json({
        message: `${updateResult.matchedCount} subscriptions updated to "Ended"`,
      });
  } catch (error) {
    console.error("Error updating expired subscriptions:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

module.exports = router;

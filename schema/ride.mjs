const mongoose = require("mongoose");

const bookingSchema = new mongoose.Schema({
  name: { type: String, required: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }, // The main user who created the booking
  driver: { type: mongoose.Schema.Types.ObjectId, ref: "Driver" },
  pickupLocation: {
    latitude: { type: Number, required: true },
    longitude: { type: Number, required: true },
  },
  destinationLocation: {
    latitude: { type: Number, required: true },
    longitude: { type: Number, required: true },
  },
  driverLocation: {
    latitude: { type: Number },
    longitude: { type: Number },
  },
  vehicleType: {
    type: String,
    enum: ["Tricycle", "Jeep"],
    required: true,
  },
  rideType: {
    type: String,
    enum: ["Special", "Shared Ride"],
    required: true,
  },
  rideAction: {
    type: String,
    enum: ["Create", "Join"],
    required: function () {
      return this.rideType === "Shared Ride";
    },
  },
  fare: {
    type: Number,
    required: true,
  },

  copassengers: [
    {
      userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      name: { type: String, required: true },
      pickupLocation: {
        latitude: { type: Number, required: true },
        longitude: { type: Number, required: true },
      },
      destinationLocation: {
        latitude: { type: Number, required: true },
        longitude: { type: Number, required: true },
      },
      fare: { type: Number, required: true },
      rideType: {
        type: String,
        enum: ["Shared Ride"],
        required: true,
      },
      rideAction: {
        type: String,
        enum: ["Join"],
        required: function () {
          return this.rideType === "Shared Ride"; // Only required if rideType is "Shared Ride"
        },
        default: "Join", // Default to "Join" if rideType is "Shared Ride"
      },
      status: {
        type: String,
        enum: [
          "pending",
          "accepted",
          "Arrived",
          "On board",
          "Dropped off",
          "completed",
          "canceled",
        ],
        default: "pending",
      },
    },
  ],
  parentBooking: { type: mongoose.Schema.Types.ObjectId, ref: "Booking" }, // Reference to the parent booking
  status: {
    type: String,
    enum: [
      "pending",
      "accepted",
      "Arrived",
      "On board",
      "Dropped off",
      "completed",
      "canceled",
    ],
    default: "pending",
  },
  driverRating: {
    averageRating: { type: Number, default: null },
  },
  createdAt: { type: Date, default: Date.now },
  paymentMethod: {
    type: String,
    enum: ["Cash", "GCash"],
    default: null, // Initially null during booking creation
    validate: {
      validator: function (v) {
        if (this.status === "completed" && v === null) {
          return false;
        }
        return true; 
      },
    },
  },
  receiptImage: {
    data: String,  // Store image as base64 encoded string
    contentType: String,  // Store MIME type
  },
});

module.exports = mongoose.model("Booking", bookingSchema);

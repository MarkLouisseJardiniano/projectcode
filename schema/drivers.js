const mongoose = require("mongoose");
const vehicleInfo2Schema = require("./vehicleInfo2.js");

const driverSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Name is required"],
  },
  email: {
    type: String,
    required: [true, "Email is required"],
    unique: true,
  },
  password: {
    type: String,
    required: [true, "Password is required"],
  },
  number: {
    type: String,
    required: [true, "Phone number is required"],
    match: [/^\d{7,15}$/, "Phone number must be between 7 and 15 digits"],
  },
  birthday: {
    type: Date,
    required: [true, "Birthday is required"],
  },
  address: {
    type: String,
    required: [true, "Address is required"],
  },
  vehicleInfo2: {
    type: vehicleInfo2Schema,
    required: [true, "Vehicle info 2 is required"],
  },

  accountVerified: {
    type: String,
    enum: ["pending", "approved", "rejected"],
    default: "pending", // Default status is "pending"
  },
  createdAt: { type: Date, default: Date.now },
});

const Driver = mongoose.model("Driver", driverSchema);

module.exports = Driver;

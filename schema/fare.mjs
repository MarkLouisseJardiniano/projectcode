const mongoose = require("mongoose");

const fareSchema = new mongoose.Schema({
  vehicleType: { type: String, enum: ["Tricycle", "Jeep"], required: true },
  baseFare: { type: Number, required: true },
  farePerKm: { type: Number, required: true }, // Fare per kilometer
  bookingFee: { type: Number, required: true },
});

module.exports = mongoose.model("Fare", fareSchema);

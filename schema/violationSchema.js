const mongoose = require("mongoose");

const violationSchema = new mongoose.Schema({
  booking: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Booking',
    required: true
  },
  driver: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Driver',
    required: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  report: {
    type: String,
    enum: ["Harassment", "Unsafe Driving", "Lateness", "Vehicle Condition", "Rudeness"]
  },
  description : {
    type: String
  },
  createdAt: { type: Date, default: Date.now },
});

const Violation = mongoose.model("Violation", violationSchema);

module.exports = Violation;

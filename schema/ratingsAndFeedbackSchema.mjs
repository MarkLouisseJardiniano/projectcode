const mongoose = require("mongoose");

const ratingsAndFeedbacksSchema = new mongoose.Schema({
  booking: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Booking",
    required: true,
  },
  driver: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Driver",
    required: true,
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5,
  },
  feedback: {
    type: String,
  },
  createdAt: { type: Date, default: Date.now },
});

const RatingsAndFeedbacks = mongoose.model(
  "RatingsAndFeedbacks",
  ratingsAndFeedbacksSchema
);

module.exports = RatingsAndFeedbacks;

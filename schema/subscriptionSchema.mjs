const mongoose = require("mongoose");

const subscriptionSchema = new mongoose.Schema({
  driver: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Driver",
    required: true,
  },
  subscriptionType: {
    type: String,
    required: true,
    enum: [ "Free", "Monthly", "Quarterly", "Annually"],
    default: "Free",
  },
  subscriptionName: {
type: String,
enum: ["1-Week Free Trial", "1-Month Subscription", "Quarterly Subscription", "Annual Subscription" ]
  },

  startDate: {
    type: Date,
    required: true,
  },
  endDate: {
    type: Date,
    required: true,
  },
  vehicleType: {
    type: String,
    required: true,
    enum: ["Jeep", "Tricycle"],
  },
  status: {
    type: String,
    enum: ["Pending", "Active", "Ended", "Cancelled"],
    default: "Pending",
  },
  price: {
    type: Number,
    required: true,
  },
});


const Subscription = mongoose.model("Subscription", subscriptionSchema);

module.exports = Subscription;

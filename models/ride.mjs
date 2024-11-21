const mongoose = require("mongoose");
const rideSchema = require("../schema/ride");

const RideModel = mongoose.model("Ride", rideSchema);

module.exports = RideModel;

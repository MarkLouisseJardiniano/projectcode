const mongoose = require("mongoose");

const vehicleInfo1Schema = new mongoose.Schema({
  or: {
    type: String,
    required: true
  },
  cr: {
    type: String,
    required: true
  },
  vehicleFront: {
    type: String,
    required: true
  },
  vehicleBack: {
    type: String,
    required: true
  },
  vehicleRight: {
    type: String,
    required: true
  },
  vehicleLeft: {
    type: String,
    required: true
  }
});

module.exports = vehicleInfo1Schema;

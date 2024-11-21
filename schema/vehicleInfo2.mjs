const mongoose = require("mongoose");

const vehicleInfo2Schema = new mongoose.Schema({
  vehicleType: {
    type: String,
    required: true
  },
  model: {
    type: String,
    required: true
  },
  year: {
    type: String,
    required: true
  },
  color: {
    type: String,
    required: true
  },
  plateNumber: {
    type: String,
    required: true
  },
  capacity: {
    type: String,
    required: true
  }
});

module.exports = vehicleInfo2Schema;

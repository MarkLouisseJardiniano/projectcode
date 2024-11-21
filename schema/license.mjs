const mongoose = require("mongoose");

const licenseSchema = new mongoose.Schema({
  licenseFront: {
    type: String,
    required: true
  },
  licenseBack: {
    type: String,
    required: true
  }
});

module.exports = licenseSchema;

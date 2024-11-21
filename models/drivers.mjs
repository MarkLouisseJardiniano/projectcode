const mongoose = require('mongoose');
const driverSchema = require('../schema/drivers');

const DriverModel = mongoose.model('Driver', driverSchema);

module.exports = DriverModel;
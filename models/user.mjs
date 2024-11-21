const mongoose = require('mongoose');
const authSchema = require('../schema/auth');

const UserModel = mongoose.model('User', authSchema);

module.exports = UserModel;
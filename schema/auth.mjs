const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: true
  },
  number: {
    type: String,
    required: true,
    match: [/^\d{7,15}$/, 'Phone number must be between 7 and 15 digits'],
  },
  birthday: {
    type: String,
    required: true
  },
  address: {
    type: String,
    required: true
  },
isVerified: { type: Boolean, default: false }, 
  createdAt: { type: Date, default: Date.now },
});

const User = mongoose.model('User', userSchema);

module.exports = User;

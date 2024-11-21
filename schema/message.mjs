const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema({
  senderId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    refPath: "senderModel", // Dynamically refer to either 'User' or 'Driver'
  },
  senderModel: {
    type: String,
    required: true,
    enum: ["User", "Driver"], // Sender can be either 'User' or 'Driver'
  },
  recepientId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    refPath: "recepientModel", // Dynamically refer to either 'User' or 'Driver'
  },
  recepientModel: {
    type: String,
    required: true,
    enum: ["User", "Driver"], // Recipient can be either 'User' or 'Driver'
  },
  message: {
    type: String,
    required: true, // Ensure the message content is always provided
  },
  createdAt: {
    type: Date,
    default: Date.now, // Automatically set timestamp
  },
});

const Message = mongoose.model("Message", messageSchema);

module.exports = Message;

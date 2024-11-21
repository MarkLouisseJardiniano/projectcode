const User = require("../schema/auth.mjs");
const Message = require("../schema/message.mjs");
const Driver = require("../schema/drivers.mjs");
const express = require("express");
const router = express.Router();

router.post("/send-messages", async (req, res) => {
  try {
    const { senderId, recepientId, message } = req.body;

    // Validate input
    if (!senderId || !recepientId || !message) {
      return res.status(400).json({
        error: "All fields are required: senderId, recepientId, and message.",
      });
    }

    // Determine sender and recipient model
    const sender =
      (await User.findById(senderId)) || (await Driver.findById(senderId));
    const recepient =
      (await User.findById(recepientId)) ||
      (await Driver.findById(recepientId));

    if (!sender || !recepient) {
      return res.status(404).json({ error: "Sender or recipient not found." });
    }

    const senderModel = sender instanceof User ? "User" : "Driver";
    const recepientModel = recepient instanceof User ? "User" : "Driver";

    // Create a new message
    const newMessage = new Message({
      senderId,
      senderModel,
      recepientId,
      recepientModel,
      message,
    });

    // Save to the database
    await newMessage.save();

    res
      .status(200)
      .json({ message: "Message sent successfully", data: newMessage });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.get("/user/:userId", async (req, res) => {
  try {
    const { userId } = req.params;

    //fetch the user data from the user ID
    const recepientId = await User.findById(userId);

    res.json(recepientId);
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.get("/messages/:senderId/:recepientId", async (req, res) => {
  try {
    const { senderId, recepientId } = req.params;

    // Fetch messages where either party is the sender or recipient
    const messages = await Message.find({
      $or: [
        { senderId: senderId, recepientId: recepientId },
        { senderId: recepientId, recepientId: senderId },
      ],
    })
      .populate("senderId", "_id name")
      .populate("recepientId", "_id name");

    // If no messages are found
    if (!messages.length) {
      return res.status(404).json({ error: "No messages found" });
    }

    // Return the list of messages
    res.json(messages);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

//endpoint to delete the messages!
router.post("/deleteMessages", async (req, res) => {
  try {
    const { messages } = req.body;

    if (!Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ message: "invalid req body!" });
    }

    await Message.deleteMany({ _id: { $in: messages } });

    res.json({ message: "Message deleted successfully" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Internal Server" });
  }
});

module.exports = router;

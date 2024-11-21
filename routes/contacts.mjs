const express = require("express");
const router = express.Router();
const Contact = require("../schema/contacts.mjs");

const sampleContacts = [
  { _id: "1", name: "BFP", number: "1234567890" },
  { _id: "2", name: "PNP", number: "0987654321" },
];

router.get("/", async (req, res) => {
  try {
    const contacts = await Contact.find();
    res.json(contacts);
  } catch (err) {
    console.error("Error fetching contacts:", err);
    res.status(500).json({ message: "Server Error" });
  }
});

// POST a new contact
router.post("/add", async (req, res) => {
  const { userId, name, number } = req.body;

  // Check if any of the fields are missing
  if (!userId || !name || !number) {
    return res.status(400).json({ error: "All fields are required" });
  }

  try {
    const newContact = new Contact({
      user: userId,
      name,
      number,
    });

    await newContact.save();
    res.status(201).json({
      message: "Added Contact Successfully",
      data: newContact,
    });
  } catch (error) {
    console.error("Error adding contact:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.get("/user/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const userContacts = await Contact.find({ user: userId });

    // Combine the sample contacts with the user's actual contacts
    const allContacts = [...sampleContacts, ...userContacts];

    // Return both sample and user contacts
    res.json(allContacts);
  } catch (error) {
    console.error("Error fetching contacts by user ID:", error);
    res.status(500).json({ error: "Failed to fetch contacts" });
  }
});

router.post("/driver/add", async (req, res) => {
  const { driverId, name, number } = req.body;

  // Check if any of the fields are missing
  if (!driverId || !name || !number) {
    return res.status(400).json({ error: "All fields are required" });
  }

  try {
    const newContact = new Contact({
      user: driverId,
      name,
      number,
    });

    await newContact.save();
    res.status(201).json({
      message: "Added Contact Successfully",
      data: newContact,
    });
  } catch (error) {
    console.error("Error adding contact:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.get("/driver/:driverId", async (req, res) => {
  try {
    const { driverId } = req.params;
    const driverContacts = await Contact.find({ user: driverId });

    // Combine the sample contacts with the user's actual contacts
    const allContacts = [...sampleContacts, ...driverContacts];

    // Return both sample and user contacts
    res.json(allContacts);
  } catch (error) {
    console.error("Error fetching contacts by user ID:", error);
    res.status(500).json({ error: "Failed to fetch contacts" });
  }
});

module.exports = router;

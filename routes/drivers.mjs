const express = require("express");
const nodemailer = require("nodemailer");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const Driver = require("../schema/drivers.mjs");

const router = express.Router();
const JWT_SECRET = "IWEFHsdfIHCW362weg47HGV3GB4678{]JKAsadFIH";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "ride.hatid@gmail.com",
    pass: "zdhy lyfc zgll dddo",
  },
});

router.post("/send-email", async (req, res) => {
  const { email, name } = req.body;

  const mailOptions = {
    from: "ride.hatid@gmail.com",
    to: email,
    subject: "Document Submission Acknowledgment",
    text: `Dear ${name},

I hope you're doing well. This is a reminder to kindly submit the required documents in person at our office.

The documents that need to be submitted are as follows:

• Driver's License
• Vehicle Registration Documents (OR/CR)
• Proof of Vehicle Insurance
• Police Clearance

Please bring all the necessary documents for processing. Our office is located at:

Isok 1, Boac, Marinduque

If you have any questions or need further assistance, feel free to contact us.

Thank you for your cooperation.

Best regards,
The Hatid Team 

`,
  };

  try {
    // Send email
    await transporter.sendMail(mailOptions);
    res.status(200).json({ message: "Email sent successfully" });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ message: "Failed to send email", error: error.message });
  }
});

router.get("/", async (req, res) => {
  try {
    const drivers = await Driver.find();
    res.json(drivers);
  } catch (err) {
    console.error("Error fetching drivers:", err);
    res.status(500).json({ message: "Server Error" });
  }
});

router.get("/applicants", async (req, res) => {
  try {
    // Fetch drivers with 'accountVerified' status set to 'pending'
    const pendingDrivers = await Driver.find({ accountVerified: "pending" });

    if (pendingDrivers.length === 0) {
      return res.status(404).json({ message: "No pending accounts found" });
    }

    // Respond with the list of pending drivers
    res.json(pendingDrivers);
  } catch (err) {
    console.error("Error fetching pending drivers:", err);
    res.status(500).json({ message: "Server Error" });
  }
});

router.get("/approved-drivers", async (req, res) => {
  try {
    // Fetch drivers with 'accountVerified' status set to 'pending'
    const approvedDrivers = await Driver.find({ accountVerified: "approved" });

    if (approvedDrivers.length === 0) {
      return res.status(404).json({ message: "No approved accounts found" });
    }

    // Respond with the list of pending drivers
    res.json(approvedDrivers);
  } catch (err) {
    console.error("Error fetching pending drivers:", err);
    res.status(500).json({ message: "Server Error" });
  }
});
router.post("/approve-driver/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const updatedDriver = await Driver.findByIdAndUpdate(
      id,
      { accountVerified: "approved" },
      { new: true }
    );

    if (!updatedDriver) {
      return res.status(404).json({ message: "Driver not found" });
    }

    res.json({
      message: "Driver approved successfully",
      driver: updatedDriver,
    });
  } catch (err) {
    console.error("Error approving driver:", err);
    res.status(500).json({ message: "Server Error" });
  }
});

router.get("/driver/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const drivers = await Driver.findById(id);

    if (!drivers) {
      return res.status(404).json({ message: "Driver not found" });
    }

    res.json(drivers);
  } catch (err) {
    console.error("Error fetching drive by ID:", err);
    res.status(500).json({ message: "Server Error" });
  }
});

router.delete("/driver/:id", async (req, res) => {
  try {
    const { id } = req.params; // Extract the ID from the URL parameter

    // Attempt to delete the driver by their ID
    const driver = await Driver.deleteOne({ _id: id });

    // Check if a driver was deleted
    if (driver.deletedCount === 0) {
      return res.status(404).json({ message: "Driver not found" });
    }

    // Respond with a success message
    res.json({ message: "Driver deleted successfully" });
  } catch (err) {
    console.error("Error deleting driver:", err);
    res.status(500).json({ message: "Server Error" });
  }
});

router.post("/driver-signup", async (req, res) => {
  try {
    // Log the incoming request body to see what data is being received
    console.log("Request Body:", req.body);

    const { name, email, password, number, birthday, address, vehicleInfo2 } =
      req.body;

    // Validate that all required fields are provided
    if (
      !name ||
      !email ||
      !password ||
      !number ||
      !birthday ||
      !address ||
      !vehicleInfo2
    ) {
      return res.status(400).json({ message: "All fields are required" });
    }

    // Check if a driver with the same email already exists
    let driver = await Driver.findOne({ email });
    if (driver) {
      return res.status(400).json({ message: "Driver already exists" });
    }

    // Hash the password before saving it to the database
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create a new driver instance with the received data
    driver = new Driver({
      name,
      email,
      password: hashedPassword,
      number,
      birthday,
      address,
      vehicleInfo2,
    });

    // Save the new driver to the database
    await driver.save();

    // Respond with success if the driver is created successfully
    res
      .status(201)
      .json({ message: "Driver created successfully", name: driver.name });
  } catch (error) {
    // Log the error details for debugging
    console.error("Error during signup:", error);

    // Send a more detailed error response if available, or a generic server error
    res.status(500).json({ message: error.message || "Server Error" });
  }
});

router.post("/check-email", async (req, res) => {
  try {
    const { email } = req.body;

    const driver = await Driver.findOne({ email });

    if (driver) {
      return res.json({ exists: true });
    }

    // If no driver is found, return { exists: false }
    res.json({ exists: false });
  } catch (error) {
    console.error("Error checking email:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// Login route
router.post("/driver-login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const driver = await Driver.findOne({ email });
    if (!driver) {
      return res.status(400).json({ message: "Invalid Credentials" });
    }
    if (!driver.accountVerified) {
      return res.status(400).json({
        message:
          "Account not verified. Please check your email for verification.",
      });
    }

    const isMatch = await bcrypt.compare(password, driver.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid Credentials" });
    }

    const token = jwt.sign({ email: driver.email }, JWT_SECRET);
    res.status(200).json({
      status: "ok",
      data: {
        token,
        driverId: driver._id,
      },
    });
  } catch (error) {
    console.error("Error during login:", error);
    res.status(500).json({ message: "Server Error" });
  }
});

// Get user data route
router.post("/driverdata", async (req, res) => {
  try {
    const { token } = req.body;
    const decoded = jwt.verify(token, JWT_SECRET);
    const driver = await Driver.findOne({ email: decoded.email });
    if (!driver) {
      return res.status(404).json({ message: "Driver not found" });
    }
    res.status(200).json({ status: "ok", data: driver });
  } catch (error) {
    console.error("Error retrieving driver data:", error);
    res.status(500).json({ message: "Server Error" });
  }
});

// Update user data route
router.put("/editdriver/:id", async (req, res) => {
  try {
    const driverId = req.params.id;
    const { name, number, email } = req.body;

    const updatedDriver = await Driver.findByIdAndUpdate(
      driverId,
      { name, number, email },
      { new: true }
    );
    if (!updatedDriver) {
      return res.status(404).json({ message: "User not found" });
    }
    res.status(200).json({ status: "ok", data: updatedDriver });
  } catch (error) {
    console.error("Error updating user data:", error);
    res.status(500).json({ message: "Server Error" });
  }
});

module.exports = router;

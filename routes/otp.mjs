// routes/otp.js
const express = require("express");
const router = express.Router();
const Otp = require("../schema/otp.js");
const nodemailer = require("nodemailer");
const crypto = require("crypto");
const User = require("../schema/auth.js");
const Driver = require("../schema/drivers.js");

// Configure nodemailer
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "ride.hatid@gmail.com",
    pass: "zdhy lyfc zgll dddo",
  },
});

router.post("/generate-driver-otp", async (req, res) => {
  const { email, name } = req.body;
  const otp = crypto.randomInt(100000, 999999).toString();

  const mailOptions = {
    from: "ride.hatid@gmail.com",
    to: email,
    subject: "Your OTP Code",
    text: `Dear ${name},

Thank you for using Hatid — your trusted ride-hailing app!

We received a request to verify your identity. To complete the verification process, please use the following One-Time Password (OTP):

Your OTP Code: ${otp}

This code is valid for the next 10 minutes. Please do not share this code with anyone.

If you did not request this OTP or suspect an error, please contact our support team immediately at [Support Email].

Best regards,  
The Hatid Team`,
  };

  transporter.sendMail(mailOptions, async (error, info) => {
    if (error) {
      return res.status(500).json({ error: "Error sending email" });
    } else {
      const newOtp = new Otp({ email, otp });
      await newOtp.save();
      res.status(200).json({ message: "OTP sent successfully" });
    }
  });
});

router.post("/driver-verify-otp", async (req, res) => {
  const { email, otp } = req.body;

  try {
    const existingOtp = await Otp.findOne({ email, otp });
    if (!existingOtp) {
      return res.status(400).json({ error: "Invalid or expired OTP" });
    }
    await Otp.deleteOne({ email, otp });

    // Step 4: Return success message
    res.status(200).json({ message: "OTP verified and user is now verified" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/generate-otp", async (req, res) => {
  const { email, name } = req.body;
  const otp = crypto.randomInt(100000, 999999).toString();

  const mailOptions = {
    from: "ride.hatid@gmail.com",
    to: email,
    subject: "Your OTP Code",
    text: `Dear ${name},

Thank you for using Hatid — your trusted ride-hailing app!

We received a request to verify your identity. To complete the verification process, please use the following One-Time Password (OTP):

Your OTP Code: ${otp}

This code is valid for the next 10 minutes. Please do not share this code with anyone.

If you did not request this OTP or suspect an error, please contact our support team immediately at [Support Email].

Best regards,  
The Hatid Team  `,
  };

  transporter.sendMail(mailOptions, async (error, info) => {
    if (error) {
      return res.status(500).json({ error: "Error sending email" });
    } else {
      const newOtp = new Otp({ email, otp });
      await newOtp.save();
      res.status(200).json({ message: "OTP sent successfully" });
    }
  });
});

router.post("/verify-otp", async (req, res) => {
  const { email, otp } = req.body;

  try {
    // Step 1: Find the OTP
    const existingOtp = await Otp.findOne({ email, otp });
    if (!existingOtp) {
      return res.status(400).json({ error: "Invalid or expired OTP" });
    }

    // Step 2: Mark the user as verified
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ error: "User not found" });
    }

    if (user.isVerified) {
      return res.status(400).json({ error: "User already verified" });
    }

    user.isVerified = true; // Set the user as verified
    await user.save();

    // Step 3: Delete OTP after successful verification
    await Otp.deleteOne({ email, otp });

    // Step 4: Return success message
    res.status(200).json({ message: "OTP verified and user is now verified" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;

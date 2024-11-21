import express from "express";
import bodyParser from "body-parser";
import { connectDB } from "./config.mjs";
import dotenv from "dotenv";
const router = require("./routes/auth.mjs");
const driverRouter = require("./routes/drivers.mjs");
const rideRouter = require("./routes/ride.mjs");
const fareRouter = require("./routes/fare.mjs");
const subsRouter = require("./routes/subscription.mjs");
const ratingRouter = require("./routes/ratingsAndFeedback.mjs");
const violateRouter = require("./routes/violation.mjs");
const savedPlacesRouter = require("./routes/savedPlaces.mjs");
const contactRouter = require("./routes/contacts.mjs");
const otpRoutes = require("./routes/otp.mjs");
const messageRoutes = require("./routes/message.mjs");
const documentRouter = require("./routes/documentRequirement.mjs");

dotenv.config();

const app = express();
const port = process.env.PORT || 8080;

// Middleware
app.use(bodyParser.json());

// Connect to MongoDB
connectDB();

// Routes

app.use("/api", router);
app.use("/api/driver", driverRouter);
app.use("/api/ride", rideRouter);
app.use("/api/admin-fare", fareRouter);
app.use("/api/subs", subsRouter);
app.use("/api/rate", ratingRouter);
app.use("/api/violate", violateRouter);
app.use("/api/saved", savedPlacesRouter);
app.use("/api/contact", contactRouter);
app.use("/api/otp", otpRoutes);
app.use("/api/message", messageRoutes);
app.use("/api/requirements", documentRouter);

// Start server
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

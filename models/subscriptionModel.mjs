const mongoose = require("mongoose");
const subscriptionSchema = require("../schema/subscriptionSchema");

const subscriptionModel = mongoose.model("Subs", subscriptionSchema);

module.exports = subscriptionModel;

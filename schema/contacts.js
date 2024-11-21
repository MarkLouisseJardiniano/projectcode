const mongoose = require("mongoose");

const contactSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
 },
    name: {
        type: String,
        required: true
    },
  number: {
    type: String,
    required: true
  },
  createdAt: { type: Date, default: Date.now },

});

module.exports = mongoose.model("contactSchema", contactSchema);

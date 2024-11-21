const mongoose = require("mongoose");

const savedPlaceSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
 },
    placeType: {
        type: String,
        enum: ['Home','Work', 'New'],
        required: true
    },
  savedLocation: {
    latitude: { type: Number, required: true },
    longitude: { type: Number, required: true },
  },
  createdAt: { type: Date, default: Date.now },

});

module.exports = mongoose.model("SavedPlace", savedPlaceSchema);

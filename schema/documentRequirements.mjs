// models/DocumentReminder.js
const mongoose = require('mongoose');

const DocumentRequirementSchema = new mongoose.Schema({
  documentName: { type: String, required: true },  
});

const DocumentReminder = mongoose.model('DocumentRequirement', DocumentRequirementSchema);

module.exports = DocumentReminder;

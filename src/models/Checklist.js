const mongoose = require('mongoose');

const checklistSchema = new mongoose.Schema({
  title: { type: String, required: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  fields: [{
    label: { type: String, required: true },
    type: { type: String, enum: ['boolean', 'dropdown', 'checkbox', 'file', 'text'], required: true },
    options: [String], // For dropdown/checkbox
    isRequired: { type: Boolean, default: true } 
  }]
}, { timestamps: true });

module.exports = mongoose.model('Checklist', checklistSchema);
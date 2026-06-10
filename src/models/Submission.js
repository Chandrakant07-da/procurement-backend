const mongoose = require('mongoose');

const submissionSchema = new mongoose.Schema({
  orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true },
  inspectionManagerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  // Document Snapshotting Design Pattern (Storing state at a point in time)
  answers: [{
    questionLabel: String,
    type: { type: String },
    value: mongoose.Schema.Types.Mixed // Can be boolean, string, array, or file URL
  }]
}, { timestamps: true });

module.exports = mongoose.model('Submission', submissionSchema);
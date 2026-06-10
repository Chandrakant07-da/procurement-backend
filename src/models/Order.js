const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  procurementManagerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  clientId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  inspectionManagerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  checklistTemplateId: { type: mongoose.Schema.Types.ObjectId, ref: 'Checklist' },
  status: { 
    type: String, 
    enum: ['created', 'in_transit', 'inspected', 'completed'], 
    default: 'created' 
  },
  details: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('Order', orderSchema);
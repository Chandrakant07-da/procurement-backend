const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  procurementManagerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  clientId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  inspectionManagerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // Assigned later
  checklistTemplateId: { type: mongoose.Schema.Types.ObjectId, ref: 'Checklist' }, // The linked "Question Paper"
  status: { 
    type: String, 
    enum: ['created', 'in_transit', 'inspected', 'completed'], 
    default: 'created' 
  },
  details: { type: String } // General order info
}, { timestamps: true });

module.exports = mongoose.model('Order', orderSchema);
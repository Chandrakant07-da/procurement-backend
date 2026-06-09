const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  role: {
    type: String,
    enum: ['admin', 'procurement_manager', 'inspection_manager', 'client'],
    required: true
  },
  email: { type: String, unique: true, sparse: true }, // For Admin, PM, Client [cite: 29]
  mobile: { type: String, unique: true, sparse: true }, // For Inspection Manager [cite: 30]
  password: { type: String, required: true },
  managerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' } // Links IM to PM or Admin [cite: 37]
}, { timestamps: true });

// Pre-save hook to hash passwords
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

module.exports = mongoose.model('User', userSchema);
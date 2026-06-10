const User = require('../models/User');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const generateToken = (id) => jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '5d' });

exports.login = async (req, res) => {
  const { email, mobile, password } = req.body;

  try {
    // Login method dynamically based on input 
    let user;
    if (email) user = await User.findOne({ email });
    else if (mobile) user = await User.findOne({ mobile });

    if (!user) return res.status(400).json({ error: 'Invalid credentials' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ error: 'Invalid credentials' });

    res.json({
      _id: user._id,
      role: user.role,
      token: generateToken(user._id)
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.registerUser = async (req, res) => {
  // Logic to enforce creation hierarchies (Admin creating PM, PM creating IM, etc.)
  const { role, email, mobile, password, managerId } = req.body;

  const creatorRole = req?.user?.role;

  if (creatorRole === 'inspection_manager') {
    return res.status(403).json({ error: 'Inspection manager cannot create users' });
  }

  if (creatorRole === 'procurement_manager' && role === 'procurement_manager') {
    return res.status(403).json({ error: 'PM cannot create another PM' });
  }

  try {
    const user = await User.create({ role, email, mobile, password, managerId });
    res.status(201).json({ success: true, data: user });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};
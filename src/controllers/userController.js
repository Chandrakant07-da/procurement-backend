const User = require('../models/User');

// Get all users (Admin only)
exports.getUsers = async (req, res) => {
  try {
    const users = await User.find().select('-password');
    res.status(200).json({ success: true, data: users });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get user by ID
exports.getUserById = async (req, res) => {
  try {
    const { id } = req.params;

    // Authorization: User can only view their own profile unless they are an admin
    if (req.user.role !== 'admin' && req.user._id.toString() !== id) {
      return res.status(403).json({ error: 'Not authorized to view this user profile' });
    }

    const user = await User.findById(id).select('-password');
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.status(200).json({ success: true, data: user });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

//Update user details (Admin or own profile)
exports.updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { role, email, mobile, password, managerId } = req.body;

    // User can only update their own profile unless they are an admin
    if (req.user.role !== 'admin' && req.user._id.toString() !== id) {
      return res.status(403).json({ error: 'Not authorized to update this user profile' });
    }

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Non-admin users cannot change their own role
    if (role && req.user.role !== 'admin' && role !== user.role) {
      return res.status(403).json({ error: 'Non-admin users cannot change user roles' });
    }

    // Update fields if provided
    if (role) user.role = role;
    if (email !== undefined) user.email = email;
    if (mobile !== undefined) user.mobile = mobile;
    if (managerId !== undefined) user.managerId = managerId || null;
    if (password) user.password = password; // Pre-save hook hashes this automatically

    await user.save();

    // Remove password before returning
    const updatedUser = user.toObject();
    delete updatedUser.password;

    res.status(200).json({ success: true, data: updatedUser });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Delete user
exports.deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findByIdAndDelete(id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.status(200).json({ success: true, message: 'User deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

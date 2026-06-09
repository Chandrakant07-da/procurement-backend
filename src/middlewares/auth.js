const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Verify JWT
exports.protect = async (req, res, next) => {
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }
  if (!token) return res.status(401).json({ error: 'Not authorized, no token' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const currentUser = await User.findById(decoded.id).select('-password').exec();

    if (!currentUser) {
      return res.status(401).json({ error: 'The user belonging to this token no longer exists.' });
    }
    req.user = currentUser;
    next();
  } catch (err) {
    res.status(401).json({ error: 'Not authorized, token failed' });
  }
};

exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Role not authorized to access this route' });
    }
    next();
  };
};
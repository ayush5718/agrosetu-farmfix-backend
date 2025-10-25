// middleware/auth.js
const jwt = require('jsonwebtoken');
const User = require('../models/Users');

const authMiddleware = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ message: 'Unauthorized' });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId);
    if (!user || !user.isActive) return res.status(401).json({ message: 'Unauthorized' });

    req.user = user;
    next();
  } catch (err) {
    res.status(401).json({ message: 'Unauthorized', error: err.message });
  }
};

const roleMiddleware = (roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Forbidden: Access denied' });
    }
    next();
  };
};

module.exports = { authMiddleware, roleMiddleware };
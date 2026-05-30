const jwt = require('jsonwebtoken');
const User = require('../models/User');

const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res
        .status(401)
        .json({ error: 'No token provided. Please log in.' });
    }

    const token = authHeader.split(' ')[1];

    let decoded;

    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        return res
          .status(401)
          .json({ error: 'Token expired. Please log in again.' });
      }

      return res.status(401).json({ error: 'Invalid token.' });
    }

    const user = await User.findById(decoded.userId);

    if (!user) {
      return res
        .status(401)
        .json({ error: 'User no longer exists.' });
    }

    req.user = user;

    next();
  } catch (error) {
    next(error);
  }
};

module.exports = { authenticate };
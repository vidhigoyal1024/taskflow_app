const jwt = require('jsonwebtoken');
const User = require('../models/User');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');

// Requires a valid "Authorization: Bearer <token>" header and attaches the user to req.user
exports.protect = asyncHandler(async (req, res, next) => {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) throw new ApiError(401, 'Please log in to continue');

  let payload;
  try {
    payload = jwt.verify(token, process.env.JWT_SECRET);
  } catch (err) {
    throw new ApiError(401, 'Your session has expired. Please log in again');
  }

  const user = await User.findById(payload.id);
  if (!user) throw new ApiError(401, 'This account no longer exists');
  req.user = user;
  next();
});

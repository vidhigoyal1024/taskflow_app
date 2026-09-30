const jwt = require('jsonwebtoken');
const User = require('../models/User');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');

const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' });

const publicUser = (u) => ({ _id: u._id, name: u.name, email: u.email });

// POST /api/auth/register
exports.register = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;
  const exists = await User.findOne({ email: email.toLowerCase() });
  if (exists) throw new ApiError(409, 'An account with this email already exists');

  const user = await User.create({ name, email, password });
  res.status(201).json({ token: signToken(user._id), user: publicUser(user) });
});

// POST /api/auth/login
exports.login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
  if (!user || !(await user.matchPassword(password))) {
    throw new ApiError(401, 'Incorrect email or password');
  }
  res.json({ token: signToken(user._id), user: publicUser(user) });
});

// GET /api/auth/me
exports.me = asyncHandler(async (req, res) => {
  res.json({ user: publicUser(req.user) });
});

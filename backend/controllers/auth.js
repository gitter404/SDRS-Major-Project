const bcrypt = require('bcryptjs'), jwt = require('jsonwebtoken');
const User = require('../models/User');
const { asyncHandler, AppError } = require('../utils/helpers');
const sign = u => jwt.sign({ id: u._id, role: u.role }, process.env.JWT_SECRET, { expiresIn: '1d' });
const pub = u => ({ id: u._id, name: u.name, email: u.email, phone: u.phone, role: u.role });
exports.register = asyncHandler(async (req, res) => {
  const { name, email, password, phone, role } = req.body;
  if (!name || !email || !password) throw new AppError('name, email, password required');
  if (typeof email !== 'string' || !/^\S+@\S+\.\S+$/.test(email)) throw new AppError('Invalid email');
  if (typeof password !== 'string' || password.length < 6) throw new AppError('Password min 6 chars');
  if (await User.findOne({ email: email.toLowerCase() })) throw new AppError('Email already registered');
  const user = await User.create({ name, email, phone, password: await bcrypt.hash(password, 10), role: role === 'volunteer' ? 'volunteer' : 'citizen' });
  res.status(201).json({ success: true, token: sign(user), user: pub(user) });
});
exports.login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  if (typeof email !== 'string' || typeof password !== 'string') throw new AppError('email and password required');
  const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
  if (!user || !(await bcrypt.compare(password, user.password))) throw new AppError('Invalid credentials', 401);
  res.json({ success: true, token: sign(user), user: pub(user) });
});
exports.me = (req, res) => res.json({ success: true, user: pub(req.user) });

const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { asyncHandler, AppError } = require('../utils/helpers');
exports.protect = asyncHandler(async (req, res, next) => {
  const h = req.headers.authorization || '';
  if (!h.startsWith('Bearer ')) throw new AppError('Not authenticated', 401);
  let d;
  try { d = jwt.verify(h.slice(7), process.env.JWT_SECRET); } catch { throw new AppError('Invalid or expired token', 401); }
  const user = await User.findById(d.id);
  if (!user) throw new AppError('User no longer exists', 401);
  req.user = user; next();
});
exports.authorize = (...roles) => (req, res, next) =>
  roles.includes(req.user.role) ? next() : next(new AppError('Forbidden', 403));

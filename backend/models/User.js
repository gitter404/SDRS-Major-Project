const mongoose = require('mongoose');
const s = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, match: /^\S+@\S+\.\S+$/ },
  password: { type: String, required: true, minlength: 6, select: false },
  phone: { type: String, trim: true },
  role: { type: String, enum: ['citizen', 'authority', 'volunteer'], default: 'citizen' },
}, { timestamps: { createdAt: true, updatedAt: false } });
module.exports = mongoose.model('User', s);

const mongoose = require('mongoose');
const STATUS = ['Reported', 'Verified', 'Assigned', 'In Progress', 'Resolved'];
const s = new mongoose.Schema({
  description: { type: String, required: true, maxlength: 1000 },
  category: { type: String, enum: ['Medical', 'Rescue', 'Fire', 'Shelter'], default: 'Rescue' },
  priority: { type: Number, min: 1, max: 10, default: 5 },
  urgencyKeywords: [String],
  locationKeywords: [String],
  status: { type: String, enum: STATUS, default: 'Reported' },
  location: { type: { type: String, enum: ['Point'], default: 'Point' }, coordinates: { type: [Number], required: true } },
  address: String,
  reportedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  reporterName: String,
  reporterPhone: String,
  assignedResource: { type: mongoose.Schema.Types.ObjectId, ref: 'Resource', default: null },
  assignedAt: Date,
  statusHistory: [{ status: String, changedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, time: { type: Date, default: Date.now }, _id: false }],
}, { timestamps: true });
s.index({ location: '2dsphere' });
s.index({ status: 1 });
s.index({ priority: -1 });
module.exports = mongoose.model('Incident', s);
module.exports.STATUS = STATUS;

const mongoose = require('mongoose');
const s = new mongoose.Schema({
  name: { type: String, required: true },
  type: { type: String, enum: ['Hospital', 'Rescue Team', 'Fire Brigade', 'Volunteer', 'Shelter'], required: true },
  available: { type: Boolean, default: true },
  capacity: Number,
  phone: String,
  location: { type: { type: String, enum: ['Point'], default: 'Point' }, coordinates: { type: [Number], required: true } },
  currentIncident: { type: mongoose.Schema.Types.ObjectId, ref: 'Incident', default: null },
}, { timestamps: true });
s.index({ location: '2dsphere' });
s.index({ type: 1, available: 1 });
module.exports = mongoose.model('Resource', s);

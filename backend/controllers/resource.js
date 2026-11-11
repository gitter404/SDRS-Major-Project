const Resource = require('../models/Resource'), Incident = require('../models/Incident');
const { asyncHandler, AppError, parseCoords } = require('../utils/helpers');
const MAP = {
  Medical: ['Hospital', 'Volunteer'], Fire: ['Fire Brigade', 'Rescue Team'],
  Rescue: ['Rescue Team', 'Volunteer', 'Fire Brigade'], Shelter: ['Shelter', 'Volunteer'],
};
exports.list = asyncHandler(async (req, res) => {
  const f = {};
  if (typeof req.query.type === 'string') f.type = req.query.type;
  if (req.query.available !== undefined) f.available = req.query.available === 'true';
  const items = await Resource.find(f);
  res.json({ success: true, count: items.length, resources: items });
});
exports.create = asyncHandler(async (req, res) => {
  const { name, type, capacity, phone } = req.body;
  const coords = parseCoords(req.body);
  if (!coords) throw new AppError('Valid coordinates required');
  const r = await Resource.create({ name, type, capacity, phone, location: { type: 'Point', coordinates: coords } });
  res.status(201).json({ success: true, resource: r });
});
exports.update = asyncHandler(async (req, res) => {
  const u = {};
  for (const k of ['name', 'type', 'capacity', 'phone', 'available']) if (req.body[k] !== undefined) u[k] = req.body[k];
  const c = (req.body.coordinates || req.body.lat !== undefined || req.body.location) ? parseCoords(req.body) : null;
  if (c) u.location = { type: 'Point', coordinates: c };
  const r = await Resource.findByIdAndUpdate(req.params.id, u, { new: true, runValidators: true });
  if (!r) throw new AppError('Resource not found', 404);
  res.json({ success: true, resource: r });
});
exports.nearby = asyncHandler(async (req, res) => {
  const inc = await Incident.findById(req.query.incidentId);
  if (!inc) throw new AppError('Incident not found', 404);
  const results = await Resource.aggregate([
    { $geoNear: { near: inc.location, distanceField: 'distance', spherical: true,
      query: { available: true, type: { $in: MAP[inc.category] } } } },
    { $limit: 3 },
  ]);
  res.json({ success: true, matches: results.map(r => ({ ...r, distanceKm: +(r.distance / 1000).toFixed(2) })) });
});

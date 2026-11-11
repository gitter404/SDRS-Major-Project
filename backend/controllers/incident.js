const Incident = require('../models/Incident'), Resource = require('../models/Resource');
const { STATUS } = Incident;
const analyze = require('../utils/ai'), notify = require('../utils/notify');
const { asyncHandler, AppError, parseCoords } = require('../utils/helpers');
const emit = (req, ev, data) => req.app.get('io')?.emit(ev, data);
const populate = q => q.populate('assignedResource', 'name type phone');

exports.create = asyncHandler(async (req, res) => {
  const { description, address } = req.body;
  if (typeof description !== 'string' || !description.trim()) throw new AppError('description required');
  if (description.length > 1000) throw new AppError('description max 1000 chars');
  const coords = parseCoords(req.body);
  if (!coords) throw new AppError('Valid coordinates required (lng -180..180, lat -90..90)');
  const ai = await analyze(description);
  const inc = await Incident.create({
    description: description.trim(), category: ai.category, priority: ai.priority, urgencyKeywords: ai.tokens, locationKeywords: ai.locations,
    location: { type: 'Point', coordinates: coords }, address,
    reportedBy: req.user._id, reporterName: req.user.name, reporterPhone: req.user.phone,
    statusHistory: [{ status: 'Reported', changedBy: req.user._id }],
  });
  emit(req, 'incident:new', inc);
  res.status(201).json({ success: true, incident: inc });
});

exports.list = asyncHandler(async (req, res) => {
  const f = {};
  for (const k of ['status', 'category']) if (typeof req.query[k] === 'string') f[k] = req.query[k];
  if (req.query.priority) f.priority = Number(req.query.priority);
  const items = await populate(Incident.find(f).sort({ priority: -1, createdAt: -1 }));
  res.json({ success: true, count: items.length, incidents: items });
});

exports.mine = asyncHandler(async (req, res) => {
  const items = await Incident.find({ reportedBy: req.user._id }).select('-reporterPhone').sort({ createdAt: -1 });
  res.json({ success: true, count: items.length, incidents: items });
});

exports.stats = asyncHandler(async (req, res) => {
  const [total, critical, active, resolved] = await Promise.all([
    Incident.countDocuments(),
    Incident.countDocuments({ priority: { $gte: 8 }, status: { $ne: 'Resolved' } }),
    Incident.countDocuments({ status: { $ne: 'Resolved' } }),
    Incident.countDocuments({ status: 'Resolved' }),
  ]);
  res.json({ success: true, stats: { total, critical, active, resolved } });
});

exports.getOne = asyncHandler(async (req, res) => {
  const inc = await populate(Incident.findById(req.params.id));
  if (!inc) throw new AppError('Incident not found', 404);
  const isAuth = req.user.role === 'authority';
  if (!isAuth && String(inc.reportedBy) !== String(req.user._id)) throw new AppError('Forbidden', 403);
  const o = inc.toObject();
  if (!isAuth) delete o.reporterPhone;
  res.json({ success: true, incident: o });
});

exports.updateStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  const inc = await Incident.findById(req.params.id);
  if (!inc) throw new AppError('Incident not found', 404);
  const ni = STATUS.indexOf(status), ci = STATUS.indexOf(inc.status);
  if (ni === -1) throw new AppError('Invalid status');
  if (inc.status === 'Resolved') throw new AppError('Resolved is final');
  if (ni !== ci + 1) throw new AppError(`Can only move from ${inc.status} to ${STATUS[ci + 1]}`);
  if (status === 'Assigned') throw new AppError('Use the assign endpoint to move to Assigned');
  inc.status = status;
  inc.statusHistory.push({ status, changedBy: req.user._id });
  await inc.save();
  if (status === 'Resolved' && inc.assignedResource)
    await Resource.findByIdAndUpdate(inc.assignedResource, { available: true, currentIncident: null });
  emit(req, 'incident:updated', inc);
  res.json({ success: true, incident: inc });
});

exports.assign = asyncHandler(async (req, res) => {
  const inc = await Incident.findById(req.params.id);
  if (!inc) throw new AppError('Incident not found', 404);
  if (!['Reported', 'Verified'].includes(inc.status)) throw new AppError('Incident already assigned or closed');
  const r = await Resource.findOneAndUpdate(
    { _id: req.body.resourceId, available: true },
    { available: false, currentIncident: inc._id }, { new: true });
  if (!r) throw new AppError('Resource not found or already busy');
  inc.assignedResource = r._id; inc.assignedAt = new Date(); inc.status = 'Assigned';
  inc.statusHistory.push({ status: 'Assigned', changedBy: req.user._id });
  await inc.save();
  notify(r, inc);
  emit(req, 'incident:updated', inc);
  res.json({ success: true, incident: inc, resource: r });
});

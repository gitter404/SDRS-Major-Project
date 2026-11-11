exports.asyncHandler = fn => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
exports.AppError = class extends Error { constructor(msg, code = 400) { super(msg); this.status = code; } };
exports.parseCoords = (b) => {
  let lng, lat;
  if (Array.isArray(b.coordinates)) [lng, lat] = b.coordinates;
  else if (b.location && Array.isArray(b.location.coordinates)) [lng, lat] = b.location.coordinates;
  else { lng = b.lng ?? b.longitude; lat = b.lat ?? b.latitude; }
  lng = Number(lng); lat = Number(lat);
  if (!Number.isFinite(lng) || !Number.isFinite(lat) || lng < -180 || lng > 180 || lat < -90 || lat > 90) return null;
  return [lng, lat];
};

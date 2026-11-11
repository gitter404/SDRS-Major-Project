module.exports = (err, req, res, next) => {
  let status = err.status || 500, message = err.message || 'Server error';
  if (err.name === 'ValidationError') { status = 400; message = Object.values(err.errors).map(e => e.message).join(', '); }
  else if (err.code === 11000) { status = 400; message = 'Duplicate value: ' + Object.keys(err.keyValue || {}).join(', '); }
  else if (err.name === 'CastError') { status = 400; message = 'Invalid ' + err.path; }
  if (status === 500) console.error(err);
  res.status(status).json({ success: false, message: status === 500 ? 'Server error' : message });
};

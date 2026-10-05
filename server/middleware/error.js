module.exports = (err, req, res, next) => {
  if (res.headersSent) return next(err);
  if (err.type === 'entity.too.large') {
    return res.status(413).json({ message: 'Request body is too large' });
  }
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ message: 'Invalid JSON body' });
  }
  if (err.status === 403 && err.message === 'Origin not allowed by CORS') {
    return res.status(403).json({ message: 'Origin not allowed by CORS' });
  }
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      message: Object.values(err.errors).map((error) => error.message).join(', '),
    });
  }
  if (err.name === 'CastError') return res.status(400).json({ message: 'Invalid value' });
  if (err.code === 11000) return res.status(409).json({ message: 'Duplicate value' });
  console.error(err);
  return res.status(500).json({ message: 'Server error' });
};

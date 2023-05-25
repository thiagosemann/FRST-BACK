module.exports = (req, res, next) => {
    const { name, hourly_rate } = req.body;
    if (!name || !hourly_rate) {
      return res.status(400).json({ error: 'Required fields are missing' });
    }
    next();
  };
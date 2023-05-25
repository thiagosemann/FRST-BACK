module.exports = (req, res, next) => {
    const { type, total_usage_time, is_in_use, building_id } = req.body;
    if (!type || !total_usage_time || is_in_use == null || !building_id) {
      return res.status(400).json({ error: 'Required fields are missing' });
    }
    next();
  };
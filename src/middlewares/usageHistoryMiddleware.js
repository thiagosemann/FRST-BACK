module.exports = (req, res, next) => {
    const { user_id, machine_id, start_time, end_time, total_cost } = req.body;
    if (!user_id || !machine_id || !start_time || !end_time || !total_cost) {
      return res.status(400).json({ error: 'Required fields are missing' });
    }
    next();
  };
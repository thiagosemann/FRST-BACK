module.exports = (req, res, next) => {
    const { user_id, usage_history_id, transaction_time, amount } = req.body;
    if (!user_id || !usage_history_id || !transaction_time || !amount) {
      return res.status(400).json({ error: 'Required fields are missing' });
    }
    next();
  };
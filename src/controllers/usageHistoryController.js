const UsageHistory = require('../models/usageHistoryModel');

const getUserUsageHistory = async (req, res) => {
  try {
    const userId = req.params.id;
    const usageHistory = await UsageHistory.getAllUsageHistoryByUser(userId);
    res.json(usageHistory);
  } catch (error) {
    console.error('Error getting user usage history:', error);
    res.status(500).json({ error: 'Failed to get user usage history' });
  }
};

const getAllUsageHistory = async (req, res) => {
  try {
    const usageHistory = await UsageHistory.getAllUsageHistory();
    res.json(usageHistory);
  } catch (error) {
    console.error('Error getting all usage history:', error);
    res.status(500).json({ error: 'Failed to get all usage history' });
  }
};

const createUsageHistory = async (req, res) => {
  try {
    const newUsage = await UsageHistory.createUsageHistory(req.body);
    res.status(201).json(newUsage);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = {
  getUserUsageHistory,
  getAllUsageHistory,
  createUsageHistory
};
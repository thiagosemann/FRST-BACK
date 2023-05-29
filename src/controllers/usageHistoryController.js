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
    const { user_id, machine_id, start_time } = req.body;
    const newUsage = await UsageHistory.createUsageHistory({ user_id, machine_id, start_time });
    res.status(201).json(newUsage);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
const getMachineUsageHistory = async (req, res) => {
  try {
    const machineId = req.params.id;
    const usageHistory = await UsageHistory.getAllUsageHistoryByMachine(machineId);
    res.json(usageHistory);
  } catch (error) {
    console.error('Error getting machine usage history:', error);
    res.status(500).json({ error: 'Failed to get machine usage history' });
  }
};


module.exports = {
  getUserUsageHistory,
  getAllUsageHistory,
  createUsageHistory,
  getMachineUsageHistory,
  
};
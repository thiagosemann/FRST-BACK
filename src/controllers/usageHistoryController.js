const UsageHistory = require('../models/usageHistoryModel');

const getUserUsageHistory = async (req, res) => {
  try {
    const userId = req.params.id;
    const month = req.query.month; // Adicionado o parâmetro do mês

    const usageHistory = await UsageHistory.getAllUsageHistoryByUser(userId, month);
    res.json(usageHistory);
  } catch (error) {
    console.error('Error getting user usage history:', error);
    res.status(500).json({ error: 'Failed to get user usage history' });
  }
};

const getAllUsageHistory = async (req, res) => {
  try {
    const month = req.query.month; // Adicionado o parâmetro do mês

    const usageHistory = await UsageHistory.getAllUsageHistory(month);
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
    const month = req.query.month; // Adicionado o parâmetro do mês

    const usageHistory = await UsageHistory.getAllUsageHistoryByMachine(machineId, month);
    res.json(usageHistory);
  } catch (error) {
    console.error('Error getting machine usage history:', error);
    res.status(500).json({ error: 'Failed to get machine usage history' });
  }
};

const updateUsageHistory = async (req, res) => {
  try {
    const { id, end_time, total_cost } = req.body;
    const updatedUsage = await UsageHistory.updateUsageHistory({ id, end_time, total_cost });
    res.json(updatedUsage);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const deleteUsageHistoryById = async (req, res) => {
  try {
    const { id } = req.params;
    const isDeleted = await UsageHistory.deleteUsageHistoryById(id);

    if (isDeleted) {
      res.json({ message: 'Usage history deleted successfully' });
    } else {
      res.status(404).json({ message: 'Usage history not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getUserUsageHistory,
  getAllUsageHistory,
  createUsageHistory,
  getMachineUsageHistory,
  updateUsageHistory,
  deleteUsageHistoryById
};

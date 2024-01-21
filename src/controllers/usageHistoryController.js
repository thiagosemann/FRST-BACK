const UsageHistory = require('../models/usageHistoryModel');
const Transaction = require('../models/transactionModel');

const getUserUsageHistory = async (req, res) => {
  try {
    const userId = req.params.id;
    const month = req.params.month; // Adicionado o parâmetro do mês
    const usageHistory = await UsageHistory.getAllUsageHistoryByUser(userId, month);
    res.json(usageHistory);
  } catch (error) {
    console.error('Error getting user usage history:', error);
    res.status(500).json({ error: 'Failed to get user usage history' });
  }
};

const getUsageHistoryByBuildingAndMonth = async (req, res) => {
  try {
    const buildingId = req.params.buildingId;
    const month = req.params.month; // Parâmetro do mês da consulta
    const usageHistory = await UsageHistory.getUsageHistoryByBuildingAndMonth(buildingId, month);
    res.json(usageHistory);
  } catch (error) {
    console.error('Error getting usage history by building and month:', error);
    res.status(500).json({ error: 'Failed to get usage history by building and month' });
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
    const { user_id, machine_id } = req.body;
    const start_time = new Date();
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

const updateUsageHistory2= async (req, res) => {
  try {
    const { id, end_time, total_cost } = req.body;
    const updatedUsage = await UsageHistory.updateUsageHistory({ id, end_time, total_cost });
    res.json(updatedUsage);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};


  const updateUsageHistory = async (req, res) => {
    try {
      const { id, hourly_rate } = req.body;

      const lastUsage = await UsageHistory.getUsageHistoryByID(id);
      // Validar dados de entrada
      if (!id || !hourly_rate || !lastUsage.start_time || !lastUsage.user_id || isNaN(hourly_rate) || hourly_rate <= 0) {
        return res.status(400).json({ message: "Parâmetros inválidos" });
      }
      const end_time = new Date();
      // Tratar possíveis erros em calculateCost e fornecer um valor padrão se necessário
      let total_cost = 0;
      try {
        total_cost = calculateCost(hourly_rate, lastUsage.start_time, end_time);
      } catch (calculationError) {
        console.error(`Erro no cálculo de custo: ${calculationError.message}`);
      }
      const updatedUsage = await UsageHistory.updateUsageHistory({ id, end_time, total_cost });
      const transaction = {
        user_id: lastUsage.user_id,
        usage_history_id: id || 0,
        transaction_time: end_time,
        amount: total_cost || 0
      };
      const createTransactions = await Transaction.createTransaction(transaction);
      res.json(updatedUsage);
    } catch (err) {
      console.error(`Erro no processamento: ${err.message}`);
      res.status(500).json({ message: "Erro interno do servidor" });
  }
};

const calculateCost = (hourlyRate, startTime, endTime) => {
  const start = new Date(startTime);
  const end = new Date(endTime);

  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    throw new Error("Formato de data inválido");
  }

  const timeDifferenceInSeconds = (end.getTime() - start.getTime()) / 1000;

  if (timeDifferenceInSeconds < 0) {
    throw new Error("A hora de término deve ser posterior à hora de início");
  }

  return (hourlyRate / 3600) * timeDifferenceInSeconds;
};


const updateCompleteUsageHistory = async (req, res) => {
  try {
    const { id, start_time, end_time, total_cost, machine_id, user_id} = req.body;
    const updatedUsage = await UsageHistory.updateCompleteUsageHistory({
      id,
      start_time,
      end_time,
      total_cost,
      machine_id,
      user_id
    });
    res.json(updatedUsage);
  } catch (err) {
    console.error('Error updating complete usage history:', err);
    res.status(500).json({ message: err.message || 'Failed to update complete usage history' });
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
  deleteUsageHistoryById,
  getUsageHistoryByBuildingAndMonth,
  updateCompleteUsageHistory
};

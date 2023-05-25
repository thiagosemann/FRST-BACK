const connection = require('./connection');

const getAllUsageHistoryByUser = async (userId) => {
  const [rows] = await connection.execute('SELECT * FROM UsageHistory WHERE user_id = ?', [userId]);
  return rows;
};

const getAllUsageHistory = async () => {
  const [rows] = await connection.execute('SELECT * FROM UsageHistory');
  return rows;
};

const createUsageHistory = async (usage) => {
  const { user_id, machine_id, start_time, end_time, total_cost } = usage;
  const query = 'INSERT INTO UsageHistory (user_id, machine_id, start_time, end_time, total_cost) VALUES (?, ?, ?, ?, ?)';
  const [result] = await connection.execute(query, [user_id, machine_id, start_time, end_time, total_cost]);
  return { insertId: result.insertId };
};

module.exports = {
  getAllUsageHistoryByUser,
  getAllUsageHistory,
  createUsageHistory
};
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
  try {
    const { user_id, machine_id, start_time } = usage;
    const query = 'INSERT INTO UsageHistory (user_id, machine_id, start_time) VALUES (?, ?, ?)';
    const [result] = await connection.execute(query, [user_id, machine_id, start_time]);
    return { insertId: result.insertId };
  } catch (err) {
    console.error('Error creating usage history:', err);
    throw new Error('Failed to create usage history');
  }
};
const getAllUsageHistoryByMachine = async (machineId) => {
  const [rows] = await connection.execute('SELECT * FROM UsageHistory WHERE machine_id = ?', [machineId]);
  return rows;
};



module.exports = {
  getAllUsageHistoryByUser,
  getAllUsageHistory,
  createUsageHistory,
  getAllUsageHistoryByMachine,
};
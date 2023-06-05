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

const updateUsageHistory = async (usageHistory) => {
  try {
    const { id, end_time, total_cost } = usageHistory;
    const query = 'UPDATE UsageHistory SET end_time = ?, total_cost = ? WHERE id = ?';
    await connection.execute(query, [end_time, total_cost, id]);
    return { id, end_time, total_cost };
  } catch (err) {
    console.error('Error updating usage history:', err);
    throw new Error('Failed to update usage history');
  }
};


module.exports = {
  getAllUsageHistoryByUser,
  getAllUsageHistory,
  createUsageHistory,
  getAllUsageHistoryByMachine,
  updateUsageHistory
};
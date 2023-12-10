const connection = require('./connection');

const getAllUsageHistoryByUser = async (userId, yearMonth) => {
  const [year, month] = yearMonth.split('-').map(Number);

  let query = `
    SELECT UH.*, U.apt_name
    FROM UsageHistory UH
    INNER JOIN users U ON UH.user_id = U.id
    WHERE UH.user_id = ?
  `;
  
  if (!isNaN(year) && !isNaN(month)) {
    query += ' AND YEAR(UH.start_time) = ? AND MONTH(UH.start_time) = ?';
  }

  const queryParams = [userId];

  if (!isNaN(year) && !isNaN(month)) {
    queryParams.push(year, month);
  }

  try {
    const [rows] = await connection.execute(query, queryParams);
    return rows;
  } catch (err) {
    console.error('Error retrieving usage history by user and month:', err);
    throw new Error('Failed to retrieve usage history by user and month');
  }
};


const getAllUsageHistory = async () => {
  const [rows] = await connection.execute('SELECT * FROM UsageHistory');
  return rows;
};

const getUsageHistoryByBuildingAndMonth = async (buildingId, yearMonth) => {
  const [year, month] = yearMonth.split('-').map(Number);

  let query = `
    SELECT UH.*, U.apt_name, M.name AS machine_name
    FROM UsageHistory UH
    INNER JOIN users U ON UH.user_id = U.id
    INNER JOIN Machines M ON UH.machine_id = M.id
    WHERE U.building_id = ?
  `;
  
  if (!isNaN(year) && !isNaN(month)) {
    query += ' AND YEAR(UH.start_time) = ? AND MONTH(UH.start_time) = ?';
  }

  const queryParams = [buildingId];

  if (!isNaN(year) && !isNaN(month)) {
    queryParams.push(year, month);
  }

  try {
    const [rows] = await connection.execute(query, queryParams);
    return rows;
  } catch (err) {
    console.error('Error retrieving usage history by building and month:', err);
    throw new Error('Failed to retrieve usage history by building and month');
  }
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

    // Atualizar a tabela UsageHistory
    const usageHistoryQuery = 'UPDATE UsageHistory SET end_time = ?, total_cost = ? WHERE id = ?';
    await connection.execute(usageHistoryQuery, [end_time, total_cost, id]);

    // Atualizar a tabela Transactions
    const transactionQuery = 'UPDATE Transactions SET transaction_time = ?, amount = ? WHERE usage_history_id = ?';
    await connection.execute(transactionQuery, [end_time, total_cost, id]);

    return { id, end_time, total_cost };
  } catch (err) {
    console.error('Error updating usage history:', err);
    throw new Error('Failed to update usage history');
  }
};


const deleteUsageHistoryById = async (usageHistoryId) => {
  try {
    const [result] = await connection.execute('DELETE FROM UsageHistory WHERE id = ?', [usageHistoryId]);
    return result.affectedRows > 0; // Retorna verdadeiro se uma linha foi afetada (excluída)
  } catch (error) {
    throw error;
  }
};

module.exports = {
  getAllUsageHistoryByUser,
  getAllUsageHistory,
  createUsageHistory,
  getAllUsageHistoryByMachine,
  updateUsageHistory,
  deleteUsageHistoryById,
  getUsageHistoryByBuildingAndMonth
};

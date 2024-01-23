const connection = require('./connection');

const getAllTransactions = async () => {
  const [transactions] = await connection.execute('SELECT * FROM Transactions');
  return transactions;
};

const createTransaction = async (transaction) => {
  const { user_id, usage_history_id, transaction_time, amount } = transaction;
  const query = 'INSERT INTO Transactions (user_id, usage_history_id, transaction_time, amount) VALUES (?, ?, ?, ?)';
  const [result] = await connection.execute(query, [user_id, usage_history_id, transaction_time, amount]);
  return { insertId: result.insertId };
};

const getTransactionByUsageHistoryId = async (usage_history_id) => {
  try {
    const [transactions] = await connection.execute('SELECT * FROM Transactions WHERE usage_history_id = ?', [usage_history_id]);
    return transactions[0];
  }catch (error) {
    throw error;
  }
};

const deleteTransactionById = async (transactionId) => {
  try {
    const [result] = await connection.execute('DELETE FROM Transactions WHERE id = ?', [transactionId]);
    return result.affectedRows > 0; // Retorna verdadeiro se uma linha foi afetada (excluída)
  } catch (error) {
    throw error;
  }
};

const updateTransactionById = async (updatedTransaction, usageHistoryId) => {
  try {
    const { user_id, transaction_time, amount } = updatedTransaction;

    const query = `
      UPDATE Transactions
      SET user_id = ?, transaction_time = ?, amount = ?
      WHERE usage_history_id = ?
    `;

    const [result] = await connection.execute(query, [user_id, transaction_time, amount, usageHistoryId]);

    return result.affectedRows > 0; // Retorna verdadeiro se uma linha foi afetada (atualizada)
  } catch (error) {
    throw error;
  }
};



module.exports = {
  getAllTransactions,
  createTransaction,
  getTransactionByUsageHistoryId,
  deleteTransactionById,
  updateTransactionById
};
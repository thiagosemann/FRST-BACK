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

module.exports = {
  getAllTransactions,
  createTransaction
};
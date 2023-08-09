const Transaction = require('../models/transactionModel');

getAllTransactions = async (req, res) => {
  try {
    const transactions = await Transaction.getAllTransactions();
    res.json(transactions);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

createTransaction = async (req, res) => {
  try {
    const newTransaction = await Transaction.createTransaction(req.body);
    res.status(201).json(newTransaction);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

getTransactionByUsageHistoryId = async (req, res) => {
  try {
    const transaction = await Transaction.getTransactionByUsageHistoryId(req.params.id);
    if (transaction) {
      res.json(transaction);
    } else {
      res.status(404).json({ message: 'Transaction not found' });
    }
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { getAllTransactions, createTransaction, getTransactionByUsageHistoryId };

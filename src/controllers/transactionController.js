const Transaction = require('../models/transactionModel');

const getAllTransactions = async (req, res) => {
  try {
    const transactions = await Transaction.getAllTransactions();
    res.json(transactions);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const createTransaction = async (req, res) => {
  try {
    const newTransaction = await Transaction.createTransaction(req.body);
    res.status(201).json(newTransaction);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const getTransactionByUsageHistoryId = async (req, res) => {
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

const updateTransactionById = async (req, res) => {
  try {
    const { id } = req.params;
    const updatedTransaction = req.body;
    
    const isUpdated = await Transaction.updateTransactionById(id, updatedTransaction);

    if (isUpdated) {
      res.json({ message: 'Transaction updated successfully' });
    } else {
      res.status(404).json({ message: 'Transaction not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const deleteTransactionById = async (req, res) => {
  try {
    const { id } = req.params;
    const isDeleted = await Transaction.deleteTransactionById(id);

    if (isDeleted) {
      res.json({ message: 'Transaction deleted successfully' });
    } else {
      res.status(404).json({ message: 'Transaction not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getAllTransactions,
  createTransaction,
  getTransactionByUsageHistoryId,
  updateTransactionById, // Adicionando a função de atualização
  deleteTransactionById
};

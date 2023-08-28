const Disconnection = require('../models/controleConexaoModel');

exports.getAllDisconnections = async (req, res) => {
  try {
    const disconnections = await Disconnection.getAllDisconnections();
    res.json(disconnections);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getDisconnectionById = async (req, res) => {
  try {
    const disconnection = await Disconnection.getDisconnectionById(req.params.id);
    if (disconnection) {
      res.json(disconnection);
    } else {
      res.status(404).json({ message: 'Disconnection not found' });
    }
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.createDisconnection = async (req, res) => {
  try {
    const newDisconnection = await Disconnection.createDisconnection(req.body);
    res.status(201).json(newDisconnection);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getDisconnectionsByMachineId = async (req, res) => {
  try {
    const disconnections = await Disconnection.getDisconnectionsByMachineId(req.params.machine_id);
    res.json(disconnections);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

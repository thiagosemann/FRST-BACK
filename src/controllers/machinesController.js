const Machine = require('../models/machineModel');

exports.getAllMachines = async (req, res) => {
  try {
    const machines = await Machine.getAllMachines();
    res.json(machines);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.createMachine = async (req, res) => {
  try {
    const newMachine = await Machine.createMachine(req.body);
    res.status(201).json(newMachine);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
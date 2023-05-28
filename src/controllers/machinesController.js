const Machine = require('../models/machineModel');

exports.getAllMachines = async (req, res) => {
  try {
    const machines = await Machine.getAllMachines();
    res.json(machines);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getMachineById = async (req, res) => {
  try {
    const machine = await Machine.getMachineById(req.params.id);
    if (machine) {
      res.json(machine);
    } else {
      res.status(404).json({ message: 'Machine not found' });
    }
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

exports.getMachinesByBuilding = async (req, res) => {
  try {
    const machines = await Machine.getMachinesByBuilding(req.params.building_id);
    res.json(machines);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.updateMachineStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { is_in_use } = req.body;
    await Machine.updateMachineStatus(id, is_in_use);
    res.status(200).json({ message: `Machine ${id} status updated successfully` });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
const Building = require('../models/buildingsModel');

exports.getAllBuildings = async (req, res) => {
  try {
    const buildings = await Building.getAllBuildings();
    res.json(buildings);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.createBuilding = async (req, res) => {
  try {
    const newBuilding = await Building.createBuilding(req.body);
    res.status(201).json(newBuilding);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};




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

exports.getBuildingById = async (req, res) => {
  try {
    const building = await Building.getBuildingById(req.params.id);
    if (building) {
      res.json(building);
    } else {
      res.status(404).json({ message: "Building not found" });
    }
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};


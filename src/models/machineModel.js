const connection = require('./connection');

const getAllMachines = async () => {
  const [machines] = await connection.execute('SELECT * FROM Machines');
  return machines;
};

const getMachineById = async (machineId) => {
  const [machine] = await connection.execute('SELECT * FROM Machines WHERE id = ?', [machineId]);
  return machine[0];
};

const createMachine = async (machine) => {
  const { type, total_usage_time, is_in_use, building_id } = machine;
  const query = 'INSERT INTO Machines (type, total_usage_time, is_in_use, building_id) VALUES (?, ?, ?, ?)';
  const [result] = await connection.execute(query, [type, total_usage_time, is_in_use, building_id]);
  return { insertId: result.insertId };
};

const getMachinesByBuilding = async (building_id) => {
  const [machines] = await connection.execute('SELECT * FROM Machines WHERE building_id = ?', [building_id]);
  return machines;
};
const updateMachineStatus = async (machineId, newStatus) => {
  const query = 'UPDATE Machines SET is_in_use = ? WHERE id = ?';
  const [result] = await connection.execute(query, [newStatus, machineId]);
  return result;
};

module.exports = {
  getAllMachines,
  getMachineById,
  createMachine,
  getMachinesByBuilding,
  updateMachineStatus
};
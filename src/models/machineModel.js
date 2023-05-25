const connection = require('./connection');

const getAllMachines = async () => {
  const [machines] = await connection.execute('SELECT * FROM Machines');
  return machines;
};

const createMachine = async (machine) => {
  const { type, total_usage_time, is_in_use, building_id } = machine;
  const query = 'INSERT INTO Machines (type, total_usage_time, is_in_use, building_id) VALUES (?, ?, ?, ?)';
  const [result] = await connection.execute(query, [type, total_usage_time, is_in_use, building_id]);
  return { insertId: result.insertId };
};

module.exports = {
  getAllMachines,
  createMachine
};
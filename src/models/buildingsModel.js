const connection = require('./connection');

const getAllBuildings = async () => {
  const [buildings] = await connection.execute('SELECT * FROM Buildings');
  return buildings;
};

const createBuilding = async (building) => {
  const { name, hourly_rate } = building;
  const query = 'INSERT INTO Buildings (name, hourly_rate) VALUES (?, ?)';
  const [result] = await connection.execute(query, [name, hourly_rate]);
  return { insertId: result.insertId };
};

const getBuildingById = async (id) => {
  const [building] = await connection.execute('SELECT * FROM Buildings WHERE id = ?', [id]);
  return building[0];
};

module.exports = {
  getAllBuildings,
  createBuilding,
  getBuildingById
};
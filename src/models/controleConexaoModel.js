const connection = require('./connection');

const getAllDisconnections = async () => {
  const [disconnections] = await connection.execute('SELECT * FROM desconexoes_nodemcu');
  return disconnections;
};

const getDisconnectionById = async (disconnectionId) => {
  const [disconnection] = await connection.execute('SELECT * FROM desconexoes_nodemcu WHERE id = ?', [disconnectionId]);
  return disconnection[0];
};

const createDisconnection = async (disconnection) => {
  const { data_hora, nodemcuID, status, id_maquina } = disconnection;
  const query = 'INSERT INTO Comntrole_Conexao (data_hora, nodemcuID, status, id_maquina) VALUES (?, ?, ?, ?)';
  const [result] = await connection.execute(query, [data_hora, nodemcuID, status, id_maquina]);
  return { insertId: result.insertId };
};

const getDisconnectionsByMachineId = async (machineId) => {
  const [disconnections] = await connection.execute('SELECT * FROM Comntrole_Conexao WHERE id_maquina = ?', [machineId]);
  return disconnections;
};

module.exports = {
  getAllDisconnections,
  getDisconnectionById,
  createDisconnection,
  getDisconnectionsByMachineId
};

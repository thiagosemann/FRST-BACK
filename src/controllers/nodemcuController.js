const { wss, connections } = require('../websocket');
// nodemcuController.js

const turnOn = (req, res) => {
    const nodeId = req.params.id;
    const targetConnection = connections.find((connection) => connection.nodeId === nodeId);
  
    if (targetConnection) {
      const binaryMessage = Buffer.from([0x01]);
      targetConnection.ws.send(binaryMessage);
      res.status(200).json({ success: true, message: 'NodeMCU ligado com sucesso', nodeId: nodeId });
    } else {
      res.status(400).json({ success: false, message: 'Nenhuma conexão ativa encontrada para o NodeMCU especificado', nodeId: nodeId });
    }
  };
  

const turnOff = (req, res) => {
  const nodeId = req.params.id;
  const targetConnection = connections.find((connection) => connection.nodeId === nodeId);
  if (targetConnection) {
    const binaryMessage = Buffer.from([0x02]);
    targetConnection.ws.send(binaryMessage);
    res.status(200).json({ success: true, message: 'NodeMCU desligado com sucesso' });
  } else {
    res.status(400).json({ success: false, message: 'Nenhuma conexão ativa encontrada para o NodeMCU especificado' });
  }
};

const checkStatus = (req, res) => {
  const nodeId = req.params.id;
  const targetConnection = connections.find((connection) => connection.nodeId === nodeId);

  if (targetConnection) {
    const binaryMessage = Buffer.from([0x03]);
    targetConnection.ws.send(binaryMessage);
    res.status(200).json({ success: true, message: 'A consulta de status foi enviada com sucesso' });
  } else {
    res.status(400).json({ success: false, message: 'Nenhuma conexão ativa encontrada para o NodeMCU especificado' });
  }
};

module.exports = { turnOn, turnOff, checkStatus };

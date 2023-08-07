const { wss, connections } = require('../websocket');
const Machine = require('../models/machineModel');

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

const receiveMachineStatus = async (nodeId, machineStatus) => {
  // Obter o ID da máquina associada ao NodeMCU usando o nodeId
  const machines = await getMachinesByIdNodeMcu(nodeId);
  if (machines && machines.length > 0) {
    const machineId = machines[0].id;
    // Atualizar o status da máquina no banco de dados
    const status = machineStatus === 'ON' ? true : false;
    Machine.updateMachineStatus(machineId, status)
      .then((result) => {
        if (result) {
          console.log(`Machine status updated for NodeMCU ${nodeId}`);
        } else {
          console.log(`Error updating machine status for NodeMCU ${nodeId}`);
        }
      })
      .catch((error) => {
        console.log('Error updating machine status:', error);
      });
  } else {
    console.log(`No machine found for the specified NodeMCU ${nodeId}`);
  }
};


module.exports = { turnOn, turnOff, checkStatus, receiveMachineStatus };

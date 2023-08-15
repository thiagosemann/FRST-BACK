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
  try {
    if (targetConnection) {
      // A conexão existe, o que indica que está ativa
      res.status(200).json({ success: true, message: 'A conexão com o NodeMCU está ativa' });
    } else {
      res.status(200).json({ success: false, message: 'Nenhuma conexão ativa encontrada para o NodeMCU especificado' });
    }
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const chagenMachineStatusToFalse = async (nodeId) => {
  // Obter o ID da máquina associada ao NodeMCU usando o nodeId
  const machines = await getMachinesByIdNodeMcu(nodeId);
  if (machines && machines.length > 0) {
    const machineId = machines[0].id;
    // Atualizar o status da máquina no banco de dados
    const is_in_use = false;
    Machine.updateMachineStatus(machineId, is_in_use)
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


module.exports = { turnOn, turnOff, checkStatus, chagenMachineStatusToFalse };

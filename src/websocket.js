const connection = require('../src/models/connection');
const machinesModel = require('./models/machineModel');

const WebSocket = require('ws');

let wss;
const connections = [];

function createWebSocketServer(server) {
  wss = new WebSocket.Server({ server });

  wss.on('connection', (ws) => {
    // Change the status to false when a WebSocket connection is established
    connections.forEach((conn) => {
      conn.connected = false;
    });

    ws.on('message', (message) => {
      // Converter o objeto message para uma string
      const messageString = message.toString();

      if (messageString.startsWith('ID:')) {
        const nodeId = messageString.slice(3);
        updateMachineStatus(nodeId).catch(error => {
          console.log('Error updating machine status:', error);
        });
        // Armazene o ID do NodeMCU juntamente com a conexão, se necessário
        connections.push({ ws, nodeId: nodeId, connected: true });
        logConnectionStatus(nodeId, true); // Registrar conexão bem-sucedida
      } 
        const parts = messageString.split(':');
        
      
      // Enviar resposta para o cliente WebSocket como texto
      ws.send(messageString);
    });

    ws.on('close', () => {
      const index = connections.findIndex((conn) => conn.ws === ws);
      if (index !== -1) {
        const connection = connections[index];
        if (connection.nodeId) {
          logConnectionStatus(connection.nodeId, false); // Registrar desconexão
        }
        connections.splice(index, 1);
      }
    });
  });

  // Ping-Pong
  const pingInterval = setInterval(() => {
    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.ping();
      }
    });
  }, 30000);
}

function logConnectionStatus(nodeId, connected) {
  if (connected) {
    console.log(`NodeMCU ${nodeId} connected`);
  } else {
    console.log(`NodeMCU ${nodeId} disconnected`);
  }
}


async function updateMachineStatus(nodeId) {
  try {
    // Find the machine ID using the NodeMCU ID
    const machines = await machinesModel.getMachinesByIdNodeMcu(nodeId);
    if (machines.length > 0) {
      const machineId = machines[0].id;
      
      // Update the machine status
      const query = 'UPDATE Machines SET is_in_use = ? WHERE id = ?';
      const [result] = await connection.execute(query, [false, machineId]);
      
      if (result.affectedRows > 0) {
        console.log(`Machine status updated for NodeMCU ${nodeId}`);
      } else {
        console.log(`Error updating machine status for NodeMCU ${nodeId}`);
      }
    } else {
      console.log(`No machine found for the specified NodeMCU ${nodeId}`);
    }
  } catch (error) {
    throw error;
  }
}


module.exports = { createWebSocketServer, connections };

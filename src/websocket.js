const WebSocket = require('ws');
const { receiveMachineStatus } = require('./controllers/nodemcuController'); // Importe a função receiveMachineStatus

let wss;
const connections = [];

function createWebSocketServer(server) {
  wss = new WebSocket.Server({ server });

  wss.on('connection', (ws) => {
    console.log('WebSocket connected');
    ws.on('message', (message) => {
      console.log('Received message:', message.toString());

      // Converter o objeto message para uma string
      const messageString = message.toString();

      if (messageString.startsWith('ID:')) {
        const nodeId = messageString.slice(3);
        console.log('Node ID:', nodeId);
        // Armazene o ID do NodeMCU juntamente com a conexão, se necessário
        connections.push({ ws, nodeId: nodeId });
      } else if (messageString.startsWith('STATUS:')) {
        const parts = messageString.split(':');
        if (parts.length === 3) {
          const nodeId = parts[1];
          const machineStatus = parts[2];
          receiveMachineStatus(nodeId, machineStatus); // Chame a função receiveMachineStatus
        }
      }

      // Enviar resposta para o cliente WebSocket como texto
      ws.send(messageString);
    });

    ws.on('close', () => {
      console.log('WebSocket disconnected');
      const index = connections.findIndex((conn) => conn.ws === ws);
      if (index !== -1) {
        const connection = connections[index];
        if (connection.nodeId) {
          console.log(`NodeMCU ${connection.nodeId} disconnected`);
        }
        connections.splice(index, 1);
      }
    });
  });
}

module.exports = { createWebSocketServer, connections };

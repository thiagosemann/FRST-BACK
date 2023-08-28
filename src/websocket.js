const connection = require('../src/models/connection');
const machinesModel = require('./models/machineModel');
const buildingsModel = require('./models/buildingsModel');
const usageHistoryModel = require('./models/usageHistoryModel');
const controleConexao = require('./controllers/controleConexaoController');

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

async function logConnectionStatus(nodeId, connected) {
  const status = connected ? 'conectado' : 'desconectado';
  const machines = await machinesModel.getMachinesByIdNodeMcu(nodeId);
  if (machines.length > 0) {
    const machineId = machines[0].id;
    // Crie uma nova desconexão com as informações relevantes
    const disconnectionData = {
      data_hora: new Date(), // Pode ajustar para a data/hora correta
      nodemcuID: nodeId,
      status: status, // Status da conexão
      id_maquina: machineId // Substitua por um valor válido
    };
  
    controleConexao.createDisconnection(disconnectionData)
      .then(newDisconnection => {
        console.log(`NodeMCU ${nodeId} ${status}`);
        console.log('Log criado:', newDisconnection);
      })
      .catch(error => {
        console.log('Error creating disconnection:', error);
      });
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

        // Call the function to get all usage history records for the machine
        const usageHistories = await usageHistoryModel.getAllUsageHistoryByMachine(machineId);

        // Find the latest usage history
        const latestUsageHistory = usageHistories[usageHistories.length - 1];

        if (latestUsageHistory && !latestUsageHistory.end_time) {
          // Find the building's hourly rate using building_id
          const building = await buildingsModel.getBuildingById(latestUsageHistory.building_id);

          if (building) {
            const currentTimestamp = new Date();
            const endTimestamp = currentTimestamp.toISOString(); // Assuming your database uses ISO date format

            // Calculate total cost based on hourly rate and usage duration
            const startTimestamp = new Date(latestUsageHistory.start_time);
            const timeDifferenceMs = currentTimestamp - startTimestamp;
            const hoursUsed = timeDifferenceMs / (1000 * 60 * 60);
            const totalCost = building.hourly_rate * hoursUsed;

            // Update the usage history with end time and total cost
            const updatedUsageHistory = {
              id: latestUsageHistory.id,
              end_time: endTimestamp,
              total_cost: totalCost
            };

            await usageHistoryModel.updateUsageHistory(updatedUsageHistory);

            console.log(`Updated usage history for Machine ${machineId}: end_time = ${endTimestamp}, total_cost = ${totalCost}`);
          }
        }
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

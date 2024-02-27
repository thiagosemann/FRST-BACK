const connection = require('../models/connection');
const { wss, connections } = require('../websocket');



//-------------------------------------------------------------------------Ligar Maquina-------------------------------------------------------------------------//
const createUsageHistory = async (usage) => {
    try {
      const { user_id, machine_id } = usage;
      const start_time = new Date();
      const query = 'INSERT INTO UsageHistory (user_id, machine_id, start_time) VALUES (?, ?, ?)';
      const [result] = await connection.execute(query, [user_id, machine_id, start_time]);
      const historyEntry = {
        id: result.insertId,
        start_time: start_time
      }
      return historyEntry;
    } catch (err) {
      console.error('Error creating usage history:', err);
      throw new Error('Failed to create usage history');
    }
};



const ligarNodeMcu = (nodeId) => {
    return new Promise((resolve, reject) => {
        try {
            const targetConnection = connections.find((connection) => connection.nodeId === nodeId);
            if (targetConnection) {
                console.log(`Enviando comando para ligar NodeMCU ${nodeId}`);
                const binaryMessage = Buffer.from([0x01]);
                targetConnection.ws.send(binaryMessage);

                // Aguardar até receber a confirmação específica do NodeMCU ou um timeout
                let confirmationReceived = false;
                const confirmationTimeout = setTimeout(() => {
                    if (!confirmationReceived) {
                        console.log(`Timeout: Falha ao ligar o NodeMCU ou relé não ativado para NodeMCU ${nodeId}`);
                        reject({
                            success: false,
                            message: 'Timeout: Falha ao ligar o NodeMCU ou relé não ativado',
                            nodeId: nodeId,
                        });
                    }
                }, 5000); // Timeout de 10 segundos (ajuste conforme necessário)

                targetConnection.ws.once('message', (message) => {
                    const messageString = message.toString();
                    console.log(`Recebido mensagem do NodeMCU ${nodeId}: ${messageString}`);
                    if (messageString === 'RelayStatus:ON') {
                        confirmationReceived = true;
                        clearTimeout(confirmationTimeout); // Cancelar o timeout
                        console.log(`Confirmação recebida: NodeMCU ${nodeId} ligado com sucesso`);
                        resolve({
                            success: true,
                            message: 'NodeMCU ligado com sucesso',
                            nodeId: nodeId,
                        });
                    }
                });
            } else {
                console.log(`Nenhuma conexão ativa encontrada para o NodeMCU especificado: ${nodeId}`);
                reject({
                    success: false,
                    message: 'Nenhuma conexão ativa encontrada para o NodeMCU especificado',
                    nodeId: nodeId,
                });
            }
        } catch (err) {
            console.error('Erro ao ligar nodemcu:', err);
            reject({
                success: false,
                message: 'Erro ao ligar nodemcu',
                nodeId: nodeId,
            });
        }
    });
};
//-------------------------------------------------------------------------Desligar Maquina-------------------------------------------------------------------------//

const encerrarUsageHistory = async (lastUsage, machine) => {
    try {
        const end_time = new Date();
        const total_cost = calculateCost(machine.hourly_rate,lastUsage.start_time,end_time);
        const {id} = lastUsage
        // Atualizar a tabela UsageHistory
        const usageHistoryQuery = 'UPDATE UsageHistory SET end_time = ?, total_cost = ? WHERE id = ?';
        const [result] = await connection.execute(usageHistoryQuery, [end_time, total_cost, id]);
        lastUsage.end_time = end_time;
        lastUsage.total_cost = total_cost;
        return {lastUsage};
    } catch (err) {
      console.error('Error updating partial usage history:', err);
      throw new Error('Failed to update partial usage history');
    }
  };



const removerEncerramentoUsageHistory = async (lastUsage) => {
    try {
        // Definir end_time e total_cost como NULL para remover o encerramento
        const end_time = null;
        const total_cost = null;
        const { id } = lastUsage;

        // Atualizar a tabela UsageHistory
        const usageHistoryQuery = 'UPDATE UsageHistory SET end_time = ?, total_cost = ? WHERE id = ?';
        const [result] = await connection.execute(usageHistoryQuery, [end_time, total_cost, id]);

        // Atualizar os valores em lastUsage
        lastUsage.end_time = end_time;
        lastUsage.total_cost = total_cost;

        return { lastUsage };
    } catch (err) {
        console.error('Error removing usage history closure:', err);
        throw new Error('Failed to remove usage history closure');
    }
};


const desligarNodemcu = (nodeId) => {
    return new Promise((resolve, reject) => {
        try {
            const targetConnection = connections.find((connection) => connection.nodeId === nodeId);
            if (targetConnection) {
                console.log(`Enviando comando para desligar NodeMCU ${nodeId}`);
                const binaryMessage = Buffer.from([0x02]);
                targetConnection.ws.send(binaryMessage);

                // Aguardar até receber a confirmação específica do NodeMCU ou um timeout
                let confirmationReceived = false;

                const confirmationTimeout = setTimeout(() => {
                    if (!confirmationReceived) {
                        console.log(`Timeout: Falha ao desligar o NodeMCU para NodeMCU ${nodeId}`);
                        reject({
                            success: false,
                            message: 'Timeout: Falha ao desligar o NodeMCU',
                            nodeId: nodeId,
                        });
                    }
                }, 5000); // Timeout de 10 segundos (ajuste conforme necessário)

                targetConnection.ws.once('message', (message) => {
                    const messageString = message.toString();
                    console.log(`Recebido mensagem do NodeMCU ${nodeId}: ${messageString}`);
                    if (messageString === 'RelayStatus:OFF') {
                        confirmationReceived = true;
                        clearTimeout(confirmationTimeout); // Cancelar o timeout

                        // Agora que a confirmação foi recebida, você pode resolver a Promessa
                        console.log(`Confirmação recebida: NodeMCU ${nodeId} desligado com sucesso`);
                        resolve({
                            success: true,
                            message: 'NodeMCU desligado com sucesso',
                            nodeId: nodeId,
                        });
                    }
                });
            } else {
                console.log(`Nenhuma conexão ativa encontrada para o NodeMCU especificado: ${nodeId}`);
                reject({
                    success: false,
                    message: 'Nenhuma conexão ativa encontrada para o NodeMCU especificado',
                    nodeId: nodeId,
                });
            }
        } catch (err) {
            console.error('Erro ao desligar nodemcu:', err);
            reject({
                success: false,
                message: 'Erro ao desligar nodemcu',
                nodeId: nodeId,
            });
        }
    });
};





//-------------------------------------------------------------------------Extras-------------------------------------------------------------------------//

const updateMachineStatus = async (machineId, newStatus) => {
    try {
        const query = 'UPDATE Machines SET is_in_use = ? WHERE id = ?';
        const [result] = await connection.execute(query, [newStatus, machineId]);
        return result;
      } catch (err) {
        console.error('Falha ao mudar status máquina:', err);
        throw new Error('Falha ao mudar status máquina.');
      }
};

const calculateCost = (hourlyRate, startTime, endTime) => {
    const start = new Date(startTime);
    const end = new Date(endTime);
  
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      throw new Error("Formato de data inválido");
    }
  
    const timeDifferenceInSeconds = (end.getTime() - start.getTime()) / 1000;
  
    if (timeDifferenceInSeconds < 0) {
      throw new Error("A hora de término deve ser posterior à hora de início");
    }
  
    return (hourlyRate / 3600) * timeDifferenceInSeconds;
  };

module.exports = {
    createUsageHistory,
    ligarNodeMcu,
    updateMachineStatus,
    encerrarUsageHistory,
    desligarNodemcu,
    removerEncerramentoUsageHistory
    
};
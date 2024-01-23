
const { wss, connections } = require('../websocket');
const Utilidades = require('./utilidades');
const MachineModel = require('../models/machineModel');
const UserModel = require('../models/usersModel');
const BuildingsModel = require('../models/buildingsModel')
const TransactionModel = require('../models/transactionModel');

const ligarMaquina = async (req, res) => {
    try {
        const { id_maquina, id_user } = req.body;

        // Buscar informações da máquina pelo ID
        const machine = await MachineModel.getMachineById(id_maquina);

        // Verificar se a máquina está conectada
        const targetConnection = connections.find((connection) => connection.nodeId === machine.idNodemcu);
        if (!targetConnection) {
            return res.status(400).json({ message: "Máquina não está conectada!" });
        }

        // Verificar se a máquina já está ligada
        if (machine.is_in_use) {
            return res.status(400).json({ message: "Máquina já está ligada!" });
        }

        // Criar registro de histórico de uso
        const newUsage = await Utilidades.createUsageHistory({ id_user, id_maquina });
        if (newUsage) {
            try {
                // Tentar ligar o NodeMCU usando await
                const nodeMcuResp = await Utilidades.ligarNodeMcu(machine.idNodemcu);

                if (nodeMcuResp.success) {
                    // Atualizar o status da máquina no banco de dados
                    const machineStatus = await Utilidades.updateMachineStatus(machine.id,true);

                    if (machineStatus) {
                        // Máquina ligada com sucesso
                        res.status(200).json({ message: "Máquina ligada com sucesso!" });
                    } else {
                        // Falha ao atualizar o status da máquina
                        res.status(500).json({ message: "Falha ao mudar status máquina." });
                    }
                } else {
                    // Falha ao ligar o NodeMCU
                    res.status(500).json({ message: "Falha ao ligar máquina." });
                }
            } catch (error) {
                // Lidar com erros da Promessa ligarNodeMcu
                res.status(500).json({ message: `Erro ao ligar NodeMCU: ${error.message}` });
            }
        } else {
            // Falha ao criar o histórico de uso
            res.status(500).json({ message: "Falha ao criar o histórico de uso." });
        }
    } catch (err) {
        // Erro durante o processamento
        console.error(`Erro no processamento: ${err.message}`);
        res.status(500).json({ message: "Erro no processamento: " + err.message });
    }
};


const desligarMaquina = async (req, res) => {
    try {
        const { id_maquina, id_user } = req.body;

        // Buscar informações da máquina pelo ID
        const machine = await MachineModel.getMachineById(id_maquina);
        const machineUsagHistory = await MachineModel.getAllUsageHistoryByMachine(id_maquina);
        const lastUsage = machineUsagHistory[machineUsagHistory.length-1];
        const user = await UserModel.getUser(id_user);
        const building = await BuildingsModel.getBuildingById(machine.building_id);

        // Verificar se a máquina está conectada
        const targetConnection = connections.find((connection) => connection.nodeId === machine.idNodemcu);
        if (!targetConnection) {
            return res.status(400).json({ message: "Máquina não está conectada!" });
        }

        // Verificar se a máquina já está sendo usada pelo usuario correto.
        if ((!lastUsage || lastUsage.user_id != id_user) && user.role !="admin" ) {
            return res.status(400).json({ message: "Máquina sendo utilizada por outro usuário!" });
        }

        const usageHistoryEncerrada = await Utilidades.encerrarUsageHistory({ lastUsage,building });
        if (usageHistoryEncerrada) {
            const transaction = {
                user_id: usageHistoryEncerrada.user_id,
                usage_history_id: usageHistoryEncerrada.id || 0,
                transaction_time: usageHistoryEncerrada.end_time,
                amount: usageHistoryEncerrada.total_cost || 0
            };
            const createTransactions = await TransactionModel.createTransaction(transaction);
            if(createTransactions){
                try {
                    // Tentar ligar o NodeMCU usando await
                    const nodeMcuResp = await Utilidades.desligarNodemcu(machine.idNodemcu);
                    if (nodeMcuResp.success) {
                        // Atualizar o status da máquina no banco de dados
                        const machineStatus = await Utilidades.updateMachineStatus(machine.id,false);
                        if (machineStatus) {
                            // Máquina ligada com sucesso
                            res.status(200).json({ message: "Máquina desligada com sucesso!" });
                        } else {
                            await TransactionModel.deleteTransactionById(createTransactions)
                            await Utilidades.removerEncerramentoUsageHistory({ lastUsage,building })
                            await Utilidades.ligarNodeMcu(machine.idNodemcu);
                            res.status(500).json({ message: "Falha ao mudar status máquina." });
                        }
                    } else {
                        // Falha ao ligar o NodeMCU
                        res.status(500).json({ message: "Falha ao ligar máquina." });
                    }
                } catch (error) {
                    // Deletar transaction
                    await TransactionModel.deleteTransactionById(createTransactions)
                    await Utilidades.removerEncerramentoUsageHistory({ lastUsage,building })
                    res.status(500).json({ message: `Erro ao ligar NodeMCU: ${error.message}` });
                }
            }else{
                await Utilidades.removerEncerramentoUsageHistory({ lastUsage,building })
                res.status(500).json({ message: "Falha ao criar transaction." });
            }
        }else{
            // Falha ao encerrar o histórico de uso
            res.status(500).json({ message: "Falha ao encerrar o histórico de uso." });
        }

    } catch (err) {
        // Erro durante o processamento
        console.error(`Erro no processamento: ${err.message}`);
        res.status(500).json({ message: "Erro no processamento: " + err.message });
    }
};

module.exports = {
    desligarMaquina,
    ligarMaquina
};
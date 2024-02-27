const { wss, connections } = require('../websocket');
const Utilidades = require('./utilidades');
const MachineModel = require('../models/machineModel');
const UserModel = require('../models/usersModel');
const BuildingsModel = require('../models/buildingsModel')
const TransactionModel = require('../models/transactionModel');
const UsageHistory = require('../models/usageHistoryModel');

const ligarMaquina = async (req, res) => {
    try {
        console.log("Starting ligarMaquina function...");
        const { id_maquina, id_user } = req.body;
        console.log("Request body:", req.body);

        // Buscar informações da máquina pelo ID
        const machine = await MachineModel.getMachineById(id_maquina);
        console.log("Machine details:", machine);

        // Verificar se a máquina está conectada
        const targetConnection = connections.find((connection) => connection.nodeId === machine.idNodemcu);

        if (!targetConnection) {
            console.log("Máquina não está conectada!");
            return res.status(400).json({ message: "Máquina não está conectada!" });
        }

        // Verificar se a máquina já está ligada
        if (machine.is_in_use) {
            console.log("Máquina já está ligada!");
            return res.status(400).json({ message: "Máquina já está ligada!" });
        }
        
        for (let i=1;i<=10;i++){
            try {
                    // Tentar ligar o NodeMCU usando await
                    const nodeMcuResp = await Utilidades.ligarNodeMcu(machine.idNodemcu);
                    console.log("NodeMCU response:", nodeMcuResp);
                    if (nodeMcuResp.success) {
                        // Atualizar o status da máquina no banco de dados
                        const machineStatus = await Utilidades.updateMachineStatus(machine.id,true);
                        console.log("Machine status updated:", machineStatus);
                        if (machineStatus) {
                           // Criar registro de histórico de uso
                            const newUsage = await Utilidades.createUsageHistory({ user_id: id_user, machine_id: id_maquina });
                            console.log("New usage history:", newUsage);
                            if (newUsage) {
                                res.status(200).json({ message: "Máquina ligada com sucesso!" });
                                break;
                            } else {
                                // Falha ao criar o histórico de uso
                                console.log("Falha ao criar o histórico de uso.");
                                res.status(500).json({ message: "Falha ao criar o histórico de uso." });
                            }

                        } else {
                            // Falha ao atualizar o status da máquina
                            console.log("Falha ao mudar status máquina.");
                            res.status(500).json({ message: "Falha ao mudar status máquina." });
                            break;
                        }
                    } else {
                        // Falha ao ligar o NodeMCU
                        console.log("Falha ao ligar máquina.");
                        if(i==10){
                            res.status(500).json({ message: "Falha ao ligar máquina." });
                        }
                    }
            } catch (error) {
                // Lidar com erros da Promessa ligarNodeMcu
                console.error(`Erro ao ligar NodeMCU: ${error.message}`);
                if(i==10){
                    res.status(500).json({ message: `Erro ao ligar NodeMCU: ${error.message}` });
                }
            }
        }

    } catch (err) {
        // Erro durante o processamento
        console.error(`Erro no processamento: ${err.message}`);
        res.status(500).json({ message: "Erro no processamento: " + err.message });
    }
};

const desligarMaquina = async (req, res) => {
    try {
        console.log("Starting desligarMaquina function...");
        const { id_maquina, id_user } = req.body;
        console.log("Request body:", req.body);

        // Buscar informações da máquina pelo ID
        const machine = await MachineModel.getMachineById(id_maquina);
        console.log("Machine details:", machine);

        const machineUsagHistory = await UsageHistory.getAllUsageHistoryByMachine(id_maquina);

        const lastUsage = machineUsagHistory[machineUsagHistory.length-1];
        console.log("Last usage:", lastUsage);

        const user = await UserModel.getUser(id_user);
        console.log("User details:", user);

        // Verificar se a máquina está conectada
        const targetConnection = connections.find((connection) => connection.nodeId === machine.idNodemcu);
        console.log("Target connection:", targetConnection);

        if (!targetConnection) {
            console.log("Máquina não está conectada!");
            return res.status(400).json({ message: "Máquina não está conectada!" });
        }

        // Verificar se a máquina já está sendo usada pelo usuario correto.
        if ((!lastUsage || lastUsage.user_id != id_user) && user.role !="admin" ) {
            console.log("Máquina sendo utilizada por outro usuário!");
            return res.status(400).json({ message: "Máquina sendo utilizada por outro usuário!" });
        }

        const usageHistoryEncerrada = await Utilidades.encerrarUsageHistory( lastUsage,machine );
        console.log("Usage history encerrada:", usageHistoryEncerrada);

        if (usageHistoryEncerrada) {
            const transaction = {
                user_id: usageHistoryEncerrada.lastUsage.user_id,
                usage_history_id: usageHistoryEncerrada.lastUsage.id || 0,
                transaction_time: usageHistoryEncerrada.lastUsage.end_time,
                amount: usageHistoryEncerrada.lastUsage.total_cost || 0
            };
            console.log("Transaction details:", transaction);

            const createTransactions = await TransactionModel.createTransaction(transaction);
            console.log("Created transaction:", createTransactions);

            if(createTransactions){
                for (let i=0;i<10;i++){
                    try {
                        // Tentar desligar o NodeMCU usando await
                        const nodeMcuResp = await Utilidades.desligarNodemcu(machine.idNodemcu);
                        console.log("NodeMCU response:", nodeMcuResp);
                            if (nodeMcuResp.success) {
                                // Atualizar o status da máquina no banco de dados
                                const machineStatus = await Utilidades.updateMachineStatus(machine.id,false);
                                console.log("Machine status updated:", machineStatus);
                                if (machineStatus) {
                                    // Máquina ligada com sucesso
                                    res.status(200).json({ message: "Máquina desligada com sucesso!" });
                                    break;
                                } else {

                                    res.status(500).json({ message: "Falha ao mudar status máquina." });
                                    console.log("Falha ao mudar status máquina.");
                                    break;
                                }
                            } else {
                                // Falha ao ligar o NodeMCU
                                console.log("Falha ao desligar máquina.");
                                if(i==10){
                                    res.status(500).json({ message: "Falha ao desligar máquina." });
                                }
                            }
                        
                    } catch (error) {

                        console.error(`Erro ao ligar NodeMCU: ${error.message}`);
                        if(i==10){
                            res.status(500).json({ message: `Erro ao ligar NodeMCU: ${error.message}` });
                        }
                    }
                }
            } else {
                console.log("Falha ao criar transaction.");
                res.status(500).json({ message: "Falha ao criar transaction." });
            }
        } else {
            // Falha ao encerrar o histórico de uso
            console.log("Falha ao encerrar o histórico de uso.");
            res.status(500).json({ message: "Falha ao encerrar o histórico de uso." });
        }
    } catch (err) {
        // Erro durante o processamento
        console.error(`Erro no processamento: ${err.message}`);
        res.status(500).json({ message: "Erro no processamento: " + err.message });
    }
};



const ligarMaquinaIndustrial = async (req, res) => {
    try {
        console.log("Starting ligarMaquina function...");
        const { id_maquina, id_user } = req.body;
        console.log("Request body:", req.body);

        // Buscar informações da máquina pelo ID
        const machine = await MachineModel.getMachineById(id_maquina);
        console.log("Machine details:", machine);

        // Verificar se a máquina está conectada
        const targetConnection = connections.find((connection) => connection.nodeId === machine.idNodemcu);

        if (!targetConnection) {
            console.log("Máquina não está conectada!");
            return res.status(400).json({ message: "Máquina não está conectada!" });
        }

        // Verificar se a máquina já está ligada
        if (machine.is_in_use) {
            console.log("Máquina já está ligada!");
            return res.status(400).json({ message: "Máquina já está ligada!" });
        }
        
        for (let i=1;i<=10;i++){
            try {
                    // Tentar ligar o NodeMCU usando await
                    const nodeMcuResp = await Utilidades.ligarNodeMcu(machine.idNodemcu);
                    console.log("NodeMCU response:", nodeMcuResp);
                    if (nodeMcuResp.success) {
                        // Atualizar o status da máquina no banco de dados
                        const machineStatus = await Utilidades.updateMachineStatus(machine.id,true);
                        console.log("Machine status updated:", machineStatus);
                        if (machineStatus) {
                           // Criar registro de histórico de uso
                            const usage = await Utilidades.createUsageHistory({ user_id: id_user, machine_id: id_maquina });
                            console.log("Criado usageHistory:", usage);
                            if (usage) {
                                const usageHistoryEncerrada = await Utilidades.encerrarUsageHistory(usage,machine );
                                console.log("Encerrado usageHistory:", usageHistoryEncerrada);
                                const transaction = {
                                    user_id: usageHistoryEncerrada.lastUsage.user_id,
                                    usage_history_id: usageHistoryEncerrada.lastUsage.id || 0,
                                    transaction_time: usageHistoryEncerrada.lastUsage.end_time,
                                    amount: usageHistoryEncerrada.lastUsage.total_cost || 0
                                };
                                console.log("Transaction details:", transaction);
                                const createTransactions = await TransactionModel.createTransaction(transaction);
                                console.log("Created transaction:", createTransactions);
                                if(createTransactions){
                                    res.status(200).json({ message: "Máquina ligada com sucesso!" });
                                    break;
                                } else {
                                   // Falha ao criar o histórico de uso
                                    console.log("Falha ao criar transaction.");
                                    res.status(500).json({ message: "Falha ao criar transaction." });
                                }

                            } else {
                                // Falha ao criar o histórico de uso
                                console.log("Falha ao criar o histórico de uso.");
                                res.status(500).json({ message: "Falha ao criar o histórico de uso." });
                            }

                        } else {
                            // Falha ao atualizar o status da máquina
                            console.log("Falha ao mudar status máquina.");
                            res.status(500).json({ message: "Falha ao mudar status máquina." });
                            break;
                        }
                    } else {
                        // Falha ao ligar o NodeMCU
                        console.log("Falha ao ligar máquina.");
                        if(i==10){
                            res.status(500).json({ message: "Falha ao ligar máquina." });
                        }
                    }
            } catch (error) {
                // Lidar com erros da Promessa ligarNodeMcu
                console.error(`Erro ao ligar NodeMCU: ${error.message}`);
                if(i==10){
                    res.status(500).json({ message: `Erro ao ligar NodeMCU: ${error.message}` });
                }
            }
        }

    } catch (err) {
        // Erro durante o processamento
        console.error(`Erro no processamento: ${err.message}`);
        res.status(500).json({ message: "Erro no processamento: " + err.message });
    }
};

module.exports = {
    desligarMaquina,
    ligarMaquina,
    ligarMaquinaIndustrial
};

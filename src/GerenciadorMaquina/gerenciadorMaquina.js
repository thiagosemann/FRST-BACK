const { wss, connections } = require('../websocket');
const Utilidades = require('./utilidades');
const MachineModel = require('../models/machineModel');
const UserModel = require('../models/usersModel');
const TransactionModel = require('../models/transactionModel');
const UsageHistory = require('../models/usageHistoryModel');



//-----------------------------------------------POS PAGO--------------------------------------------------------------------------//
//-----------------------------------------------POS PAGO--------------------------------------------------------------------------//

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

        console.log("Ligando a máquina:"+ machine.idNodemcu + " para o usuário:" + id_user);
        

        // Chamar a função separada para lidar com a tentativa de ligar o NodeMCU
        const ligarNodeMcuResult = await tentarLigarNodeMcu(machine, res);
        // Se a tentativa de ligar o NodeMCU falhar, interrompa a execução
        if (!ligarNodeMcuResult.success) {
            return;
        }   

        // Atualizar o status da máquina no banco de dados
        const machineStatus = await Utilidades.updateMachineStatus(machine.id,true);
        if (machineStatus) {
            // Criar registro de histórico de uso
            const newUsage = await Utilidades.createUsageHistory({ user_id: id_user, machine_id: id_maquina });
            if (newUsage) {
                console.log("Máquina ligada:"+ machine.idNodemcu + " para o usuário:" + id_user)
                res.status(200).json({ message: "Máquina ligada com sucesso!" });
            } else {
                // Falha ao criar o histórico de uso
                console.log("Falha ao criar o histórico de uso.");
                res.status(500).json({ message: "Falha ao criar o histórico de uso." });
            }

        } else {
            // Falha ao atualizar o status da máquina
            console.log("Falha ao mudar status máquina.");
            res.status(500).json({ message: "Falha ao mudar status máquina." });
            
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
        const machineUsagHistory = await UsageHistory.getAllUsageHistoryByMachine(id_maquina);
        const lastUsage = machineUsagHistory[machineUsagHistory.length-1];
        const user = await UserModel.getUser(id_user);

        // Verificar se a máquina está conectada
        const targetConnection = connections.find((connection) => connection.nodeId === machine.idNodemcu);

        if (!targetConnection) {
            console.log("Máquina não está conectada!");
            return res.status(400).json({ message: "Máquina não está conectada!" });
        }

        // Verificar se a máquina já está sendo usada pelo usuario correto.
        if ((!lastUsage || lastUsage.user_id != id_user) && user.role !="admin" ) {
            console.log("Máquina sendo utilizada por outro usuário!");
            return res.status(400).json({ message: "Máquina sendo utilizada por outro usuário!" });
        }

        console.log("Desligando a máquina:"+ machine.idNodemcu + " para o usuário:" + id_user);

        // Chamar a função separada para lidar com a tentativa de ligar o NodeMCU
        const desligarNodeMcuResult = await tentarDesligarNodeMcu(machine, res);
        // Se a tentativa de ligar o NodeMCU falhar, interrompa a execução
        if (!desligarNodeMcuResult.success) {
            return;
        }
        const usageHistoryEncerrada = await Utilidades.encerrarUsageHistory( lastUsage,machine );

        if (usageHistoryEncerrada) {
            const transaction = {
                user_id: usageHistoryEncerrada.lastUsage.user_id,
                usage_history_id: usageHistoryEncerrada.lastUsage.id || 0,
                transaction_time: usageHistoryEncerrada.lastUsage.end_time,
                amount: usageHistoryEncerrada.lastUsage.total_cost || 0
            };

            const createTransactions = await TransactionModel.createTransaction(transaction);

            if(createTransactions){
                // Atualizar o status da máquina no banco de dados
                const machineStatus = await Utilidades.updateMachineStatus(machine.id,false);
                if (machineStatus) {
                    // Máquina ligada com sucesso
                    console.log("Máquina desligada:"+ machine.idNodemcu + " para o usuário:" + id_user);

                    res.status(200).json({ message: "Máquina desligada com sucesso!" });
                } else {
                    res.status(500).json({ message: "Falha ao mudar status máquina." });
                    console.log("Falha ao mudar status máquina.");
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
        const { id_maquina, id_user } = req.body;
        console.log("Request body:", req.body);

        // Buscar informações da máquina pelo ID
        const machine = await MachineModel.getMachineById(id_maquina);

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
        console.log("Ligando a máquina:"+ machine.idNodemcu + " para o usuário:" + id_user);

        // Chamar a função separada para lidar com a tentativa de ligar o NodeMCU
        const ligarNodeMcuResult = await tentarLigarNodeMcu(machine, res);
        // Se a tentativa de ligar o NodeMCU falhar, interrompa a execução
        if (!ligarNodeMcuResult.success) {
            return;
        }

        // Atualizar o status da máquina no banco de dados
        const machineStatus = await Utilidades.updateMachineStatus(machine.id,true);

        // Setando o tempo em que a máquina vai ficar ligada
        scheduleMachineStatusUpdate(machine.id, machine.tempo_uso);
        
        if (machineStatus) {
            // Criar registro de histórico de uso
            const usage = await Utilidades.createUsageHistory({ user_id: id_user, machine_id: id_maquina });
            if (usage) {
                const usageHistoryEncerrada = await Utilidades.encerrarUsageHistoryIndustrial(usage,machine );
                const transaction = {
                    user_id: id_user,
                    usage_history_id: usageHistoryEncerrada.lastUsage.id || 0,
                    transaction_time: usageHistoryEncerrada.lastUsage.end_time,
                    amount: usageHistoryEncerrada.lastUsage.total_cost || 0
                };
                const createTransactions = await TransactionModel.createTransaction(transaction);
                if(createTransactions){
                    console.log("Criado o registro para a máquina:"+ machine.idNodemcu + " para o usuário:" + id_user);

                    res.status(200).json({ message: "Máquina ligada com sucesso!" });
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
        }
    } catch (err) {
        // Erro durante o processamento
        console.error(`Erro no processamento: ${err.message}`);
        res.status(500).json({ message: "Erro no processamento: " + err.message });
    }
};


//-----------------------------------------------PRE PAGO--------------------------------------------------------------------------//
//-----------------------------------------------PRE PAGO--------------------------------------------------------------------------//



// Função para tentar ligar o NodeMCU
const tentarLigarNodeMcu = async (machine, res) => {
    for (let i=1;i<=10;i++){
        try {
            // Tentar ligar o NodeMCU usando await
            const nodeMcuResp = await Utilidades.ligarNodeMcu(machine.idNodemcu);
            console.log("NodeMCU response:", nodeMcuResp);
            if (nodeMcuResp.success) {
                return { success: true };
            } else {
                // Falha ao ligar o NodeMCU
                console.log("Falha ao ligar máquina.");
                if(i===10){
                    res.status(500).json({ message: "Máximo de tentativas atingida." });
                    return { success: false };
                }
            }
        } catch (error) {
            // Lidar com erros da Promessa ligarNodeMcu
            console.error(`Erro ao ligar NodeMCU: ${error.message}`);
            if(i===10){
                res.status(500).json({ message: `Erro ao ligar NodeMCU: ${error.message}` });
                return { success: false };
            }
        }
    }
};

// Função para tentar ligar o NodeMCU
const tentarDesligarNodeMcu = async (machine, res) => {
    for (let i=1;i<=10;i++){
        try {
            // Tentar ligar o NodeMCU usando await
            const nodeMcuResp = await Utilidades.desligarNodemcu(machine.idNodemcu);
            console.log("NodeMCU response:", nodeMcuResp);
            if (nodeMcuResp.success) {
                return { success: true };
            } else {
                // Falha ao ligar o NodeMCU
                console.log("Falha ao desligar máquina.");
                if(i===10){
                    res.status(500).json({ message: "Máximo de tentativas atingida." });
                    return { success: false };
                }
            }
        } catch (error) {
            // Lidar com erros da Promessa ligarNodeMcu
            console.error(`Erro ao desligar NodeMCU: ${error.message}`);
            if(i===10){
                res.status(500).json({ message: `Erro ao desligar NodeMCU: ${error.message}` });
                return { success: false };
            }
        }
    }
  

};




// Função para agendar a atualização do status da máquina
const scheduleMachineStatusUpdate = (machineId, minutes) => {
    setTimeout(() => {
        try {
            const machineStatus = Utilidades.updateMachineStatus(machineId, false);
            console.log("Machine status will be updated to false in", minutes, "minutes.");
        } catch (error) {
            console.error("Error scheduling machine status update:", error.message);
        }
    }, minutes * 60 * 1000); // Convert minutes to milliseconds
};

module.exports = {
    desligarMaquina,
    ligarMaquina,
    ligarMaquinaIndustrial
};

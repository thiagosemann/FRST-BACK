
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
                            // Deletar transaction, remover o encerramento do usageHistory e religar o NodeMcu
                            res.status(500).json({ message: "Falha ao mudar status máquina." });
                        }
                    } else {
                        // Falha ao ligar o NodeMCU
                        res.status(500).json({ message: "Falha ao ligar máquina." });
                    }
                } catch (error) {
                    // Deletar transaction e remover o encerramento do usageHistory
                    res.status(500).json({ message: `Erro ao ligar NodeMCU: ${error.message}` });
                }
            }else{
                // Remover o total_cost e o end_time do usageHistory
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

const ligarMaquinaFicha = (id_maquina,id_user) => {
    // Verificar se NODEMCU está conectado. Caso contrario devolver mensagem de erro.
    // Verificar se Maquina está em liberada.   Caso contrario devolver mensagem de erro.
    // Criar usageHistory, se der certo mandar ligar nodemcu. Se der errado mensagem de erro.
    // Se o nodemcu ligar, mudar o status da maquina para ligado.
    // Se o nodemcu der errado , e mudar o status da maquina para desligada e deletar o usageHistory criado.
};

const desligarMaquinaFicha = (id_maquina,id_user) => {
    // Pegar atributos maquina 
    // Pegar o valor da hora do prédio.
    // Verificar se NODEMCU está conectado. Caso contrario devolver mensagem de erro.
    // Verificar se Maquina está em uso pelo usuario. Caso contrario devolver mensagem de erro. Se for Admin não precisa.
    // Encerrar usageHistory. Caso contrario devolver mensagem de erro.
    // Criar transaction. Caso contrario devolver mensagem de erro e remove o encerramento do usageHistory.
    // Desligar NodeMcu. Em caso de erro, deletar transaction e remover o encerramento do usageHistory. Devolver mensagem de erro.
    // Mudar status maquina. Caso de erro,  deletar transaction, remover o encerramento do usageHistory e religar o NodeMcu.
    // Criar função de deletar transaction, devolvendo mensagem de erro.
    // Criar função de remover o encerramento do usageHistory, devolvendo mensagem de erro.
    // Criar função de Encerrar usageHistory, devolvendo mensagem de erro.
    // Criar função de Criar transaction, devolvendo mensagem de erro.
    // Criar função de Desligar NodeMcu, devolvendo mensagem de erro.
    // Criar função de Mudar status maquina, devolvendo mensagem de erro.
};




module.exports = {
    desligarMaquina,
    ligarMaquina
};
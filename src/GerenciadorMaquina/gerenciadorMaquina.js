const { wss, connections } = require('../websocket');
const Utilidades = require('./utilidades');
const MachineModel = require('../models/machineModel');
const UserModel = require('../models/usersModel');
const TransactionModel = require('../models/transactionModel');
const UsageHistory = require('../models/usageHistoryModel');


// Agendar a execução da função a cada minuto

const gerenciarEstadosECreditos = async () => {
    const machines = await MachineModel.getAllMachines();
    for (const machine of machines) {
        if (machine.is_in_use) {
            const machineUsageHistory = await UsageHistory.getAllUsageHistoryByMachine(machine.id);
            const lastUsage = machineUsageHistory[machineUsageHistory.length - 1];
            const start_time = lastUsage.start_time;
            const date = new Date();
            const timeDifferenceInMinutes = Math.floor((date - start_time) / (1000 * 60)); // Calcula a diferença de tempo em minutos
            if(machine.type =="Industrial-Lava" ||  machine.type =="Industrial-Seca"){
                console.log("Entrou na industrial")
                // Maquinas industriais
                if(timeDifferenceInMinutes>machine.tempo_uso){
                    // Muda o status da máquina para desligada.
                    const machineStatus = await Utilidades.updateMachineStatus(machine.id, false);
                    console.log("Máquina industrial com nodeId: ", machine.idNodemcu, " desligada.");
                }
            }else{
                // Maquinas residenciais
                const user = await UserModel.getUser(lastUsage.user_id);
                if(user.tipo_pagamento == "pre-pago"){
                    const creditDeduction = parseFloat(machine.hourly_rate)/60
                    if(parseFloat(user.credito)-creditDeduction>0){
                        UserModel.updateUserCreditToDescount(user.id, creditDeduction)
                        console.log("Credito:",parseFloat(user.credito)-creditDeduction)
                    }else{
                        // Desligar máquina
                        console.log("Desligando a máquina pois acabou o crédito do usuário com id:",user.id)
                        const resultado = await desligarMaquina(machine.id, null, user.id); // passando null como res
                        console.log(resultado.message)
                    }
                }
            }
        }
    }
}


setInterval(gerenciarEstadosECreditos, 60 * 1000); // 60 segundos * 1000 milissegundos

const ligarMaquina = async (req, res) => {
    try {
        const { id_maquina, id_user } = req.body;
        // Buscar informações da máquina pelo ID
        const machine = await MachineModel.getMachineById(id_maquina);
        const user = await UserModel.getUser(id_user);
        
        if(Utilidades.verificarSePossuiCreditoResidencial(machine,user)){
            return Utilidades.tratarBadRequest(res,"Mínimo 2 horas de crédito." )
        }
        // Verificar se a máquina está conectada
        const targetConnection = Utilidades.verificarConexao(machine, connections);
        if (!targetConnection) {
            return Utilidades.tratarBadRequest(res,"Máquina não está conectada!" )
        }
        // Verificar se a máquina já está ligada
        if (machine.is_in_use) {
            return Utilidades.tratarBadRequest(res,"Máquina já está ligada!")
        }
        console.log("Ligando a máquina:"+ machine.idNodemcu + " para o usuário:" + id_user);
        // Chamar a função separada para lidar com a tentativa de ligar o NodeMCU
        const ligarNodeMcuResult = await Utilidades.operacaoNodeMcu(machine, res,"ligar");
        // Se a tentativa de ligar o NodeMCU falhar, interrompa a execução
        if (!ligarNodeMcuResult.success) {
            return Utilidades.tratarBadRequest(res,"Falha ao ligar máquina!")
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
                return Utilidades.tratarErro(res, "Falha ao criar o histórico de uso.");
            }
        } else {
            // Falha ao atualizar o status da máquina
            return Utilidades.tratarErro(res, "Falha ao mudar status máquina.");
        }
    } catch (err) {
        // Erro durante o processamento
       return Utilidades.tratarErro(res, "Erro no processamento: " + err.message);

    }
};



const ligarMaquinaIndustrial = async (req, res) => {
    try {
        const { id_maquina, id_user } = req.body;
        console.log("Request body:", req.body);
        const user = await UserModel.getUser(id_user);
        // Buscar informações da máquina pelo ID
        const machine = await MachineModel.getMachineById(id_maquina);

        if(Utilidades.verificarSePossuiCreditoIndustrial(machine,user)){
           return Utilidades.tratarBadRequest(res,"Crédito insuficiente")
        }
        // Verificar se a máquina está conectada
        const targetConnection = Utilidades.verificarConexao(machine, connections);
        if (!targetConnection) {
           return Utilidades.tratarBadRequest(res,"Máquina não está conectada!")
        }

        // Verificar se a máquina já está ligada
        if (machine.is_in_use) {
            return Utilidades.tratarBadRequest(res,"Máquina já está ligada!")
        }
        console.log("Ligando a máquina:"+ machine.idNodemcu + " para o usuário:" + id_user);

        // Chamar a função separada para lidar com a tentativa de ligar o NodeMCU
        const ligarNodeMcuResult = await Utilidades.operacaoNodeMcu(machine, res,"ligar");
        // Se a tentativa de ligar o NodeMCU falhar, interrompa a execução
        if (!ligarNodeMcuResult.success) {
            return Utilidades.tratarBadRequest(res,"Falha ao ligar máquina!")
        }

        // Atualizar o status da máquina no banco de dados
        const machineStatus = await Utilidades.updateMachineStatus(machine.id,true);
        
        if (machineStatus) {
            // Criar registro de histórico de uso
            const usage = await Utilidades.createUsageHistory({ user_id: id_user, machine_id: id_maquina });
            if (usage) {
                const usageHistoryEncerrada = await Utilidades.encerrarUsageHistoryIndustrial(usage,machine,user.tipo_pagamento);
                const transaction = {
                    user_id: id_user,
                    usage_history_id: usageHistoryEncerrada.lastUsage.id || 0,
                    transaction_time: usageHistoryEncerrada.lastUsage.end_time,
                    amount: usageHistoryEncerrada.lastUsage.total_cost || 0
                };
                const createTransactions = await TransactionModel.createTransaction(transaction);
                if(createTransactions){
                    console.log("Criado o registro para a máquina:"+ machine.idNodemcu + " para o usuário:" + id_user);
                    if(user.tipo_pagamento=="pre-pago" && user.role!="admin"){
                        UserModel.updateUserCreditToDescount(id_user, usageHistoryEncerrada.lastUsage.total_cost || 0)
                    }
                    res.status(200).json({ message: "Máquina ligada com sucesso!" });
                } else {
                    // Falha ao criar o histórico de uso
                    return Utilidades.tratarErro(res,"Falha ao criar transaction.");
                }
            } else {
                // Falha ao criar o histórico de uso
                return Utilidades.tratarErro(res,"Falha ao criar o histórico de uso.");
            }
        } else {
            // Falha ao atualizar o status da máquina
            return Utilidades.tratarErro(res,"Falha ao mudar status máquina.");
        }
    } catch (err) {
        // Erro durante o processamento
        return Utilidades.tratarErro(res, `Erro no processamento: ${err.message}`);
    }
};

const desligarMaquinaRota = async (req, res) => {
    const { id_maquina, id_user } = req.body;
    const resultado = await desligarMaquina(id_maquina,res, id_user);
    console.log(resultado.message)
    
    if (resultado.success) {
        res.status(200).json({ message: resultado.message });
    } else {
        res.status(500).json({ message: resultado.message });
    }
}

const desligarMaquina = async (id_maquina,res, id_user) => {
    try {
        // Buscar informações da máquina pelo ID
        const machine = await MachineModel.getMachineById(id_maquina);
        const machineUsageHistory = await UsageHistory.getAllUsageHistoryByMachine(id_maquina);
        const lastUsage = machineUsageHistory[machineUsageHistory.length - 1];
        const user = await UserModel.getUser(id_user);

        // Verificar se a máquina está conectada
        const targetConnection = Utilidades.verificarConexao(machine, connections);
        if (!targetConnection) {
            return { success: false, message: "Máquina não está conectada!" };
        }

        // Verificar se a máquina já está sendo usada pelo usuário correto.
        if ((!lastUsage || lastUsage.user_id != id_user) && user.role !== "admin") {
            return { success: false, message: "Máquina sendo utilizada por outro usuário!" };
        }

        console.log("Desligando a máquina:" + machine.idNodemcu + " para o usuário:" + id_user);

        // Chamar a função separada para lidar com a tentativa de ligar o NodeMCU
        const desligarNodeMcuResult = await Utilidades.operacaoNodeMcu(machine, res,"desligar");
        // Se a tentativa de ligar o NodeMCU falhar, interrompa a execução
        if (!desligarNodeMcuResult.success) {
            return { success: false, message: "Falha ao desligar o NodeMCU!" };
        }

        const usageHistoryEncerrada = await Utilidades.encerrarUsageHistory(lastUsage, machine, user.tipo_pagamento);

        if (usageHistoryEncerrada) {
            const transaction = {
                user_id: usageHistoryEncerrada.lastUsage.user_id,
                usage_history_id: usageHistoryEncerrada.lastUsage.id || 0,
                transaction_time: usageHistoryEncerrada.lastUsage.end_time,
                amount: usageHistoryEncerrada.lastUsage.total_cost || 0
            };

            const createTransactions = await TransactionModel.createTransaction(transaction);

            if (createTransactions) {
                // Atualizar o status da máquina no banco de dados
                const machineStatus = await Utilidades.updateMachineStatus(machine.id, false);
                if (machineStatus) {
                    // Máquina desligada com sucesso
                    return { success: true, message: "Máquina desligada com sucesso!" };
                } else {
                    return { success: false, message: "Falha ao mudar status da máquina." };
                }
            } else {
                return { success: false, message: "Falha ao criar transação." };
            }
        } else {
            // Falha ao encerrar o histórico de uso
            return { success: false, message: "Falha ao encerrar o histórico de uso." };
        }
    } catch (err) {
        // Lidar com erros
        return { success: false, message: "Erro no processamento: " + err.message };
    }
};





module.exports = {
    desligarMaquina,
    ligarMaquina,
    ligarMaquinaIndustrial,
    desligarMaquinaRota
};

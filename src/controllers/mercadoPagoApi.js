const { MercadoPagoConfig, Preference, Payment } = require('mercadopago');
const PreferenceModel = require('../models/preferenceModel');

// Configuração do MercadoPago
const client = new MercadoPagoConfig({ accessToken: 'TEST-2792798944696480-022909-a9d60f710950cc2410e2814e6b932a02-1703867985' });
const preference = new Preference(client);

// Função para criar a preferência e obter o link de redirecionamento
async function criarPreferencia(req, res) {
  try {
    const body = req.body;

    // Cria a preferência no MercadoPago
    const preferenceResponse = await preference.create({ body });
    const preferenceId = preferenceResponse.id;

    // Cria a preferência no banco de dados
    const preferenciaBanco = {
      user_id: body.user_id,
      valor_total: body.total_amount, // ou outro campo que represente o valor total
      informacoes_adicionais: body.additional_info,
      referencia_externa: preferenceId
      // Adicione outros campos, se necessário
    };

    await PreferenceModel.criarPreferencia(preferenciaBanco);
    console.log(preferenceResponse)

    const redirectUrl = preferenceResponse.sandbox_init_point;
    
    res.json({ redirectUrl });
  } catch (error) {
    console.error('Erro ao criar preferência:', error);
    res.status(500).json({ error: 'Erro ao processar a requisição' });
  }
}


async function verificarStatusPreferencia() {
  try {
    // Obtém todas as preferências pendentes do banco de dados
    const preferenciasPendentes = await PreferenceModel.getPreferenciasPendentes();
    // Array para armazenar o status de cada preferência
    const statusPreferencias = [];

    // Itera sobre as preferências pendentes
    for (const preferencia of preferenciasPendentes) {
      const preferenceId = preferencia.referencia_externa;
      console.log(preferenceId);
      // Obtém o status da preferência na API do MercadoPago
      const payment = new Payment(client); // Crie uma instância de Payment
      const paymentInfo = await payment.get(preferenceId); // Use o ID da preferência como ID do pagamento

      // Adiciona o status da preferência ao array
      statusPreferencias.push({
        preferenceId: preferenceId,
        status: paymentInfo.status
      });
    }

    // Retorna o array com o status de cada preferência
    return statusPreferencias;
  } catch (error) {
    console.error('Erro ao verificar status das preferências:', error);
    throw error;
  }
}



module.exports = { criarPreferencia };

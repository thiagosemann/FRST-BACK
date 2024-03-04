const { MercadoPagoConfig, Preference } = require('mercadopago');
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

// Função para processar as informações do webhook do MercadoPago
async function processarWebhookMercadoPago(payload) {
  try {
    // Verifica se o payload do webhook está presente
    if (!payload) {
      throw new Error('Payload do webhook não encontrado.');
    }

    // Verifica se o evento é de pagamento
    if (payload.hasOwnProperty('type') && payload.type === 'payment') {
      // Verifica o status do pagamento
      const status = payload.data.status;
      const preferenceId = payload.data.preference_id;

      // Atualiza o status da preferência no banco de dados
      await PreferenceModel.atualizarStatusPreferencia(preferenceId, status);

      // Retorna uma mensagem de sucesso
      return 'Status da preferência atualizado com sucesso.';
    } else {
      // Se o evento não for de pagamento, lança um erro
      throw new Error('Evento do webhook não é de pagamento.');
    }
  } catch (error) {
    console.error('Erro ao processar webhook do MercadoPago:', error);
    throw error;
  }
}



module.exports = { criarPreferencia,processarWebhookMercadoPago  };

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

async function processarWebhookMercadoPago(payload) {
  try {
    // Verifica se o payload do webhook está presente
    if (!payload) {
      throw new Error('Payload do webhook não encontrado.');
    }
    console.log(payload)
  } catch (error) {
    console.error('Erro ao processar webhook do MercadoPago:', error);
    throw error;
  }
}



module.exports = { criarPreferencia,processarWebhookMercadoPago };

const { MercadoPagoConfig, Preference } = require('mercadopago');
const PreferenceModel = require('../models/preferenceModel');

// Configuração do MercadoPago
const client = new MercadoPagoConfig({ accessToken: 'TEST-6272446964000180-030108-1c4db8aeafbd866a9eff81ca0a1f856e-108977853' });
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
      referencia_externa: body.external_reference
      // Adicione outros campos, se necessário
    };

    await PreferenceModel.criarPreferencia(preferenciaBanco);

    const redirectUrl = `https://www.mercadopago.com.br/checkout/v1/redirect?preference-id=${preferenceId}`;
    
    res.json({ redirectUrl });
  } catch (error) {
    console.error('Erro ao criar preferência:', error);
    res.status(500).json({ error: 'Erro ao processar a requisição' });
  }
}

module.exports = { criarPreferencia };

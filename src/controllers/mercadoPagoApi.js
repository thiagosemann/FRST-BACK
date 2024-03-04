const { MercadoPagoConfig, Preference, Payment } = require('mercadopago');
const PreferenceModel = require('../models/preferenceModel');
const axios = require('axios');

const access_token ="TEST-2792798944696480-022909-a9d60f710950cc2410e2814e6b932a02-1703867985";
// Configuração do MercadoPago
const client = new MercadoPagoConfig({ accessToken: access_token });
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

async function processarWebhookMercadoPago(req, res) {
  try {
    // Verifica se o payload do webhook está presente
    console.log("payload.body",req.body);
    
    const { data, type } = req.body;
    const { id } = data;

    // Faz a consulta à API do MercadoPago para obter informações sobre o pagamento
    const url = `https://api.mercadopago.com/v1/payments/${id}?access_token=${access_token}`;
    const response = await axios.get(url);

    // Verifica se a consulta foi bem-sucedida
    if (response.status === 200) {
      const paymentInfo = response.data;
      console.log(paymentInfo);

      // Atualiza o status do pagamento no banco de dados
      const status = paymentInfo.status;
      await PreferenceModel.atualizarPreferencia(id, status); // Supondo que haja uma função para atualizar o status no banco de dados

      // Envie uma resposta de sucesso de volta para o Mercado Pago
      res.status(200).send('Webhook processado com sucesso.');
    } else {
      console.error('Erro ao processar webhook do MercadoPago:', response.statusText);
      // Envie uma resposta de erro de volta para o Mercado Pago
      res.status(500).send('Erro ao processar webhook do MercadoPago.');
    }

  } catch (error) {
    console.error('Erro ao processar webhook do MercadoPago:', error);
    // Envie uma resposta de erro de volta para o Mercado Pago
    res.status(500).send('Erro ao processar webhook do MercadoPago.');
  }
}




module.exports = { criarPreferencia,processarWebhookMercadoPago };

const { MercadoPagoConfig, Preference, Payment } = require('mercadopago');
const PaymentModel = require('../models/paymentModel');
const UsersModel = require('../models/usersModel');

const axios = require('axios');

const access_token ="TEST-3018284182681256-031908-c0c6e5a8f2b101ad926e1b827ee4fec9-1733586702";
// Configuração do MercadoPago
const client = new MercadoPagoConfig({ accessToken: access_token });
const preference = new Preference(client);

// Função para criar a preferência e obter o link de redirecionamento
async function criarPreferencia(req, res) {
  try {
    const body = req.body;
    // Cria a preferência no MercadoPago
    const preferenceResponse = await preference.create({ body });
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

    const { data } = req.body;
    const { id } = data;

    // Faz a consulta à API do MercadoPago para obter informações sobre o pagamento
    const url = `https://api.mercadopago.com/v1/payments/${id}?access_token=${access_token}`;
    const response = await axios.get(url);

    // Verifica se a consulta foi bem-sucedida
    if (response.status === 200) {
      const paymentInfo = response.data;
      if(paymentInfo.status == "approved"){
        const payment = {
          user_id: paymentInfo.metadata.user_id,
          valor_total: paymentInfo.transaction_amount, 
          tipo_pagamento: paymentInfo.payment_type_id,
          email_comprador: paymentInfo.payer.email,
        };     
        await PaymentModel.criarPagamento(payment);
        await UsersModel.updateUserCredit(payment.user_id, payment.valor_total);
        console.log("Pagamento efetuado:",payment);
        //Adicionar o paymentInfo.transaction_amount como credito ao usuario
        res.status(200).send('Webhook processado com sucesso.');
      }
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

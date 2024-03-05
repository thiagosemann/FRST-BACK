const connection = require('./connection');

const criarPagamento = async (preferencia) => {
  const { user_id, valor_total, tipo_pagamento, email_comprador} = preferencia;
  const query = 'INSERT INTO preferencia_mercado_pago (user_id, valor_total, tipo_pagamento, email_comprador) VALUES (?, ?, ?, ?)';
  const [result] = await connection.execute(query, [user_id, valor_total, tipo_pagamento, email_comprador]);
  return { insertId: result.insertId };
};

module.exports = {
    criarPagamento
};
  
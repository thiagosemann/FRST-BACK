const connection = require('./connection');

const criarPreferencia = async (preferencia) => {
  const { user_id, valor_total, informacoes_adicionais, referencia_externa } = preferencia;
  const status = 'pendente'; // Defina o status inicial como pendente
  const query = 'INSERT INTO preferencia_mercado_pago (user_id, valor_total, informacoes_adicionais, status, referencia_externa) VALUES (?, ?, ?, ?, ?)';
  const [result] = await connection.execute(query, [user_id, valor_total, informacoes_adicionais, status, referencia_externa]);
  return { insertId: result.insertId };
};

const atualizarPreferencia = async (preferenciaId, novoStatus) => {
  const query = 'UPDATE preferencia_mercado_pago SET status = ? WHERE id = ?';
  const [result] = await connection.execute(query, [novoStatus, preferenciaId]);
  return result;
};

const excluirPreferencia = async (preferenciaId) => {
  const query = 'DELETE FROM preferencia_mercado_pago WHERE id = ?';
  const [result] = await connection.execute(query, [preferenciaId]);
  return result;
};

const getPreferenciasPendentes = async () => {
  const status = 'pendente';
  const query = 'SELECT * FROM preferencia_mercado_pago WHERE status = ?';
  const [preferencias] = await connection.execute(query, [status]);
  return preferencias;
};

module.exports = {
  criarPreferencia,
  atualizarPreferencia,
  excluirPreferencia,
  getPreferenciasPendentes
};

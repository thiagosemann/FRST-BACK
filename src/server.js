require('dotenv').config(); // Carrega as variáveis de ambiente do arquivo .env
const app = require('./app');
const WebSocket = require('ws');

const PORT = process.env.PORT || 80;
const HOST = '0.0.0.0';

const server = app.listen(PORT, HOST, () => {
  console.log('Server running on', HOST + ':' + PORT);
});

// Definindo o tempo limite do servidor para 60 segundos (60000 milissegundos)
server.setTimeout(60000);

const { createWebSocketServer } = require('./websocket');
createWebSocketServer(server);

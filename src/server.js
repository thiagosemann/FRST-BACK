const app = require('./app');
require('dotenv').config();
const WebSocket = require('ws');

const PORT = process.env.PORT || 80;
const HOST = '0.0.0.0';

const server = app.listen(PORT, HOST, () => {
  console.log('Server running on', HOST + ':' + PORT);
});



const { createWebSocketServer } = require('./websocket');
createWebSocketServer(server);

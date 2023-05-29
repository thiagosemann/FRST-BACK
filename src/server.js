const app = require('./app');
require('dotenv').config();

const PORT = process.env.PORT || 3333;
const HOST = '0.0.0.0'; // Escuta em todas as interfaces de rede

app.listen(PORT, HOST, () => {
  console.log('Server running on', HOST + ':' + PORT);
});
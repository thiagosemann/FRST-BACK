const mysql = require('mysql2/promise');
require('dotenv').config();
const connection = mysql.createPool({
    host: "frst.ctvhkjlufgps.sa-east-1.rds.amazonaws.com",
    user: "admin",
    password: "admin123",
    database: "frst"
});

module.exports = connection;

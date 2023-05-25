const connection = require('./connection');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
require('dotenv').config();
const SECRET_KEY = process.env.SECRET_KEY; // substitua 'your_secret_key' por uma chave secreta forte


const getAllUsers = async () => {
  const [users] = await connection.execute('SELECT * FROM users');
  return users;
};

const saltRounds = 10;

const createUser = async (user) => {
  const { first_name, last_name, cpf, email, data_nasc, telefone, predio, credito, password } = user;
  
  // Gere o hash da senha
  const hashedPassword = await bcrypt.hash(password, saltRounds);

  const checkUserExistsQuery = 'SELECT * FROM users WHERE cpf = ? OR email = ? OR telefone = ?';
  const [existingUsers] = await connection.execute(checkUserExistsQuery, [cpf, email, telefone]);
  
  if (existingUsers.length > 0) {
    let conflictField = '';
    if (existingUsers[0].cpf === cpf) conflictField = 'CPF';
    else if (existingUsers[0].email === email) conflictField = 'e-mail';
    else if (existingUsers[0].telefone === telefone) conflictField = 'telefone';
    throw new Error(`Usuário com esse ${conflictField} já existe.`);
  }

  const insertUserQuery = 'INSERT INTO users (first_name, last_name, cpf, email, data_nasc, telefone, predio, credito, password) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)';
  const values = [first_name, last_name, cpf, email, data_nasc, telefone, predio, credito, hashedPassword];

  try {
    const [result] = await connection.execute(insertUserQuery, values);
    return { insertId: result.insertId };
  } catch (error) {
    console.error('Erro ao inserir usuário:', error);
    throw error;
  }
};

const loginUser = async (email, password) => {
  const query = `
    SELECT users.*, Buildings.name AS building_name
    FROM users
    LEFT JOIN Buildings ON users.building_id = Buildings.id
    WHERE email = ?
  `;
  const [users] = await connection.execute(query, [email]);

  if (users.length > 0) {
    const user = users[0];
    console.log(user);
    // Compare o hash da senha com a senha armazenada
    const match = await bcrypt.compare(password, user.password);
    if (match) {
      // Senha está correta
      const token = jwt.sign(
        { id: user.id, email: user.email },
        SECRET_KEY,
        { expiresIn: '1h' }
      );
      return { user, token };
    }
  }
};




module.exports = {
  getAllUsers,
  createUser,
  loginUser,
};
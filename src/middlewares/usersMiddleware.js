const validateUser = (request, response, next) => {
   const { body } = request;
 
   if (!body.first_name) {
     return response.status(400).json({ message: 'O primeiro nome é obrigatório' });
   }
   if (!body.last_name) {
     return response.status(400).json({ message: 'O sobrenome é obrigatório' });
   }
   if (!body.cpf) {
     return response.status(400).json({ message: 'O CPF é obrigatório' });
   }
   if (!body.email) {
     return response.status(400).json({ message: 'O email é obrigatório' });
   }
   if (!body.data_nasc) {
     return response.status(400).json({ message: 'A data de nascimento é obrigatória' });
   }
   if (!body.telefone) {
     return response.status(400).json({ message: 'O telefone é obrigatório' });
   }
   if (!body.predio) {
     return response.status(400).json({ message: 'O prédio é obrigatório' });
   }
   if (!body.credito) {
     return response.status(400).json({ message: 'O crédito é obrigatório' });
   }
 
   next();
 };


 
 module.exports = {
   validateUser,
 };
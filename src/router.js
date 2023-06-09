const express = require('express');
const router = express.Router();

const usersController = require('./controllers/usersController');
const machinesController = require('./controllers/machinesController');
const buildingsController = require('./controllers/buildingsController');
const usageHistoryController = require('./controllers/usageHistoryController');
const transactionsController = require('./controllers/transactionController');
const nodemcuController = require('./controllers/nodemcuController');

const usersMiddleware = require('./middlewares/usersMiddleware');
const validateMachine = require('./middlewares/machinesMiddleware');
const validateBuilding = require('./middlewares/buildingsMiddleware');
const validateTransaction = require('./middlewares/transactionMiddleware');
const verifyToken = require('./middlewares/authMiddleware');



// User routes
router.get('/users', usersController.getAllUsers);
router.get('/users/:id', verifyToken, usersController.getUser);
router.delete('/users/:id', verifyToken, usersController.deleteTask);
router.put('/users/:id', verifyToken, usersController.updateTask);
router.post('/login', usersController.loginUser);
router.post('/users', usersMiddleware.validateUser, usersController.createUser);

// Machine routes
router.get('/machines', verifyToken, machinesController.getAllMachines);
router.get('/machines/:id', verifyToken, machinesController.getMachineById);
router.get('/machines/building/:building_id', verifyToken, machinesController.getMachinesByBuilding);

router.post('/machines', verifyToken, validateMachine, machinesController.createMachine);
router.put('/machines/:id', verifyToken, machinesController.updateMachineStatus);

// Building routes
router.get('/buildings', verifyToken, buildingsController.getAllBuildings);
router.get('/buildings/:id', verifyToken, buildingsController.getBuildingById);

router.post('/buildings', verifyToken, validateBuilding, buildingsController.createBuilding);

// UsageHistory routes
router.get('/usageHistory/user/:id', verifyToken, usageHistoryController.getUserUsageHistory);
router.get('/usageHistory/machine/:id', verifyToken, usageHistoryController.getMachineUsageHistory);
router.get('/usageHistory', verifyToken, usageHistoryController.getAllUsageHistory);

router.post('/usageHistory', verifyToken, usageHistoryController.createUsageHistory);
router.put('/usageHistory/:id', verifyToken, usageHistoryController.updateUsageHistory);

// Transaction routes
router.get('/transactions', verifyToken, transactionsController.getAllTransactions);
router.post('/transactions', verifyToken, validateTransaction, transactionsController.createTransaction);

// Rotas nodemcu

router.get('/nodemcu/on/:id', nodemcuController.turnOn);
router.get('/nodemcu/off/:id', nodemcuController.turnOff);
router.get('/nodemcu/status/:id', nodemcuController.checkStatus);




module.exports = router;

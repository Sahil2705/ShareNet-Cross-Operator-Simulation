const express = require('express');
const router = express.Router();
const connectorController = require('../controllers/connectorController');
const { authenticateToken } = require('../middleware/authMiddleware');

router.get('/list', connectorController.listConnectors);
router.post('/test', authenticateToken, connectorController.testConnector);
router.post('/import', authenticateToken, connectorController.importConnectorData);

module.exports = router;

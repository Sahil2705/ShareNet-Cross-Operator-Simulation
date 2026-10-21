const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');
const { authenticateToken } = require('../middleware/authMiddleware');

router.use(authenticateToken);

router.get('/', dashboardController.getDashboards);
router.post('/', dashboardController.createDashboard);
router.get('/:id', dashboardController.getDashboardById);
router.put('/:id', dashboardController.saveFullDashboard);
router.delete('/:id', dashboardController.deleteDashboard);
router.post('/:id/widgets', dashboardController.addWidget);
router.delete('/:id/widgets/:widgetId', dashboardController.deleteWidget);

module.exports = router;

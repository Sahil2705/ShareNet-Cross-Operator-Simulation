const express = require('express');
const router = express.Router();
const queryController = require('../controllers/queryController');
const { authenticateToken } = require('../middleware/authMiddleware');

router.use(authenticateToken);

router.post('/:datasetId/aggregate', queryController.executeAggregation);
router.get('/:datasetId/distinct/:columnName', queryController.getDistinctColumnValues);
router.get('/:datasetId/recommendations', queryController.getChartRecommendations);

module.exports = router;

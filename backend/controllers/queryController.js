const queryEngineService = require('../services/queryEngineService');
const chartRecommenderService = require('../services/chartRecommenderService');
const datasetService = require('../services/datasetService');

/**
 * Execute aggregation query for Report Builder & Dashboard Widgets
 */
exports.executeAggregation = async (req, res) => {
  try {
    const { datasetId } = req.params;
    const config = req.body;
    const userId = req.user.id;

    const result = await queryEngineService.executeAggregationQuery(datasetId, userId, config);
    return res.json({ success: true, ...result });
  } catch (error) {
    console.error('Aggregation Query Error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Fetch distinct values for a given column (used for filter dropdowns)
 */
exports.getDistinctColumnValues = async (req, res) => {
  try {
    const { datasetId, columnName } = req.params;
    const userId = req.user.id;

    const values = await queryEngineService.getColumnDistinctValues(datasetId, userId, columnName);
    return res.json({ success: true, values });
  } catch (error) {
    console.error('Distinct Values Error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Get AI/Rule-based Chart Recommendations for selected fields
 */
exports.getChartRecommendations = async (req, res) => {
  try {
    const { datasetId } = req.params;
    const { dimensionField, measureField } = req.query;
    const userId = req.user.id;

    const dataset = await datasetService.getDatasetById(datasetId, userId);
    if (!dataset) return res.status(404).json({ success: false, message: 'Dataset not found' });

    const dimensionCol = dataset.columns.find((c) => c.columnName === dimensionField);
    const measureCol = dataset.columns.find((c) => c.columnName === measureField);

    const recommendations = chartRecommenderService.recommendChartTypes({
      dimensionCol,
      measureCol,
    });

    return res.json({ success: true, recommendations });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

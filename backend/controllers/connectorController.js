const { listSupportedConnectors, getConnector } = require('../connectors');
const datasetService = require('../services/datasetService');

exports.listConnectors = async (req, res) => {
  try {
    const connectors = listSupportedConnectors();
    return res.json({ success: true, connectors });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.testConnector = async (req, res) => {
  try {
    const { type, config } = req.body;
    if (!type || !config) {
      return res.status(400).json({ success: false, message: 'Connector type and configuration are required.' });
    }

    const connector = getConnector(type);
    const result = await connector.testConnection(config);
    return res.json({ success: result.success, ...result });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
};

exports.importConnectorData = async (req, res) => {
  try {
    const { type, config, name, description } = req.body;
    const userId = req.user.id;

    if (!type || !config || !name) {
      return res.status(400).json({ success: false, message: 'Type, config, and dataset name are required.' });
    }

    const connector = getConnector(type);
    const fetched = await connector.fetchData(config);

    if (!fetched.rows || fetched.rows.length === 0) {
      return res.status(400).json({ success: false, message: 'Source returned 0 rows to import.' });
    }

    const dataset = await datasetService.createDatasetFromData(userId, {
      name,
      sourceType: type,
      rows: fetched.rows,
      columns: fetched.columns,
      description: description || `Imported via ${connector.name} connector`,
    });

    return res.status(201).json({
      success: true,
      message: `Successfully imported ${dataset.rowCount} rows via ${connector.name}!`,
      dataset,
    });
  } catch (error) {
    console.error('Import Connector Error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

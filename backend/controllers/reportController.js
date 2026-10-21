const crypto = require('crypto');
const { query } = require('../config/db');

exports.createReport = async (req, res) => {
  try {
    const { datasetId, name, description, chartType, configuration } = req.body;
    const userId = req.user.id;

    if (!datasetId || !name || !chartType) {
      return res.status(400).json({ success: false, message: 'datasetId, name, and chartType are required.' });
    }

    const reportId = crypto.randomUUID();
    await query(
      `INSERT INTO reports (id, user_id, dataset_id, name, description, chart_type, configuration)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        reportId,
        userId,
        datasetId,
        name,
        description || '',
        chartType,
        typeof configuration === 'object' ? JSON.stringify(configuration) : configuration,
      ]
    );

    const saved = await query('SELECT * FROM reports WHERE id = ?', [reportId]);
    return res.status(201).json({ success: true, message: 'Report saved successfully!', report: saved[0] });
  } catch (error) {
    console.error('Save Report Error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.getReports = async (req, res) => {
  try {
    const reports = await query(
      `SELECT r.*, d.name AS dataset_name
       FROM reports r
       LEFT JOIN datasets d ON d.id = r.dataset_id
       WHERE r.user_id = ? OR r.user_id = 'demo-user-001'
       ORDER BY r.updated_at DESC`,
      [req.user.id]
    );

    const formatted = reports.map((r) => ({
      ...r,
      configuration: typeof r.configuration === 'string' ? JSON.parse(r.configuration) : r.configuration,
    }));

    return res.json({ success: true, reports: formatted });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.getReportById = async (req, res) => {
  try {
    const reports = await query(
      `SELECT r.*, d.name AS dataset_name, d.table_name
       FROM reports r
       LEFT JOIN datasets d ON d.id = r.dataset_id
       WHERE r.id = ? AND (r.user_id = ? OR r.user_id = 'demo-user-001') LIMIT 1`,
      [req.params.id, req.user.id]
    );

    if (reports.length === 0) {
      return res.status(404).json({ success: false, message: 'Report not found.' });
    }

    const report = reports[0];
    report.configuration = typeof report.configuration === 'string' ? JSON.parse(report.configuration) : report.configuration;

    return res.json({ success: true, report });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateReport = async (req, res) => {
  try {
    const { name, description, chartType, configuration } = req.body;

    await query(
      `UPDATE reports
       SET name = COALESCE(?, name),
           description = COALESCE(?, description),
           chart_type = COALESCE(?, chart_type),
           configuration = COALESCE(?, configuration)
       WHERE id = ? AND user_id = ?`,
      [
        name,
        description,
        chartType,
        configuration ? JSON.stringify(configuration) : null,
        req.params.id,
        req.user.id,
      ]
    );

    return res.json({ success: true, message: 'Report updated successfully!' });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.deleteReport = async (req, res) => {
  try {
    await query('DELETE FROM reports WHERE id = ? AND user_id = ?', [req.params.id, req.user.id]);
    return res.json({ success: true, message: 'Report deleted successfully' });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

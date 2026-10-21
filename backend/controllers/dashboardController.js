const crypto = require('crypto');
const { query } = require('../config/db');

/**
 * Get all dashboards for user
 */
exports.getDashboards = async (req, res) => {
  try {
    const dashboards = await query(
      `SELECT d.*, COUNT(w.id) AS widget_count
       FROM dashboards d
       LEFT JOIN dashboard_widgets w ON w.dashboard_id = d.id
       WHERE d.user_id = ? OR d.user_id = 'demo-user-001'
       GROUP BY d.id
       ORDER BY d.updated_at DESC`,
      [req.user.id]
    );

    const formatted = dashboards.map((d) => ({
      ...d,
      layout: typeof d.layout === 'string' ? JSON.parse(d.layout) : d.layout,
      global_filters: typeof d.global_filters === 'string' ? JSON.parse(d.global_filters) : d.global_filters,
    }));

    return res.json({ success: true, dashboards: formatted });
  } catch (error) {
    console.error('Get Dashboards Error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Get single dashboard by ID with all its widgets
 */
exports.getDashboardById = async (req, res) => {
  try {
    const dashboards = await query(
      `SELECT * FROM dashboards WHERE id = ? AND (user_id = ? OR user_id = 'demo-user-001') LIMIT 1`,
      [req.params.id, req.user.id]
    );

    if (dashboards.length === 0) {
      return res.status(404).json({ success: false, message: 'Dashboard not found.' });
    }

    const dashboard = dashboards[0];
    dashboard.layout = typeof dashboard.layout === 'string' ? JSON.parse(dashboard.layout) : dashboard.layout;
    dashboard.global_filters = typeof dashboard.global_filters === 'string' ? JSON.parse(dashboard.global_filters) : dashboard.global_filters;

    const widgets = await query(
      `SELECT w.*, d.name AS dataset_name, d.table_name
       FROM dashboard_widgets w
       LEFT JOIN datasets d ON d.id = w.dataset_id
       WHERE w.dashboard_id = ?
       ORDER BY w.position_y ASC, w.position_x ASC`,
      [dashboard.id]
    );

    dashboard.widgets = widgets.map((w) => ({
      ...w,
      configuration: typeof w.configuration === 'string' ? JSON.parse(w.configuration) : w.configuration,
    }));

    return res.json({ success: true, dashboard });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Create a new dashboard
 */
exports.createDashboard = async (req, res) => {
  try {
    const { name, description, widgets = [], global_filters = [] } = req.body;
    const userId = req.user.id;

    if (!name) {
      return res.status(400).json({ success: false, message: 'Dashboard name is required.' });
    }

    const dashboardId = crypto.randomUUID();

    await query(
      `INSERT INTO dashboards (id, user_id, name, description, global_filters)
       VALUES (?, ?, ?, ?, ?)`,
      [dashboardId, userId, name, description || '', JSON.stringify(global_filters)]
    );

    // Insert any initial widgets
    for (const w of widgets) {
      const widgetId = w.id || crypto.randomUUID();
      await query(
        `INSERT INTO dashboard_widgets (id, dashboard_id, dataset_id, widget_type, title, configuration, position_x, position_y, width, height)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          widgetId,
          dashboardId,
          w.dataset_id || w.datasetId,
          w.widget_type || w.widgetType,
          w.title || 'Widget',
          typeof w.configuration === 'object' ? JSON.stringify(w.configuration) : w.configuration,
          w.position_x || 0,
          w.position_y || 0,
          w.width || 6,
          w.height || 4,
        ]
      );
    }

    return res.status(201).json({
      success: true,
      message: 'Dashboard created successfully!',
      dashboardId,
    });
  } catch (error) {
    console.error('Create Dashboard Error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Full Dashboard Save (saves dashboard attributes + synchronizes all widgets)
 */
exports.saveFullDashboard = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, global_filters, widgets } = req.body;
    const userId = req.user.id;

    // Verify dashboard ownership
    const existing = await query('SELECT id FROM dashboards WHERE id = ? AND user_id = ?', [id, userId]);
    if (existing.length === 0) {
      // Check if it's the demo dashboard; if so, create a copy for the user
      const isDemo = await query('SELECT id FROM dashboards WHERE id = ?', [id]);
      if (isDemo.length > 0) {
        // Fork/clone for current user
        const newId = crypto.randomUUID();
        await query(
          `INSERT INTO dashboards (id, user_id, name, description, global_filters)
           VALUES (?, ?, ?, ?, ?)`,
          [newId, userId, `${name} (My Copy)`, description || '', JSON.stringify(global_filters || [])]
        );
        for (const w of widgets || []) {
          await query(
            `INSERT INTO dashboard_widgets (id, dashboard_id, dataset_id, widget_type, title, configuration, position_x, position_y, width, height)
             VALUES (UUID(), ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              newId,
              w.dataset_id || w.datasetId,
              w.widget_type || w.widgetType,
              w.title,
              typeof w.configuration === 'object' ? JSON.stringify(w.configuration) : w.configuration,
              w.position_x || 0,
              w.position_y || 0,
              w.width || 6,
              w.height || 4,
            ]
          );
        }
        return res.json({ success: true, message: 'Saved as your personal dashboard copy!', dashboardId: newId });
      }
      return res.status(404).json({ success: false, message: 'Dashboard not found.' });
    }

    // Update dashboard metadata
    await query(
      `UPDATE dashboards
       SET name = COALESCE(?, name),
           description = COALESCE(?, description),
           global_filters = COALESCE(?, global_filters)
       WHERE id = ?`,
      [name, description, global_filters ? JSON.stringify(global_filters) : null, id]
    );

    // Sync widgets: delete current widgets and re-insert updated list
    if (Array.isArray(widgets)) {
      await query('DELETE FROM dashboard_widgets WHERE dashboard_id = ?', [id]);

      for (const w of widgets) {
        const widgetId = w.id || crypto.randomUUID();
        await query(
          `INSERT INTO dashboard_widgets (id, dashboard_id, dataset_id, widget_type, title, configuration, position_x, position_y, width, height)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            widgetId,
            id,
            w.dataset_id || w.datasetId,
            w.widget_type || w.widgetType,
            w.title || 'Widget',
            typeof w.configuration === 'object' ? JSON.stringify(w.configuration) : w.configuration,
            w.position_x || 0,
            w.position_y || 0,
            w.width || 6,
            w.height || 4,
          ]
        );
      }
    }

    return res.json({ success: true, message: 'Dashboard saved successfully!' });
  } catch (error) {
    console.error('Save Full Dashboard Error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Delete dashboard
 */
exports.deleteDashboard = async (req, res) => {
  try {
    await query('DELETE FROM dashboards WHERE id = ? AND user_id = ?', [req.params.id, req.user.id]);
    return res.json({ success: true, message: 'Dashboard deleted successfully' });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Add single widget to dashboard
 */
exports.addWidget = async (req, res) => {
  try {
    const { id } = req.params;
    const { dataset_id, widget_type, title, configuration, position_x, position_y, width, height } = req.body;
    const widgetId = crypto.randomUUID();

    await query(
      `INSERT INTO dashboard_widgets (id, dashboard_id, dataset_id, widget_type, title, configuration, position_x, position_y, width, height)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        widgetId,
        id,
        dataset_id,
        widget_type,
        title,
        typeof configuration === 'object' ? JSON.stringify(configuration) : configuration,
        position_x || 0,
        position_y || 0,
        width || 6,
        height || 4,
      ]
    );

    return res.status(201).json({ success: true, message: 'Widget added successfully', widgetId });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Delete widget from dashboard
 */
exports.deleteWidget = async (req, res) => {
  try {
    await query('DELETE FROM dashboard_widgets WHERE id = ?', [req.params.widgetId]);
    return res.json({ success: true, message: 'Widget deleted successfully' });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

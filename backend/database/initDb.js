const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const { pool, rawQuery, query } = require('../config/db');

async function initDatabase() {
  console.log('Initializing database tables...');
  try {
    // 1. Users Table
    await rawQuery(`
      CREATE TABLE IF NOT EXISTS users (
        id VARCHAR(36) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL UNIQUE,
        password_hash VARCHAR(255) NOT NULL,
        role VARCHAR(32) DEFAULT 'user',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_user_email (email)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // 2. Datasets Table
    await rawQuery(`
      CREATE TABLE IF NOT EXISTS datasets (
        id VARCHAR(36) PRIMARY KEY,
        user_id VARCHAR(36) NOT NULL,
        name VARCHAR(255) NOT NULL,
        source_type VARCHAR(64) NOT NULL,
        file_name VARCHAR(255) NULL,
        file_size INT DEFAULT 0,
        row_count INT DEFAULT 0,
        column_count INT DEFAULT 0,
        table_name VARCHAR(128) NOT NULL,
        description TEXT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_datasets_user (user_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // 3. Dataset Columns Table
    await rawQuery(`
      CREATE TABLE IF NOT EXISTS dataset_columns (
        id VARCHAR(36) PRIMARY KEY,
        dataset_id VARCHAR(36) NOT NULL,
        column_name VARCHAR(255) NOT NULL,
        display_name VARCHAR(255) NOT NULL,
        data_type VARCHAR(64) NOT NULL,
        position INT DEFAULT 0,
        is_visible TINYINT(1) DEFAULT 1,
        null_count INT DEFAULT 0,
        unique_count INT DEFAULT 0,
        sample_values JSON NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_columns_dataset (dataset_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // 4. Dashboards Table
    await rawQuery(`
      CREATE TABLE IF NOT EXISTS dashboards (
        id VARCHAR(36) PRIMARY KEY,
        user_id VARCHAR(36) NOT NULL,
        name VARCHAR(255) NOT NULL,
        description TEXT NULL,
        layout JSON NULL,
        global_filters JSON NULL,
        is_favorite TINYINT(1) DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_dashboards_user (user_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // 5. Dashboard Widgets Table
    await rawQuery(`
      CREATE TABLE IF NOT EXISTS dashboard_widgets (
        id VARCHAR(36) PRIMARY KEY,
        dashboard_id VARCHAR(36) NOT NULL,
        dataset_id VARCHAR(36) NULL,
        widget_type VARCHAR(64) NOT NULL,
        title VARCHAR(255) NOT NULL,
        configuration JSON NOT NULL,
        position_x INT DEFAULT 0,
        position_y INT DEFAULT 0,
        width INT DEFAULT 6,
        height INT DEFAULT 4,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_widgets_dashboard (dashboard_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // 6. Reports Table
    await rawQuery(`
      CREATE TABLE IF NOT EXISTS reports (
        id VARCHAR(36) PRIMARY KEY,
        user_id VARCHAR(36) NOT NULL,
        dataset_id VARCHAR(36) NOT NULL,
        name VARCHAR(255) NOT NULL,
        description TEXT NULL,
        chart_type VARCHAR(64) NOT NULL,
        configuration JSON NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_reports_user (user_id),
        INDEX idx_reports_dataset (dataset_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // 7. Data Sources Table
    await rawQuery(`
      CREATE TABLE IF NOT EXISTS data_sources (
        id VARCHAR(36) PRIMARY KEY,
        user_id VARCHAR(36) NOT NULL,
        name VARCHAR(255) NOT NULL,
        type VARCHAR(64) NOT NULL,
        connection_config JSON NOT NULL,
        status VARCHAR(32) DEFAULT 'connected',
        last_synced_at DATETIME NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_sources_user (user_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    console.log('Core tables successfully verified/created.');

    // Seed Demo User if not exists
    const demoEmail = 'demo@abhiikarkede.hu';
    const existingUser = await query('SELECT id FROM users WHERE email = ? LIMIT 1', [demoEmail]);

    let demoUserId = 'demo-user-001';
    if (!existingUser || existingUser.length === 0) {
      const passwordHash = await bcrypt.hash('Demo@1234', 10);
      await query(
        'INSERT INTO users (id, name, email, password_hash, role) VALUES (?, ?, ?, ?, ?)',
        [demoUserId, 'Abhii Demo User', demoEmail, passwordHash, 'admin']
      );
      console.log('Created default demo user: demo@abhiikarkede.hu / Demo@1234');
    } else {
      demoUserId = existingUser[0].id;
    }

    // Seed Sample E-Commerce Dataset if not exists
    const demoDatasetId = 'demo-sales-dataset-01';
    const existingDataset = await query('SELECT id FROM datasets WHERE id = ? LIMIT 1', [demoDatasetId]);

    if (!existingDataset || existingDataset.length === 0) {
      const demoTableName = 'ds_demo_sales';
      await query(
        `INSERT INTO datasets (id, user_id, name, source_type, file_name, file_size, row_count, column_count, table_name, description)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          demoDatasetId,
          demoUserId,
          'Global Sales & Revenue Analytics',
          'csv',
          'global_sales_2026.csv',
          45200,
          20,
          7,
          demoTableName,
          'Curated e-commerce demo dataset with Products, Categories, Regions, Sales, Orders, and Profit'
        ]
      );

      // Create Dynamic Table for demo dataset
      await rawQuery(`
        CREATE TABLE IF NOT EXISTS \`${demoTableName}\` (
          _row_id INT AUTO_INCREMENT PRIMARY KEY,
          Product VARCHAR(255),
          Category VARCHAR(255),
          Region VARCHAR(255),
          Sales DECIMAL(12, 2),
          Quantity INT,
          Profit DECIMAL(12, 2),
          Order_Date DATE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
      `);

      // Seed Rows
      const demoRows = [
        ['UltraBook Pro 16', 'Electronics', 'North', 145000.00, 10, 29000.00, '2026-01-15'],
        ['Wireless ANC Headphones', 'Audio', 'South', 32000.00, 16, 8000.00, '2026-01-18'],
        ['Ergonomic Office Chair', 'Furniture', 'West', 78000.00, 12, 19500.00, '2026-02-01'],
        ['Mechanical Keyboard', 'Accessories', 'East', 24500.00, 25, 6125.00, '2026-02-10'],
        ['Smart Fitness Watch', 'Wearables', 'North', 65000.00, 20, 16250.00, '2026-02-14'],
        ['4K Gaming Monitor', 'Electronics', 'West', 185000.00, 15, 37000.00, '2026-02-20'],
        ['USB-C Multiport Hub', 'Accessories', 'South', 18000.00, 30, 4500.00, '2026-03-02'],
        ['Standing Desk Converter', 'Furniture', 'East', 92000.00, 8, 23000.00, '2026-03-05'],
        ['Noise-Cancelling Earbuds', 'Audio', 'North', 42000.00, 28, 10500.00, '2026-03-12'],
        ['iPad Pro Protective Case', 'Accessories', 'South', 12500.00, 35, 3125.00, '2026-03-18'],
        ['UltraBook Air 13', 'Electronics', 'East', 110000.00, 11, 22000.00, '2026-04-02'],
        ['Studio Microphone RGB', 'Audio', 'West', 38000.00, 19, 9500.00, '2026-04-10'],
        ['Mesh High-Back Chair', 'Furniture', 'North', 64000.00, 14, 16000.00, '2026-04-15'],
        ['Dual Monitor Arm Stand', 'Furniture', 'South', 28000.00, 20, 7000.00, '2026-04-20'],
        ['Solar Fast PowerBank', 'Accessories', 'East', 19500.00, 40, 4875.00, '2026-05-01'],
        ['OLED 34-inch Ultrawide', 'Electronics', 'West', 240000.00, 12, 48000.00, '2026-05-08'],
        ['Smart Ring Health Tracker', 'Wearables', 'South', 54000.00, 18, 13500.00, '2026-05-14'],
        ['Wireless Trackpad Pro', 'Accessories', 'North', 21000.00, 22, 5250.00, '2026-05-22'],
        ['Bluetooth Conference Speaker', 'Audio', 'East', 46000.00, 15, 11500.00, '2026-06-01'],
        ['Heavy Duty Cable Organizer', 'Accessories', 'West', 9500.00, 50, 2375.00, '2026-06-05']
      ];

      for (const r of demoRows) {
        await query(
          `INSERT INTO \`${demoTableName}\` (Product, Category, Region, Sales, Quantity, Profit, Order_Date) VALUES (?, ?, ?, ?, ?, ?, ?)`,
          r
        );
      }

      // Add Dataset Columns Metadata
      const columnsMetadata = [
        ['Product', 'Product Name', 'string', 0, 0, 15],
        ['Category', 'Product Category', 'string', 1, 0, 5],
        ['Region', 'Sales Region', 'string', 2, 0, 4],
        ['Sales', 'Revenue (₹)', 'number', 3, 0, 20],
        ['Quantity', 'Units Sold', 'number', 4, 0, 18],
        ['Profit', 'Net Profit (₹)', 'number', 5, 0, 20],
        ['Order_Date', 'Order Date', 'date', 6, 0, 20],
      ];

      for (const col of columnsMetadata) {
        await query(
          `INSERT INTO dataset_columns (id, dataset_id, column_name, display_name, data_type, position, null_count, unique_count)
           VALUES (UUID(), ?, ?, ?, ?, ?, ?, ?)`,
          [demoDatasetId, col[0], col[1], col[2], col[3], col[4], col[5]]
        );
      }

      // Seed Default Demo Dashboard
      const demoDashboardId = 'demo-dashboard-01';
      await query(
        `INSERT INTO dashboards (id, user_id, name, description, is_favorite)
         VALUES (?, ?, ?, ?, 1)`,
        [
          demoDashboardId,
          demoUserId,
          'Executive Revenue & Sales Dashboard',
          'Comprehensive overview of product category performance, regional revenue distribution, and profit metrics.'
        ]
      );

      // Seed 4 Widgets for Demo Dashboard
      const widgets = [
        {
          id: 'widget-kpi-1',
          dashboard_id: demoDashboardId,
          dataset_id: demoDatasetId,
          widget_type: 'kpi',
          title: 'Total Revenue',
          configuration: JSON.stringify({
            measureField: 'Sales',
            aggregation: 'SUM',
            prefix: '₹',
            format: 'currency',
            subtitle: 'vs Last Quarter: +18.4%'
          }),
          position_x: 0,
          position_y: 0,
          width: 3,
          height: 2
        },
        {
          id: 'widget-kpi-2',
          dashboard_id: demoDashboardId,
          dataset_id: demoDatasetId,
          widget_type: 'kpi',
          title: 'Total Profit',
          configuration: JSON.stringify({
            measureField: 'Profit',
            aggregation: 'SUM',
            prefix: '₹',
            format: 'currency',
            subtitle: 'Margin: 24.2%'
          }),
          position_x: 3,
          position_y: 0,
          width: 3,
          height: 2
        },
        {
          id: 'widget-kpi-3',
          dashboard_id: demoDashboardId,
          dataset_id: demoDatasetId,
          widget_type: 'kpi',
          title: 'Units Sold',
          configuration: JSON.stringify({
            measureField: 'Quantity',
            aggregation: 'SUM',
            prefix: '',
            format: 'number',
            subtitle: 'Across 4 Regions'
          }),
          position_x: 6,
          position_y: 0,
          width: 3,
          height: 2
        },
        {
          id: 'widget-kpi-4',
          dashboard_id: demoDashboardId,
          dataset_id: demoDatasetId,
          widget_type: 'kpi',
          title: 'Total Products',
          configuration: JSON.stringify({
            measureField: 'Product',
            aggregation: 'DISTINCT_COUNT',
            prefix: '',
            format: 'number',
            subtitle: 'Active SKUs'
          }),
          position_x: 9,
          position_y: 0,
          width: 3,
          height: 2
        },
        {
          id: 'widget-chart-bar',
          dashboard_id: demoDashboardId,
          dataset_id: demoDatasetId,
          widget_type: 'bar',
          title: 'Revenue by Product Category',
          configuration: JSON.stringify({
            dimensionField: 'Category',
            measureField: 'Sales',
            aggregation: 'SUM',
            chartType: 'bar',
            sortBy: 'desc'
          }),
          position_x: 0,
          position_y: 2,
          width: 6,
          height: 4
        },
        {
          id: 'widget-chart-donut',
          dashboard_id: demoDashboardId,
          dataset_id: demoDatasetId,
          widget_type: 'donut',
          title: 'Sales Distribution by Region',
          configuration: JSON.stringify({
            dimensionField: 'Region',
            measureField: 'Sales',
            aggregation: 'SUM',
            chartType: 'donut'
          }),
          position_x: 6,
          position_y: 2,
          width: 6,
          height: 4
        },
        {
          id: 'widget-chart-line',
          dashboard_id: demoDashboardId,
          dataset_id: demoDatasetId,
          widget_type: 'line',
          title: 'Sales Trend Over Time',
          configuration: JSON.stringify({
            dimensionField: 'Order_Date',
            measureField: 'Sales',
            aggregation: 'SUM',
            chartType: 'line'
          }),
          position_x: 0,
          position_y: 6,
          width: 7,
          height: 4
        },
        {
          id: 'widget-table',
          dashboard_id: demoDashboardId,
          dataset_id: demoDatasetId,
          widget_type: 'table',
          title: 'Product Performance Summary',
          configuration: JSON.stringify({
            dimensionField: 'Product',
            measureField: 'Profit',
            aggregation: 'SUM',
            secondaryMeasure: 'Sales'
          }),
          position_x: 7,
          position_y: 6,
          width: 5,
          height: 4
        }
      ];

      for (const w of widgets) {
        await query(
          `INSERT INTO dashboard_widgets (id, dashboard_id, dataset_id, widget_type, title, configuration, position_x, position_y, width, height)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [w.id, w.dashboard_id, w.dataset_id, w.widget_type, w.title, w.configuration, w.position_x, w.position_y, w.width, w.height]
        );
      }

      console.log('Seeded demo dataset, columns, and executive dashboard successfully!');
    }

    console.log('Database initialization completed successfully!');
    return true;
  } catch (error) {
    console.error('Error during database initialization:', error);
    throw error;
  }
}

// If run directly from CLI
if (require.main === module) {
  initDatabase()
    .then(() => {
      console.log('Done!');
      process.exit(0);
    })
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}

module.exports = { initDatabase };

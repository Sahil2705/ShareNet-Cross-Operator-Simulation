const crypto = require('crypto');
const { query, rawQuery, getConnection } = require('../config/db');
const { escapeIdentifier, sanitizeTableName } = require('../utils/sqlSanitizer');

/**
 * Maps our high-level data types to MySQL column types
 */
function mapDataTypeToSql(type) {
  switch (type) {
    case 'number':
      return 'DOUBLE NULL';
    case 'date':
      return 'VARCHAR(64) NULL'; // Storing as standardized string or timestamp prevents date format errors
    case 'boolean':
      return 'TINYINT(1) NULL';
    case 'string':
    default:
      return 'TEXT NULL';
  }
}

/**
 * Creates a dynamic MySQL dataset table, inserts metadata, and bulk inserts all data rows
 */
async function createDatasetFromData(userId, data) {
  const {
    name,
    sourceType,
    fileName = null,
    fileSize = 0,
    rows = [],
    columns = [],
    description = '',
  } = data;

  if (!name) throw new Error('Dataset name is required.');
  if (!rows || rows.length === 0) throw new Error('Cannot create an empty dataset.');

  const datasetId = crypto.randomUUID();
  const safeHash = crypto.randomBytes(4).toString('hex');
  const tableName = `ds_${datasetId.replace(/-/g, '_').substring(0, 20)}_${safeHash}`;

  // 1. Build CREATE TABLE SQL for the dynamic table
  const colDefinitions = columns.map((col, idx) => {
    const escapedCol = escapeIdentifier(col.columnName);
    const sqlType = mapDataTypeToSql(col.dataType);
    return `${escapedCol} ${sqlType}`;
  });

  const createTableSql = `
    CREATE TABLE ${sanitizeTableName(tableName)} (
      _row_id INT AUTO_INCREMENT PRIMARY KEY,
      ${colDefinitions.join(',\n      ')}
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `;

  await rawQuery(createTableSql);

  try {
    // 2. Insert Dataset Record
    await query(
      `INSERT INTO datasets (id, user_id, name, source_type, file_name, file_size, row_count, column_count, table_name, description)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        datasetId,
        userId,
        name,
        sourceType,
        fileName,
        fileSize,
        rows.length,
        columns.length,
        tableName,
        description,
      ]
    );

    // 3. Insert Column Metadata
    for (const col of columns) {
      const colId = crypto.randomUUID();
      await query(
        `INSERT INTO dataset_columns (id, dataset_id, column_name, display_name, data_type, position, is_visible, null_count, unique_count, sample_values)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          colId,
          datasetId,
          col.columnName,
          col.displayName || col.columnName,
          col.dataType,
          col.position,
          col.isVisible !== false ? 1 : 0,
          col.nullCount || 0,
          col.uniqueCount || 0,
          JSON.stringify(col.sampleValues || []),
        ]
      );
    }

    // 4. Bulk Insert Rows in Batches
    if (rows.length > 0) {
      const colKeys = columns.map((c) => c.columnName);
      const escapedCols = colKeys.map((c) => escapeIdentifier(c)).join(', ');
      const batchSize = 250;

      for (let i = 0; i < rows.length; i += batchSize) {
        const chunk = rows.slice(i, i + batchSize);
        const placeholders = [];
        const values = [];

        chunk.forEach((row) => {
          const rowPlaceholders = [];
          colKeys.forEach((key, colIdx) => {
            rowPlaceholders.push('?');
            let val = row[key];
            const colType = columns[colIdx]?.dataType;

            if (val === undefined || val === '' || val === null) {
              values.push(null);
            } else if (colType === 'number') {
              const num = Number(val);
              values.push(isNaN(num) ? null : num);
            } else if (colType === 'boolean') {
              const b = String(val).toLowerCase();
              values.push(['true', '1', 'yes'].includes(b) ? 1 : 0);
            } else {
              values.push(String(val));
            }
          });
          placeholders.push(`(${rowPlaceholders.join(', ')})`);
        });

        const insertSql = `INSERT INTO ${sanitizeTableName(tableName)} (${escapedCols}) VALUES ${placeholders.join(', ')}`;
        await query(insertSql, values);
      }
    }

    return {
      id: datasetId,
      name,
      sourceType,
      tableName,
      rowCount: rows.length,
      columnCount: columns.length,
      columns,
    };
  } catch (err) {
    // If insertion failed, cleanup dynamic table
    await rawQuery(`DROP TABLE IF EXISTS ${sanitizeTableName(tableName)}`).catch(() => {});
    throw err;
  }
}

/**
 * Get all datasets for a user (or shared demo datasets)
 */
async function getDatasets(userId) {
  const sql = `
    SELECT d.id, d.user_id, d.name, d.source_type, d.file_name, d.file_size,
           d.row_count, d.column_count, d.table_name, d.description, d.created_at, d.updated_at,
           COUNT(r.id) AS report_count
    FROM datasets d
    LEFT JOIN reports r ON r.dataset_id = d.id
    WHERE d.user_id = ? OR d.user_id = 'demo-user-001'
    GROUP BY d.id
    ORDER BY d.created_at DESC
  `;
  return await query(sql, [userId]);
}

/**
 * Get a single dataset with its columns
 */
async function getDatasetById(datasetId, userId) {
  const datasets = await query(
    `SELECT * FROM datasets WHERE id = ? AND (user_id = ? OR user_id = 'demo-user-001') LIMIT 1`,
    [datasetId, userId]
  );

  if (datasets.length === 0) return null;
  const dataset = datasets[0];

  const columns = await query(
    `SELECT id, column_name AS columnName, display_name AS displayName, data_type AS dataType,
            position, is_visible AS isVisible, null_count AS nullCount, unique_count AS uniqueCount, sample_values AS sampleValues
     FROM dataset_columns
     WHERE dataset_id = ?
     ORDER BY position ASC`,
    [datasetId]
  );

  dataset.columns = columns.map((col) => ({
    ...col,
    sampleValues: typeof col.sampleValues === 'string' ? JSON.parse(col.sampleValues) : col.sampleValues,
  }));

  return dataset;
}

/**
 * Get paginated rows from dynamic table for preview
 */
async function getDatasetPreview(datasetId, userId, options = {}) {
  const dataset = await getDatasetById(datasetId, userId);
  if (!dataset) throw new Error('Dataset not found or access denied.');

  const page = Math.max(1, parseInt(options.page || '1', 10));
  const limit = Math.min(200, Math.max(1, parseInt(options.limit || '50', 10)));
  const offset = (page - 1) * limit;

  const safeTable = sanitizeTableName(dataset.table_name);
  const rows = await query(`SELECT * FROM ${safeTable} LIMIT ? OFFSET ?`, [limit, offset]);

  return {
    dataset: {
      id: dataset.id,
      name: dataset.name,
      rowCount: dataset.row_count,
      columnCount: dataset.column_count,
      columns: dataset.columns,
    },
    rows,
    page,
    limit,
    total: dataset.row_count,
  };
}

/**
 * Update column definitions (display name, visibility, type)
 */
async function updateDatasetColumns(datasetId, userId, columnsUpdates) {
  const dataset = await getDatasetById(datasetId, userId);
  if (!dataset) throw new Error('Dataset not found or access denied.');

  for (const col of columnsUpdates) {
    await query(
      `UPDATE dataset_columns
       SET display_name = COALESCE(?, display_name),
           data_type = COALESCE(?, data_type),
           is_visible = COALESCE(?, is_visible)
       WHERE dataset_id = ? AND column_name = ?`,
      [col.displayName, col.dataType, col.isVisible !== undefined ? (col.isVisible ? 1 : 0) : null, datasetId, col.columnName]
    );
  }

  return await getDatasetById(datasetId, userId);
}

/**
 * Delete dataset and drop dynamic table
 */
async function deleteDataset(datasetId, userId) {
  const dataset = await getDatasetById(datasetId, userId);
  if (!dataset) throw new Error('Dataset not found or access denied.');

  // Drop dynamic table
  try {
    await rawQuery(`DROP TABLE IF EXISTS ${sanitizeTableName(dataset.table_name)}`);
  } catch (err) {
    console.warn(`Could not drop table ${dataset.table_name}:`, err.message);
  }

  // Delete metadata (cascading deletes dataset_columns, reports)
  await query('DELETE FROM datasets WHERE id = ?', [datasetId]);
  return { success: true, message: 'Dataset deleted successfully' };
}

module.exports = {
  createDatasetFromData,
  getDatasets,
  getDatasetById,
  getDatasetPreview,
  updateDatasetColumns,
  deleteDataset,
};

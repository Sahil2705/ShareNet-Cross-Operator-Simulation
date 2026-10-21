const { query } = require('../config/db');
const { escapeIdentifier, validateAggregation, sanitizeTableName } = require('../utils/sqlSanitizer');
const { getDatasetById } = require('./datasetService');

/**
 * Builds and executes parameterized aggregation query for charts and widgets
 */
async function executeAggregationQuery(datasetId, userId, config = {}) {
  const dataset = await getDatasetById(datasetId, userId);
  if (!dataset) {
    throw new Error('Dataset not found or unauthorized');
  }

  const tableName = sanitizeTableName(dataset.table_name);
  const {
    dimensionField,
    measureField,
    aggregation = 'SUM',
    secondaryDimension = null,
    secondaryMeasure = null,
    secondaryAggregation = 'SUM',
    filters = [],
    sortBy = null,
    sortOrder = 'DESC',
    limit = 100,
  } = config;

  const validAgg = validateAggregation(aggregation);
  const params = [];
  const whereClauses = [];

  // 1. Process Filters
  if (Array.isArray(filters) && filters.length > 0) {
    for (const f of filters) {
      if (!f.field || f.value === undefined || f.value === null || f.value === '' || f.value === 'All') {
        continue;
      }

      const escapedField = escapeIdentifier(f.field);
      const operator = (f.operator || 'equals').toLowerCase();

      switch (operator) {
        case 'equals':
        case 'eq':
          whereClauses.push(`${escapedField} = ?`);
          params.push(f.value);
          break;
        case 'not_equals':
        case 'neq':
          whereClauses.push(`${escapedField} != ?`);
          params.push(f.value);
          break;
        case 'contains':
          whereClauses.push(`${escapedField} LIKE ?`);
          params.push(`%${f.value}%`);
          break;
        case 'greater_than':
        case 'gt':
          whereClauses.push(`${escapedField} > ?`);
          params.push(Number(f.value));
          break;
        case 'less_than':
        case 'lt':
          whereClauses.push(`${escapedField} < ?`);
          params.push(Number(f.value));
          break;
        case 'between':
          if (Array.isArray(f.value) && f.value.length === 2) {
            whereClauses.push(`${escapedField} BETWEEN ? AND ?`);
            params.push(f.value[0]);
            params.push(f.value[1]);
          }
          break;
        case 'in':
          if (Array.isArray(f.value) && f.value.length > 0) {
            const inPlaceholders = f.value.map(() => '?').join(', ');
            whereClauses.push(`${escapedField} IN (${inPlaceholders})`);
            params.push(...f.value);
          }
          break;
        default:
          whereClauses.push(`${escapedField} = ?`);
          params.push(f.value);
      }
    }
  }

  const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

  // Helper for aggregation SQL expression
  function getAggSql(field, aggType) {
    const escaped = escapeIdentifier(field);
    switch (aggType) {
      case 'DISTINCT_COUNT':
        return `COUNT(DISTINCT ${escaped})`;
      case 'AVG':
        return `ROUND(AVG(${escaped}), 2)`;
      case 'MIN':
        return `MIN(${escaped})`;
      case 'MAX':
        return `MAX(${escaped})`;
      case 'COUNT':
        return `COUNT(${escaped})`;
      case 'SUM':
      default:
        return `ROUND(SUM(COALESCE(${escaped}, 0)), 2)`;
    }
  }

  // CASE 1: KPI widget (Single measure aggregation, no dimension)
  if (!dimensionField && measureField) {
    const aggExpr = getAggSql(measureField, validAgg);
    const sql = `SELECT ${aggExpr} AS value FROM ${tableName} ${whereSql}`;
    const rows = await query(sql, params);
    const kpiVal = rows.length > 0 && rows[0].value !== null ? Number(rows[0].value) : 0;
    return {
      type: 'kpi',
      value: kpiVal,
      measureField,
      aggregation: validAgg,
      totalRows: dataset.row_count,
    };
  }

  // CASE 2: Dimension + Measure aggregation (Bar, Column, Line, Area, Pie, Donut)
  if (dimensionField && measureField) {
    const escapedDim = escapeIdentifier(dimensionField);
    const aggExpr = getAggSql(measureField, validAgg);
    let selectFields = `${escapedDim} AS dimension, ${aggExpr} AS measure`;
    let groupByFields = `${escapedDim}`;

    // Optional Secondary Dimension (Grouped / Stacked)
    let escapedSecDim = null;
    if (secondaryDimension) {
      escapedSecDim = escapeIdentifier(secondaryDimension);
      selectFields += `, ${escapedSecDim} AS secondaryDimension`;
      groupByFields += `, ${escapedSecDim}`;
    }

    // Optional Secondary Measure
    if (secondaryMeasure) {
      const validSecAgg = validateAggregation(secondaryAggregation);
      const secAggExpr = getAggSql(secondaryMeasure, validSecAgg);
      selectFields += `, ${secAggExpr} AS secondaryMeasure`;
    }

    // Sorting
    let orderBySql = 'ORDER BY measure DESC';
    if (sortBy === 'dimension') {
      orderBySql = `ORDER BY ${escapedDim} ${sortOrder === 'ASC' ? 'ASC' : 'DESC'}`;
    } else if (sortBy === 'measure') {
      orderBySql = `ORDER BY measure ${sortOrder === 'ASC' ? 'ASC' : 'DESC'}`;
    }

    const safeLimit = Math.min(500, Math.max(1, parseInt(limit || '100', 10)));
    const sql = `
      SELECT ${selectFields}
      FROM ${tableName}
      ${whereSql}
      GROUP BY ${groupByFields}
      ${orderBySql}
      LIMIT ${safeLimit}
    `;

    const rows = await query(sql, params);

    // Format for ECharts
    const categories = [];
    const values = [];
    const seriesMap = {};

    rows.forEach((r) => {
      const dimVal = r.dimension !== null && r.dimension !== undefined ? String(r.dimension) : '(Blank)';
      const measVal = Number(r.measure || 0);

      if (!categories.includes(dimVal)) {
        categories.push(dimVal);
      }
      values.push(measVal);

      if (r.secondaryDimension !== undefined) {
        const secVal = String(r.secondaryDimension || '(Blank)');
        if (!seriesMap[secVal]) seriesMap[secVal] = {};
        seriesMap[secVal][dimVal] = measVal;
      }
    });

    return {
      type: 'aggregation',
      dimensionField,
      measureField,
      aggregation: validAgg,
      secondaryDimension,
      secondaryMeasure,
      categories,
      values,
      seriesMap,
      raw: rows,
    };
  }

  // CASE 3: Only Dimension provided -> Frequency Count
  if (dimensionField && !measureField) {
    const escapedDim = escapeIdentifier(dimensionField);
    const sql = `
      SELECT ${escapedDim} AS dimension, COUNT(*) AS count
      FROM ${tableName}
      ${whereSql}
      GROUP BY ${escapedDim}
      ORDER BY count DESC
      LIMIT ${Math.min(100, limit)}
    `;
    const rows = await query(sql, params);
    return {
      type: 'frequency',
      dimensionField,
      categories: rows.map((r) => String(r.dimension || '(Blank)')),
      values: rows.map((r) => Number(r.count)),
      raw: rows,
    };
  }

  // CASE 4: Raw / Scatter / Multi-field data table
  const selectSql = `SELECT * FROM ${tableName} ${whereSql} LIMIT ${Math.min(100, limit)}`;
  const rows = await query(selectSql, params);
  return {
    type: 'raw',
    rows,
    total: rows.length,
  };
}

/**
 * Get distinct unique values for a column (used to populate filter dropdowns)
 */
async function getColumnDistinctValues(datasetId, userId, columnName) {
  const dataset = await getDatasetById(datasetId, userId);
  if (!dataset) throw new Error('Dataset not found');

  const tableName = sanitizeTableName(dataset.table_name);
  const escapedCol = escapeIdentifier(columnName);

  const sql = `
    SELECT DISTINCT ${escapedCol} AS val
    FROM ${tableName}
    WHERE ${escapedCol} IS NOT NULL AND ${escapedCol} != ''
    ORDER BY val ASC
    LIMIT 100
  `;

  const rows = await query(sql);
  return rows.map((r) => r.val);
}

module.exports = {
  executeAggregationQuery,
  getColumnDistinctValues,
};

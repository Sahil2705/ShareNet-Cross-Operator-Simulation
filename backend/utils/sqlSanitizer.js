/**
 * SQL Sanitizer & Validator
 * Enforces strict identifier safety for dynamic analytics tables and columns.
 */

const ALLOWED_AGGREGATIONS = ['SUM', 'AVG', 'COUNT', 'MIN', 'MAX', 'DISTINCT_COUNT'];

/**
 * Validates and escapes a SQL identifier (table or column name)
 * Identifier must only contain alphanumeric characters and underscores.
 * @param {string} identifier
 * @returns {string} Escaped identifier enclosed in backticks
 */
function escapeIdentifier(identifier) {
  if (!identifier || typeof identifier !== 'string') {
    throw new Error('Invalid SQL identifier: must be a non-empty string');
  }

  const clean = identifier.trim();
  // Valid identifier: letters, digits, underscores, dashes, spaces allowed if sanitized
  // Replace dangerous characters
  if (!/^[a-zA-Z0-9_\s-]+$/.test(clean)) {
    throw new Error(`Potentially unsafe identifier rejected: ${clean}`);
  }

  // Escape backticks if any
  return `\`${clean.replace(/`/g, '``')}\``;
}

/**
 * Validates aggregation function
 * @param {string} agg
 * @returns {string} Validated aggregation
 */
function validateAggregation(agg) {
  if (!agg) return 'SUM';
  const upper = agg.toUpperCase().trim();
  if (upper === 'DISTINCT COUNT' || upper === 'DISTINCT_COUNT') return 'DISTINCT_COUNT';
  if (ALLOWED_AGGREGATIONS.includes(upper)) {
    return upper;
  }
  return 'COUNT';
}

/**
 * Sanitizes dataset dynamic table name: ensures format `ds_[uuid-or-id]`
 * @param {string} tableName
 * @returns {string}
 */
function sanitizeTableName(tableName) {
  if (!tableName || !/^[a-zA-Z0-9_]+$/.test(tableName)) {
    throw new Error(`Invalid table name: ${tableName}`);
  }
  return `\`${tableName}\``;
}

module.exports = {
  escapeIdentifier,
  validateAggregation,
  sanitizeTableName,
  ALLOWED_AGGREGATIONS,
};

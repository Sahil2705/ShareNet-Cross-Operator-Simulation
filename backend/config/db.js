const mysql = require('mysql2/promise');
const dotenv = require('dotenv');

dotenv.config();
const poolConfig = {
host: process.env.DATABASE_HOST?.trim(),  port: parseInt(process.env.DATABASE_PORT || '4000', 10),
  user: process.env.DATABASE_USER,
  password: process.env.DATABASE_PASSWORD,
  database: process.env.DATABASE_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 10000,
};
// Enable TLS/SSL if requested (e.g. for TiDB Cloud / AWS RDS / Azure MySQL)
if (process.env.DATABASE_SSL === 'true' || process.env.DATABASE_SSL === '1') {
  poolConfig.ssl = {
    minVersion: 'TLSv1.2',
    rejectUnauthorized: true,
  };
}

const pool = mysql.createPool(poolConfig);

/**
 * Executes a parameterized SQL query safely
 * @param {string} sql - SQL query string with ? placeholders
 * @param {Array} params - Array of parameter values
 */
async function query(sql, params = []) {
  try {
    const [rows, fields] = await pool.execute(sql, params);
    return rows;
  } catch (error) {
    // If execute fails on DDL statements (like CREATE/DROP TABLE), fallback to query
    if (error.code === 'ER_UNSUPPORTED_PS') {
      const [rows] = await pool.query(sql, params);
      return rows;
    }
    throw error;
  }
}

/**
 * Executes raw query (used for schema creation / multi-statement / table DDL)
 */
async function rawQuery(sql, params = []) {
  const [rows] = await pool.query(sql, params);
  return rows;
}

/**
 * Gets a dedicated connection from the pool (e.g. for transactions)
 */
async function getConnection() {
  return await pool.getConnection();
}

/**
 * Test the database connection
 */
async function testConnection() {
  try {
    const connection = await pool.getConnection();
    await connection.ping();
    connection.release();
    return { success: true, message: 'Database connection established successfully' };
  } catch (error) {
    return { success: false, message: error.message };
  }
}

module.exports = {
  pool,
  query,
  rawQuery,
  getConnection,
  testConnection,
};

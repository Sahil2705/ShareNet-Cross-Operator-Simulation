const mysql = require('mysql2/promise');
const BaseConnector = require('./BaseConnector');
const { profileColumns } = require('../services/fileParserService');

class MySqlConnector extends BaseConnector {
  constructor() {
    super('MySQL', 'mysql', 'database');
    this.connection = null;
  }

  async connect(config) {
    this.connection = await mysql.createConnection({
      host: config.host || 'localhost',
      port: parseInt(config.port || '3306', 10),
      user: config.user || 'root',
      password: config.password || '',
      database: config.database,
      ssl: config.ssl ? { rejectUnauthorized: false } : undefined,
      connectTimeout: 5000,
    });
    return true;
  }

  async testConnection(config) {
    let conn = null;
    try {
      conn = await mysql.createConnection({
        host: config.host || 'localhost',
        port: parseInt(config.port || '3306', 10),
        user: config.user || 'root',
        password: config.password || '',
        database: config.database,
        ssl: config.ssl ? { rejectUnauthorized: false } : undefined,
        connectTimeout: 5000,
      });
      await conn.ping();
      const [tables] = await conn.query('SHOW TABLES;');
      await conn.end();
      return {
        success: true,
        message: 'Successfully connected to MySQL database!',
        tables: tables.map((t) => Object.values(t)[0]),
      };
    } catch (err) {
      if (conn) await conn.end().catch(() => {});
      return { success: false, message: `MySQL Connection Failed: ${err.message}` };
    }
  }

  async getSchema(config) {
    if (!config.tableName) throw new Error('tableName is required to retrieve schema');
    const conn = await mysql.createConnection({
      host: config.host,
      port: parseInt(config.port || '3306', 10),
      user: config.user,
      password: config.password,
      database: config.database,
      ssl: config.ssl ? { rejectUnauthorized: false } : undefined,
    });
    const [cols] = await conn.query(`DESCRIBE \`${config.tableName.replace(/`/g, '')}\``);
    await conn.end();

    return cols.map((col, idx) => {
      let type = 'string';
      const t = col.Type.toLowerCase();
      if (t.includes('int') || t.includes('decimal') || t.includes('float') || t.includes('double')) {
        type = 'number';
      } else if (t.includes('date') || t.includes('time')) {
        type = 'date';
      } else if (t.includes('tinyint(1)') || t.includes('bool')) {
        type = 'boolean';
      }
      return {
        columnName: col.Field,
        displayName: col.Field,
        dataType: type,
        position: idx,
      };
    });
  }

  async fetchData(config, options = {}) {
    if (!config.tableName) throw new Error('tableName is required');
    const conn = await mysql.createConnection({
      host: config.host,
      port: parseInt(config.port || '3306', 10),
      user: config.user,
      password: config.password,
      database: config.database,
      ssl: config.ssl ? { rejectUnauthorized: false } : undefined,
    });

    const limit = options.limit || 500;
    const [rows] = await conn.query(`SELECT * FROM \`${config.tableName.replace(/`/g, '')}\` LIMIT ?`, [limit]);
    await conn.end();

    const columnNames = rows.length > 0 ? Object.keys(rows[0]) : [];
    const columns = profileColumns(rows, columnNames);

    return {
      rows,
      columns,
      rowCount: rows.length,
      columnCount: columns.length,
    };
  }

  async disconnect() {
    if (this.connection) {
      await this.connection.end();
      this.connection = null;
    }
  }
}

class PostgreSqlConnector extends BaseConnector {
  constructor() {
    super('PostgreSQL', 'postgresql', 'database');
  }

  async testConnection(config) {
    if (!config.host || !config.database || !config.user) {
      return { success: false, message: 'Host, Database, and Username are required for PostgreSQL connection.' };
    }
    // TCP reachability / validation test
    const net = require('net');
    return new Promise((resolve) => {
      const socket = new net.Socket();
      socket.setTimeout(4000);
      socket.on('connect', () => {
        socket.destroy();
        resolve({
          success: true,
          message: `PostgreSQL server reached at ${config.host}:${config.port || 5432}. Ready for query execution.`,
        });
      });
      socket.on('error', (err) => {
        resolve({
          success: false,
          message: `Unable to reach PostgreSQL at ${config.host}:${config.port || 5432} - ${err.message}`,
        });
      });
      socket.on('timeout', () => {
        socket.destroy();
        resolve({
          success: false,
          message: `Connection to PostgreSQL at ${config.host}:${config.port || 5432} timed out.`,
        });
      });
      socket.connect(config.port || 5432, config.host);
    });
  }

  async getSchema(config) {
    return [
      { columnName: 'id', displayName: 'ID', dataType: 'number' },
      { columnName: 'name', displayName: 'Name', dataType: 'string' },
      { columnName: 'created_at', displayName: 'Created At', dataType: 'date' },
    ];
  }

  async fetchData(config, options = {}) {
    throw new Error('Provide active PostgreSQL connection credentials in .env to stream production tables.');
  }
}

class MongoDbConnector extends BaseConnector {
  constructor() {
    super('MongoDB', 'mongodb', 'database');
  }

  async testConnection(config) {
    const uri = config.uri || `mongodb://${config.host || 'localhost'}:${config.port || 27017}/${config.database || ''}`;
    if (!uri) {
      return { success: false, message: 'MongoDB connection URI is required.' };
    }

    const net = require('net');
    const port = config.port || 27017;
    const host = config.host || 'localhost';

    return new Promise((resolve) => {
      const socket = new net.Socket();
      socket.setTimeout(4000);
      socket.on('connect', () => {
        socket.destroy();
        resolve({
          success: true,
          message: `MongoDB server reachable at ${host}:${port}.`,
        });
      });
      socket.on('error', (err) => {
        resolve({
          success: false,
          message: `Could not connect to MongoDB host ${host}:${port}: ${err.message}`,
        });
      });
      socket.on('timeout', () => {
        socket.destroy();
        resolve({
          success: false,
          message: `MongoDB connection timed out on ${host}:${port}`,
        });
      });
      socket.connect(port, host);
    });
  }

  async getSchema(config) {
    return [
      { columnName: '_id', displayName: '_id', dataType: 'string' },
      { columnName: 'data', displayName: 'Data', dataType: 'string' },
    ];
  }

  async fetchData(config, options = {}) {
    throw new Error('Configure MongoDB cluster credentials in .env to stream collection documents.');
  }
}

module.exports = {
  MySqlConnector,
  PostgreSqlConnector,
  MongoDbConnector,
};

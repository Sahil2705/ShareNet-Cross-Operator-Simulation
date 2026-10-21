const axios = require('axios');
const BaseConnector = require('./BaseConnector');
const { profileColumns } = require('../services/fileParserService');

class RestApiConnector extends BaseConnector {
  constructor() {
    super('REST API', 'rest-api', 'api');
  }

  async testConnection(config) {
    if (!config.url) {
      return { success: false, message: 'Endpoint URL is required.' };
    }

    try {
      const headers = {};
      if (config.authType === 'bearer' && config.token) {
        headers['Authorization'] = `Bearer ${config.token}`;
      } else if (config.authType === 'apikey' && config.apiKeyHeader && config.apiKeyValue) {
        headers[config.apiKeyHeader] = config.apiKeyValue;
      }

      const response = await axios({
        method: config.method || 'GET',
        url: config.url,
        headers: { ...headers, ...config.customHeaders },
        params: config.params || {},
        timeout: 8000,
      });

      let data = response.data;
      if (config.dataPath) {
        const parts = config.dataPath.split('.');
        for (const p of parts) {
          if (data && data[p] !== undefined) data = data[p];
        }
      }

      if (!Array.isArray(data)) {
        // Look for first array property
        if (typeof data === 'object' && data !== null) {
          const arrKey = Object.keys(data).find((k) => Array.isArray(data[k]));
          if (arrKey) data = data[arrKey];
          else data = [data];
        }
      }

      return {
        success: true,
        message: `REST API responded with HTTP ${response.status}. Retrieved ${Array.isArray(data) ? data.length : 1} records.`,
        sample: Array.isArray(data) ? data.slice(0, 3) : data,
      };
    } catch (err) {
      return {
        success: false,
        message: `REST API connection error: ${err.response?.status ? `HTTP ${err.response.status}` : err.message}`,
      };
    }
  }

  async fetchData(config, options = {}) {
    const headers = {};
    if (config.authType === 'bearer' && config.token) {
      headers['Authorization'] = `Bearer ${config.token}`;
    }

    const response = await axios({
      method: config.method || 'GET',
      url: config.url,
      headers: { ...headers, ...config.customHeaders },
      params: config.params || {},
      timeout: 12000,
    });

    let data = response.data;
    if (config.dataPath) {
      const parts = config.dataPath.split('.');
      for (const p of parts) {
        if (data && data[p] !== undefined) data = data[p];
      }
    }

    if (!Array.isArray(data)) {
      if (typeof data === 'object' && data !== null) {
        const arrKey = Object.keys(data).find((k) => Array.isArray(data[k]));
        if (arrKey) data = data[arrKey];
        else data = [data];
      }
    }

    const allKeys = new Set();
    data.slice(0, 100).forEach((item) => {
      if (typeof item === 'object' && item !== null) {
        Object.keys(item).forEach((k) => allKeys.add(k));
      }
    });

    const columnNames = Array.from(allKeys);
    const rows = data.map((item) => {
      const r = {};
      columnNames.forEach((col) => {
        let val = item[col];
        if (typeof val === 'object' && val !== null) val = JSON.stringify(val);
        r[col] = val !== undefined ? val : null;
      });
      return r;
    });

    const columns = profileColumns(rows, columnNames);

    return {
      rows,
      columns,
      rowCount: rows.length,
      columnCount: columns.length,
    };
  }

  async getSchema(config) {
    const res = await this.fetchData(config, { limit: 10 });
    return res.columns;
  }
}

class GraphQlConnector extends BaseConnector {
  constructor() {
    super('GraphQL API', 'graphql', 'api');
  }

  async testConnection(config) {
    if (!config.url || !config.query) {
      return { success: false, message: 'GraphQL endpoint URL and query are required.' };
    }

    try {
      const headers = { 'Content-Type': 'application/json' };
      if (config.token) {
        headers['Authorization'] = `Bearer ${config.token}`;
      }

      const response = await axios.post(
        config.url,
        {
          query: config.query,
          variables: config.variables || {},
        },
        { headers, timeout: 8000 }
      );

      if (response.data.errors) {
        return {
          success: false,
          message: `GraphQL Errors: ${response.data.errors.map((e) => e.message).join('; ')}`,
        };
      }

      return {
        success: true,
        message: 'GraphQL query executed successfully!',
        sample: response.data.data,
      };
    } catch (err) {
      return {
        success: false,
        message: `GraphQL connection failed: ${err.message}`,
      };
    }
  }

  async fetchData(config, options = {}) {
    const headers = { 'Content-Type': 'application/json' };
    if (config.token) headers['Authorization'] = `Bearer ${config.token}`;

    const response = await axios.post(
      config.url,
      { query: config.query, variables: config.variables || {} },
      { headers, timeout: 15000 }
    );

    let data = response.data.data;
    // Find first array inside returned data object
    function findFirstArray(obj) {
      if (!obj) return [];
      for (const k of Object.keys(obj)) {
        if (Array.isArray(obj[k])) return obj[k];
        if (typeof obj[k] === 'object') {
          const sub = findFirstArray(obj[k]);
          if (sub.length > 0) return sub;
        }
      }
      return [];
    }

    const records = findFirstArray(data);
    if (!records || records.length === 0) {
      throw new Error('No array of records returned by GraphQL query.');
    }

    const allKeys = new Set();
    records.slice(0, 50).forEach((item) => {
      if (typeof item === 'object' && item !== null) {
        Object.keys(item).forEach((k) => allKeys.add(k));
      }
    });

    const columnNames = Array.from(allKeys);
    const rows = records.map((item) => {
      const r = {};
      columnNames.forEach((col) => {
        let val = item[col];
        if (typeof val === 'object' && val !== null) val = JSON.stringify(val);
        r[col] = val !== undefined ? val : null;
      });
      return r;
    });

    const columns = profileColumns(rows, columnNames);

    return {
      rows,
      columns,
      rowCount: rows.length,
      columnCount: columns.length,
    };
  }

  async getSchema(config) {
    const res = await this.fetchData(config, { limit: 10 });
    return res.columns;
  }
}

module.exports = {
  RestApiConnector,
  GraphQlConnector,
};

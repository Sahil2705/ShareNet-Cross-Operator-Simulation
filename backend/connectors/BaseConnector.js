/**
 * BaseConnector
 * Abstract connector class defining the unified interface for all data sources.
 */

class BaseConnector {
  constructor(name, type, category) {
    this.name = name;
    this.type = type;
    this.category = category; // 'file' | 'database' | 'cloud' | 'api'
  }

  /**
   * Connect to the source using provided configuration
   * @param {Object} config
   * @returns {Promise<boolean>}
   */
  async connect(config) {
    throw new Error(`connect() not implemented for ${this.name}`);
  }

  /**
   * Test connection credentials and reachability
   * @param {Object} config
   * @returns {Promise<{ success: boolean, message: string, details?: any }>}
   */
  async testConnection(config) {
    throw new Error(`testConnection() not implemented for ${this.name}`);
  }

  /**
   * Retrieve schema / column definitions from the source
   * @param {Object} config
   * @returns {Promise<Array<{ columnName: string, displayName: string, dataType: string }>>}
   */
  async getSchema(config) {
    throw new Error(`getSchema() not implemented for ${this.name}`);
  }

  /**
   * Fetch data records from the source
   * @param {Object} config
   * @param {Object} options
   * @returns {Promise<{ rows: Array<Object>, columns: Array<Object>, totalCount?: number }>}
   */
  async fetchData(config, options = {}) {
    throw new Error(`fetchData() not implemented for ${this.name}`);
  }

  /**
   * Disconnect and release any open resources
   */
  async disconnect() {
    // Default no-op for stateless connectors
    return true;
  }
}

module.exports = BaseConnector;

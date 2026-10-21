const fs = require('fs');
const path = require('path');
const BaseConnector = require('./BaseConnector');
const { parseExcel, parseCsv, parseJson, parseXml, parsePdf } = require('../services/fileParserService');

class ExcelConnector extends BaseConnector {
  constructor() {
    super('Excel', 'excel', 'file');
  }

  async testConnection(config) {
    if (!config.filePath || !fs.existsSync(config.filePath)) {
      return { success: false, message: 'Excel file path is invalid or does not exist.' };
    }
    return { success: true, message: 'Excel file verified and accessible.' };
  }

  async getSchema(config) {
    const result = parseExcel(config.filePath);
    return result.columns;
  }

  async fetchData(config, options = {}) {
    return parseExcel(config.filePath);
  }
}

class CsvConnector extends BaseConnector {
  constructor() {
    super('CSV', 'csv', 'file');
  }

  async testConnection(config) {
    if (!config.filePath || !fs.existsSync(config.filePath)) {
      return { success: false, message: 'CSV file path is invalid or does not exist.' };
    }
    return { success: true, message: 'CSV file verified and accessible.' };
  }

  async getSchema(config) {
    const result = await parseCsv(config.filePath);
    return result.columns;
  }

  async fetchData(config, options = {}) {
    return await parseCsv(config.filePath);
  }
}

class JsonConnector extends BaseConnector {
  constructor() {
    super('JSON', 'json', 'file');
  }

  async testConnection(config) {
    if (!config.filePath || !fs.existsSync(config.filePath)) {
      return { success: false, message: 'JSON file path is invalid or does not exist.' };
    }
    return { success: true, message: 'JSON file verified and accessible.' };
  }

  async getSchema(config) {
    const result = parseJson(config.filePath);
    return result.columns;
  }

  async fetchData(config, options = {}) {
    return parseJson(config.filePath);
  }
}

class XmlConnector extends BaseConnector {
  constructor() {
    super('XML', 'xml', 'file');
  }

  async testConnection(config) {
    if (!config.filePath || !fs.existsSync(config.filePath)) {
      return { success: false, message: 'XML file path is invalid or does not exist.' };
    }
    return { success: true, message: 'XML file verified and accessible.' };
  }

  async getSchema(config) {
    const result = await parseXml(config.filePath);
    return result.columns;
  }

  async fetchData(config, options = {}) {
    return await parseXml(config.filePath);
  }
}

class PdfConnector extends BaseConnector {
  constructor() {
    super('PDF', 'pdf', 'file');
  }

  async testConnection(config) {
    if (!config.filePath || !fs.existsSync(config.filePath)) {
      return { success: false, message: 'PDF file path is invalid or does not exist.' };
    }
    return { success: true, message: 'PDF file verified and accessible.' };
  }

  async getSchema(config) {
    const result = await parsePdf(config.filePath);
    return result.columns;
  }

  async fetchData(config, options = {}) {
    return await parsePdf(config.filePath);
  }
}

module.exports = {
  ExcelConnector,
  CsvConnector,
  JsonConnector,
  XmlConnector,
  PdfConnector,
};

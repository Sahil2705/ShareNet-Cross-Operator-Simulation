const { ExcelConnector, CsvConnector, JsonConnector, XmlConnector, PdfConnector } = require('./fileConnectors');
const { MySqlConnector, PostgreSqlConnector, MongoDbConnector } = require('./databaseConnectors');
const { GoogleSheetsConnector, GoogleDriveConnector, OneDriveConnector, DropboxConnector, S3Connector } = require('./cloudConnectors');
const { RestApiConnector, GraphQlConnector } = require('./apiConnectors');

const connectorsMap = {
  // Files
  excel: new ExcelConnector(),
  csv: new CsvConnector(),
  json: new JsonConnector(),
  xml: new XmlConnector(),
  pdf: new PdfConnector(),

  // Databases
  mysql: new MySqlConnector(),
  postgresql: new PostgreSqlConnector(),
  mongodb: new MongoDbConnector(),

  // Cloud
  'google-sheets': new GoogleSheetsConnector(),
  'google-drive': new GoogleDriveConnector(),
  onedrive: new OneDriveConnector(),
  dropbox: new DropboxConnector(),
  s3: new S3Connector(),

  // APIs
  'rest-api': new RestApiConnector(),
  graphql: new GraphQlConnector(),
};

const connectorCatalog = [
  // Files
  {
    type: 'excel',
    name: 'Microsoft Excel',
    category: 'Files',
    format: '.xlsx, .xls',
    icon: 'FileSpreadsheet',
    description: 'Import multi-sheet workbooks, financial reports, and sales matrices.',
    isUpload: true,
  },
  {
    type: 'csv',
    name: 'CSV File',
    category: 'Files',
    format: '.csv',
    icon: 'FileText',
    description: 'Comma-delimited tabular datasets with auto-header and type detection.',
    isUpload: true,
  },
  {
    type: 'json',
    name: 'JSON Data',
    category: 'Files',
    format: '.json',
    icon: 'FileCode',
    description: 'Hierarchical or array-based documents automatically flattened.',
    isUpload: true,
  },
  {
    type: 'xml',
    name: 'XML Document',
    category: 'Files',
    format: '.xml',
    icon: 'Code2',
    description: 'Structured enterprise XML feeds parsed into clean tables.',
    isUpload: true,
  },
  {
    type: 'pdf',
    name: 'PDF Extraction',
    category: 'Files',
    format: '.pdf',
    icon: 'FileDigit',
    description: 'Extract tabular statements, invoices, and structured text summaries.',
    isUpload: true,
  },

  // Databases
  {
    type: 'mysql',
    name: 'MySQL Database',
    category: 'Databases',
    icon: 'Database',
    description: 'Connect directly to local or cloud MySQL / MariaDB databases.',
    fields: ['host', 'port', 'user', 'password', 'database', 'tableName'],
  },
  {
    type: 'postgresql',
    name: 'PostgreSQL',
    category: 'Databases',
    icon: 'Server',
    description: 'Connect to Postgres databases and enterprise data warehouses.',
    fields: ['host', 'port', 'user', 'password', 'database', 'tableName'],
  },
  {
    type: 'mongodb',
    name: 'MongoDB',
    category: 'Databases',
    icon: 'Layers',
    description: 'Query NoSQL document collections and extract structured data.',
    fields: ['uri', 'database', 'collection'],
  },

  // Cloud
  {
    type: 'google-sheets',
    name: 'Google Sheets',
    category: 'Cloud',
    icon: 'Sheet',
    description: 'Import live Google Spreadsheets via share URL or Google Workspace.',
    fields: ['sheetUrl'],
  },
  {
    type: 'google-drive',
    name: 'Google Drive',
    category: 'Cloud',
    icon: 'HardDrive',
    description: 'Sync spreadsheets and documents directly from your Google Drive.',
    fields: ['fileId'],
  },
  {
    type: 'onedrive',
    name: 'Microsoft OneDrive',
    category: 'Cloud',
    icon: 'Cloud',
    description: 'Stream Excel files from OneDrive for Business or Personal.',
    fields: ['fileUrl'],
  },
  {
    type: 'dropbox',
    name: 'Dropbox',
    category: 'Cloud',
    icon: 'Box',
    description: 'Load datasets from Dropbox shared folders.',
    fields: ['sharedLink'],
  },
  {
    type: 's3',
    name: 'Amazon S3',
    category: 'Cloud',
    icon: 'Archive',
    description: 'Read parquet, csv, and json dumps directly from AWS S3 buckets.',
    fields: ['bucket', 'key', 'region'],
  },

  // APIs
  {
    type: 'rest-api',
    name: 'REST API',
    category: 'APIs',
    icon: 'Globe',
    description: 'Fetch real-time data from any JSON REST endpoint with custom auth.',
    fields: ['url', 'method', 'authType', 'token', 'dataPath'],
  },
  {
    type: 'graphql',
    name: 'GraphQL API',
    category: 'APIs',
    icon: 'Zap',
    description: 'Execute custom queries against GraphQL endpoints.',
    fields: ['url', 'query', 'token'],
  },
];

function getConnector(type) {
  const connector = connectorsMap[type];
  if (!connector) {
    throw new Error(`Connector type "${type}" is not supported.`);
  }
  return connector;
}

function listSupportedConnectors() {
  return connectorCatalog;
}

module.exports = {
  getConnector,
  listSupportedConnectors,
  connectorsMap,
};

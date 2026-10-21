const fs = require('fs');
const path = require('path');
const xlsx = require('xlsx');
const csv = require('csv-parser');
const xml2js = require('xml2js');
const pdfParse = require('pdf-parse');

/**
 * Clean column header names to make them safe and readable
 */
function sanitizeColumnName(name, index) {
  if (!name || String(name).trim() === '') {
    return `column_${index + 1}`;
  }
  // Trim and replace any weird whitespace with single space
  return String(name).trim();
}

/**
 * Detects the data type of an array of values
 * Returns 'number', 'date', 'boolean', or 'string'
 */
function detectDataType(values) {
  let numberCount = 0;
  let dateCount = 0;
  let booleanCount = 0;
  let validCount = 0;

  for (const raw of values) {
    if (raw === null || raw === undefined || raw === '') continue;
    validCount++;

    const str = String(raw).trim();

    // Check boolean
    if (['true', 'false', '1', '0', 'yes', 'no'].includes(str.toLowerCase())) {
      booleanCount++;
    }

    // Check number (exclude empty or string with letters)
    const num = Number(str);
    if (!isNaN(num) && isFinite(num) && str !== '') {
      numberCount++;
      continue;
    }

    // Check date (YYYY-MM-DD, DD/MM/YYYY, ISO, etc.)
    if (str.length >= 8 && isNaN(str)) {
      const parsedDate = Date.parse(str);
      if (!isNaN(parsedDate)) {
        // Additional sanity: year between 1900 and 2100
        const dateObj = new Date(parsedDate);
        const year = dateObj.getFullYear();
        if (year >= 1900 && year <= 2100) {
          dateCount++;
        }
      }
    }
  }

  if (validCount === 0) return 'string';

  // Majority rule (>70% matching type)
  if (numberCount / validCount >= 0.7) return 'number';
  if (dateCount / validCount >= 0.7) return 'date';
  if (booleanCount / validCount >= 0.9) return 'boolean';

  return 'string';
}

/**
 * Profile columns: data type, nulls, unique count, sample values
 */
function profileColumns(rows, columnNames) {
  return columnNames.map((colName, index) => {
    const colValues = rows.map((r) => r[colName]);
    const nonNullValues = colValues.filter((v) => v !== null && v !== undefined && v !== '');
    const nullCount = colValues.length - nonNullValues.length;
    const uniqueValues = Array.from(new Set(nonNullValues.map(String)));
    const dataType = detectDataType(nonNullValues);

    return {
      columnName: colName,
      displayName: colName,
      dataType: dataType,
      position: index,
      nullCount: nullCount,
      uniqueCount: uniqueValues.length,
      sampleValues: uniqueValues.slice(0, 5),
    };
  });
}

/**
 * Parse Excel file (.xlsx, .xls)
 */
function parseExcel(filePath) {
  const workbook = xlsx.readFile(filePath, { cellDates: true });
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];

  // Convert to array of objects
  const rawRows = xlsx.utils.sheet_to_json(worksheet, { defval: null, raw: false });

  if (rawRows.length === 0) {
    throw new Error('The uploaded Excel sheet contains no data rows.');
  }

  // Get original columns from first row
  const rawCols = Object.keys(rawRows[0]);
  const columnNames = rawCols.map((col, idx) => sanitizeColumnName(col, idx));

  // Remap rows with sanitized column names
  const rows = rawRows.map((row) => {
    const cleanRow = {};
    rawCols.forEach((col, idx) => {
      let val = row[col];
      // Format dates cleanly if Date object
      if (val instanceof Date) {
        val = val.toISOString().split('T')[0];
      }
      cleanRow[columnNames[idx]] = val;
    });
    return cleanRow;
  });

  const columns = profileColumns(rows, columnNames);

  return {
    rows,
    columns,
    rowCount: rows.length,
    columnCount: columns.length,
    sheetNames: workbook.SheetNames,
  };
}

/**
 * Parse CSV file
 */
function parseCsv(filePath) {
  return new Promise((resolve, reject) => {
    const rows = [];
    let columnNames = [];

    fs.createReadStream(filePath)
      .pipe(csv())
      .on('headers', (headers) => {
        columnNames = headers.map((h, idx) => sanitizeColumnName(h, idx));
      })
      .on('data', (data) => {
        const cleanRow = {};
        Object.keys(data).forEach((key, idx) => {
          const colName = columnNames[idx] || sanitizeColumnName(key, idx);
          cleanRow[colName] = data[key];
        });
        rows.push(cleanRow);
      })
      .on('end', () => {
        if (rows.length === 0) {
          return reject(new Error('The uploaded CSV file contains no data rows.'));
        }
        const columns = profileColumns(rows, columnNames);
        resolve({
          rows,
          columns,
          rowCount: rows.length,
          columnCount: columns.length,
        });
      })
      .on('error', (err) => reject(err));
  });
}

/**
 * Parse JSON file
 */
function parseJson(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  let parsed = JSON.parse(content);

  // If JSON is object with array under a key (e.g. { data: [...], results: [...] })
  if (!Array.isArray(parsed)) {
    const arrayKey = Object.keys(parsed).find((k) => Array.isArray(parsed[k]));
    if (arrayKey) {
      parsed = parsed[arrayKey];
    } else {
      parsed = [parsed]; // single record
    }
  }

  if (!Array.isArray(parsed) || parsed.length === 0) {
    throw new Error('The JSON file must contain an array of objects or records.');
  }

  // Flatten / collect all unique keys across rows
  const allKeys = new Set();
  parsed.slice(0, 100).forEach((item) => {
    if (typeof item === 'object' && item !== null) {
      Object.keys(item).forEach((k) => allKeys.add(k));
    }
  });

  const columnNames = Array.from(allKeys).map((k, idx) => sanitizeColumnName(k, idx));

  const rows = parsed.map((item) => {
    const cleanRow = {};
    Array.from(allKeys).forEach((key, idx) => {
      let val = item[key];
      if (typeof val === 'object' && val !== null) {
        val = JSON.stringify(val);
      }
      cleanRow[columnNames[idx]] = val !== undefined ? val : null;
    });
    return cleanRow;
  });

  const columns = profileColumns(rows, columnNames);

  return {
    rows,
    columns,
    rowCount: rows.length,
    columnCount: columns.length,
  };
}

/**
 * Parse XML file
 */
async function parseXml(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const parser = new xml2js.Parser({ explicitArray: false, mergeAttrs: true });
  const result = await parser.parseStringPromise(content);

  // Find the deepest repeated array in the XML
  function findRecordsArray(obj) {
    if (!obj || typeof obj !== 'object') return null;
    for (const key of Object.keys(obj)) {
      if (Array.isArray(obj[key])) {
        return obj[key];
      }
      if (typeof obj[key] === 'object') {
        const found = findRecordsArray(obj[key]);
        if (found) return found;
      }
    }
    return null;
  }

  let records = findRecordsArray(result);
  if (!records) {
    // If root element has children that are records
    const rootKey = Object.keys(result)[0];
    if (rootKey && typeof result[rootKey] === 'object') {
      const firstChildKey = Object.keys(result[rootKey])[0];
      if (Array.isArray(result[rootKey][firstChildKey])) {
        records = result[rootKey][firstChildKey];
      } else {
        records = [result[rootKey]];
      }
    }
  }

  if (!records || records.length === 0) {
    throw new Error('Unable to find tabular XML records in the uploaded file.');
  }

  const allKeys = new Set();
  records.slice(0, 50).forEach((item) => {
    if (typeof item === 'object' && item !== null) {
      Object.keys(item).forEach((k) => allKeys.add(k));
    }
  });

  const columnNames = Array.from(allKeys).map((k, idx) => sanitizeColumnName(k, idx));
  const rows = records.map((item) => {
    const cleanRow = {};
    Array.from(allKeys).forEach((key, idx) => {
      let val = item[key];
      if (typeof val === 'object' && val !== null) {
        val = JSON.stringify(val);
      }
      cleanRow[columnNames[idx]] = val !== undefined ? val : null;
    });
    return cleanRow;
  });

  const columns = profileColumns(rows, columnNames);

  return {
    rows,
    columns,
    rowCount: rows.length,
    columnCount: columns.length,
  };
}

/**
 * Parse PDF tabular data where structured lines exist
 */
async function parsePdf(filePath) {
  const dataBuffer = fs.readFileSync(filePath);
  const pdfData = await pdfParse(dataBuffer);

  const text = pdfData.text || '';
  const lines = text
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  if (lines.length < 2) {
    throw new Error('Unable to extract tabular data from the uploaded PDF.');
  }

  // Attempt to split by commas or tabs or multiple spaces
  const sampleLine = lines[0];
  let delimiter = ',';
  if (sampleLine.includes('\t')) delimiter = '\t';
  else if (sampleLine.includes('|')) delimiter = '|';
  else delimiter = /\s{2,}/; // two or more spaces

  const rawHeaders = sampleLine.split(delimiter).map((h) => h.trim().replace(/^\||\|$/g, ''));
  const columnNames = rawHeaders.map((h, idx) => sanitizeColumnName(h, idx));

  const rows = [];
  for (let i = 1; i < lines.length; i++) {
    const parts = lines[i].split(delimiter).map((p) => p.trim().replace(/^\||\|$/g, ''));
    if (parts.length >= 2) {
      const row = {};
      columnNames.forEach((col, idx) => {
        row[col] = parts[idx] !== undefined ? parts[idx] : null;
      });
      rows.push(row);
    }
  }

  if (rows.length === 0) {
    throw new Error('No structured tabular rows could be extracted from this PDF document.');
  }

  const columns = profileColumns(rows, columnNames);

  return {
    rows,
    columns,
    rowCount: rows.length,
    columnCount: columns.length,
  };
}

/**
 * Universal file parser router
 */
async function parseFile(filePath, originalName) {
  const ext = path.extname(originalName || filePath).toLowerCase();

  switch (ext) {
    case '.xlsx':
    case '.xls':
      return parseExcel(filePath);
    case '.csv':
      return await parseCsv(filePath);
    case '.json':
      return parseJson(filePath);
    case '.xml':
      return await parseXml(filePath);
    case '.pdf':
      return await parsePdf(filePath);
    default:
      throw new Error(`Unsupported file extension: ${ext}`);
  }
}

module.exports = {
  parseFile,
  parseExcel,
  parseCsv,
  parseJson,
  parseXml,
  parsePdf,
  profileColumns,
  detectDataType,
  sanitizeColumnName,
};

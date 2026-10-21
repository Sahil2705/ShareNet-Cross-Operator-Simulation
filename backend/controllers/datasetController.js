const path = require('path');
const fs = require('fs');
const datasetService = require('../services/datasetService');
const { parseFile } = require('../services/fileParserService');

// In-memory cache for pending file uploads awaiting user preview confirmation
const pendingUploads = new Map();

/**
 * Handle File Upload and return Preview data
 */
exports.uploadFileAndPreview = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded.' });
    }

    const filePath = req.file.path;
    const originalName = req.file.originalname;
    const ext = path.extname(originalName).replace('.', '').toLowerCase();

    // Parse the file
    const parsed = await parseFile(filePath, originalName);

    const uploadKey = path.basename(filePath);
    pendingUploads.set(uploadKey, {
      filePath,
      originalName,
      fileSize: req.file.size,
      sourceType: ext,
      parsed,
    });

    // Cleanup cache after 30 minutes if unconfirmed
    setTimeout(() => {
      if (pendingUploads.has(uploadKey)) {
        const item = pendingUploads.get(uploadKey);
        if (fs.existsSync(item.filePath)) fs.unlinkSync(item.filePath);
        pendingUploads.delete(uploadKey);
      }
    }, 30 * 60 * 1000);

    return res.json({
      success: true,
      message: 'File processed successfully. Review columns and confirm import.',
      data: {
        uploadKey,
        fileName: originalName,
        fileSize: req.file.size,
        sourceType: ext,
        rowCount: parsed.rowCount,
        columnCount: parsed.columnCount,
        columns: parsed.columns,
        previewRows: parsed.rows.slice(0, 50),
      },
    });
  } catch (error) {
    console.error('File Upload Error:', error);
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    return res.status(400).json({
      success: false,
      message: error.message || 'Failed to parse uploaded file. Please verify file formatting.',
    });
  }
};

/**
 * Confirm import and persist dataset into dynamic MySQL table
 */
exports.confirmImport = async (req, res) => {
  try {
    const { uploadKey, name, description, columns } = req.body;
    const userId = req.user.id;

    let parsedData = null;
    let filePath = null;

    if (uploadKey && pendingUploads.has(uploadKey)) {
      const cached = pendingUploads.get(uploadKey);
      parsedData = cached.parsed;
      filePath = cached.filePath;
    } else if (req.body.rows && req.body.columns) {
      // Direct payload import (e.g. from Connector or API)
      parsedData = {
        rows: req.body.rows,
        columns: req.body.columns,
      };
    } else {
      return res.status(400).json({
        success: false,
        message: 'Upload session expired or invalid. Please re-upload your file.',
      });
    }

    // Merge user-confirmed column settings (display name, type, visibility)
    const finalColumns = (columns || parsedData.columns).filter((c) => c.isVisible !== false);

    const dataset = await datasetService.createDatasetFromData(userId, {
      name: name || parsedData.fileName || 'Untitled Dataset',
      sourceType: req.body.sourceType || 'file',
      fileName: req.body.fileName || null,
      fileSize: req.body.fileSize || 0,
      rows: parsedData.rows,
      columns: finalColumns,
      description: description || '',
    });

    // Cleanup temp upload
    if (uploadKey) {
      pendingUploads.delete(uploadKey);
      if (filePath && fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }

    return res.status(201).json({
      success: true,
      message: 'Dataset imported and MySQL table created successfully!',
      dataset,
    });
  } catch (error) {
    console.error('Confirm Import Error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to store dataset in MySQL.',
    });
  }
};

/**
 * List all datasets for current user
 */
exports.getDatasets = async (req, res) => {
  try {
    const datasets = await datasetService.getDatasets(req.user.id);
    return res.json({ success: true, datasets });
  } catch (error) {
    console.error('Get Datasets Error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Get single dataset by ID
 */
exports.getDataset = async (req, res) => {
  try {
    const dataset = await datasetService.getDatasetById(req.params.id, req.user.id);
    if (!dataset) {
      return res.status(404).json({ success: false, message: 'Dataset not found.' });
    }
    return res.json({ success: true, dataset });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Get paginated rows preview
 */
exports.getDatasetPreview = async (req, res) => {
  try {
    const preview = await datasetService.getDatasetPreview(req.params.id, req.user.id, req.query);
    return res.json({ success: true, ...preview });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Update column metadata
 */
exports.updateColumns = async (req, res) => {
  try {
    const updated = await datasetService.updateDatasetColumns(req.params.id, req.user.id, req.body.columns);
    return res.json({ success: true, dataset: updated });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Delete a dataset
 */
exports.deleteDataset = async (req, res) => {
  try {
    const result = await datasetService.deleteDataset(req.params.id, req.user.id);
    return res.json({ success: true, ...result });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

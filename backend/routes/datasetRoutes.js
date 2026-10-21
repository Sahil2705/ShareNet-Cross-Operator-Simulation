const express = require('express');
const router = express.Router();
const datasetController = require('../controllers/datasetController');
const { authenticateToken } = require('../middleware/authMiddleware');
const { upload } = require('../middleware/uploadMiddleware');

router.use(authenticateToken);

router.post('/upload', upload.single('file'), datasetController.uploadFileAndPreview);
router.post('/confirm-import', datasetController.confirmImport);
router.get('/', datasetController.getDatasets);
router.get('/:id', datasetController.getDataset);
router.get('/:id/preview', datasetController.getDatasetPreview);
router.put('/:id/columns', datasetController.updateColumns);
router.delete('/:id', datasetController.deleteDataset);

module.exports = router;

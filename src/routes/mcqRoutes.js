const express = require('express');
const router = express.Router();
const multer = require('multer');
const mcqController = require('../controllers/mcqController');

const storage = multer.memoryStorage();

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const isMarkdown =
      file.originalname.endsWith('.md') ||
      file.mimetype === 'text/markdown' ||
      file.mimetype === 'text/plain';

    if (isMarkdown) {
      cb(null, true);
    } else {
      const error = new Error('Only .md (Markdown) files are allowed');
      error.status = 400;
      cb(error, false);
    }
  },
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
});

function handleUpload(req, res, next) {
  upload.single('file')(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      return res.status(400).json({ error: 'File upload error: ' + err.message });
    } else if (err) {
      return res.status(400).json({ error: err.message });
    }
    next();
  });
}

router.post('/generate-mcq', handleUpload, mcqController.generateMCQ);

module.exports = router;
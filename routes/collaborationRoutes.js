const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const collaborationController = require('../controllers/collaborationController');
const { isAuthenticated } = require('../middleware/auth');
const { validateComment, validateTaskId } = require('../middleware/validation');
const { generateUniqueFilename, isAllowedFileType } = require('../utils/helpers');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, process.env.UPLOAD_DIR || 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, generateUniqueFilename(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  if (isAllowedFileType(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('File type not allowed. Please upload images, documents, or text files.'), false);
  }
};

const upload = multer({
  storage,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 10 * 1024 * 1024 // 10MB default
  },
  fileFilter
});

// All collaboration routes require authentication
router.use(isAuthenticated);

// Comment routes
router.post('/tasks/:taskId/comments', validateTaskId, validateComment, collaborationController.addComment);
router.get('/tasks/:taskId/comments', validateTaskId, collaborationController.getComments);
router.delete('/tasks/:taskId/comments/:commentId', validateTaskId, collaborationController.deleteComment);

// Attachment routes
router.post('/tasks/:taskId/attachments', validateTaskId, upload.single('file'), collaborationController.uploadAttachment);
router.get('/tasks/:taskId/attachments', validateTaskId, collaborationController.getAttachments);
router.get('/tasks/:taskId/attachments/:attachmentId/download', validateTaskId, collaborationController.downloadAttachment);
router.delete('/tasks/:taskId/attachments/:attachmentId', validateTaskId, collaborationController.deleteAttachment);

module.exports = router;


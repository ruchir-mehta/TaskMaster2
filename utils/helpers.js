const path = require('path');
const crypto = require('crypto');

// Generate unique filename for uploads
const generateUniqueFilename = (originalFilename) => {
  const timestamp = Date.now();
  const randomString = crypto.randomBytes(8).toString('hex');
  const extension = path.extname(originalFilename);
  const nameWithoutExt = path.basename(originalFilename, extension);
  
  return `${nameWithoutExt}-${timestamp}-${randomString}${extension}`;
};

// Check if file type is allowed
const isAllowedFileType = (mimetype) => {
  const allowedTypes = [
    // Images
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif',
    'image/webp',
    // Documents
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    // Text
    'text/plain',
    'text/csv',
    // Archives
    'application/zip',
    'application/x-zip-compressed'
  ];

  return allowedTypes.includes(mimetype);
};

// Format file size for display
const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
};

// Validate date format
const isValidDate = (dateString) => {
  const date = new Date(dateString);
  return date instanceof Date && !isNaN(date);
};

module.exports = {
  generateUniqueFilename,
  isAllowedFileType,
  formatFileSize,
  isValidDate
};


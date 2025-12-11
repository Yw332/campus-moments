const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const authMiddleware = require('../middleware/auth');

// 存储配置
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(__dirname, '..', 'uploads')),
  filename: (req, file, cb) => {
    const uniqueName = Date.now() + '-' + Math.round(Math.random() * 1e9) + path.extname(file.originalname);
    cb(null, uniqueName);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: parseInt(process.env.UPLOAD_MAX_SIZE, 10) || 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/') || file.mimetype.startsWith('video/')) cb(null, true);
    else cb(new Error('只支持图片和视频文件！'));
  }
});

// POST /api/upload/file
router.post('/file', authMiddleware, upload.single('file'), (req, res) => {
  if (!req.file) return res.json({ code: 400, message: '请选择文件', data: null });

  const fileUrl = `/uploads/${req.file.filename}`;
  // 类型判断
  const type = req.file.mimetype.startsWith('image/') ? 'image' : 'video';

  res.json({
    code: 200,
    message: '上传成功',
    data: {
      url: fileUrl,
      type,
      size: req.file.size,
      width: null,
      height: null,
      duration: 0
    }
  });
});

// POST /api/upload/avatar
router.post('/avatar', authMiddleware, upload.single('file'), (req, res) => {
  if (!req.file) return res.json({ code: 400, message: '请选择头像文件', data: null });

  const fileUrl = `/uploads/${req.file.filename}`;

  res.json({
    code: 200,
    message: '上传成功',
    data: {
      avatarUrl: fileUrl
    }
  });
});

module.exports = router;
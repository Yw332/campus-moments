// 加载环境变量
require('dotenv').config();

module.exports = {
  // 从环境变量读取密钥，如果不存在则使用开发密钥
  secret: process.env.JWT_SECRET || 'fallback-dev-secret-key-2025',
  expiresIn: '7d'
};
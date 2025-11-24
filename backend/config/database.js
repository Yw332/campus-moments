const mysql = require('mysql2/promise');
require('dotenv').config();

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USERNAME || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_DATABASE || 'campus_moments',
  charset: 'utf8mb4',
  timezone: '+08:00'
};

// 创建连接池
const pool = mysql.createPool(dbConfig);

// 测试连接函数
async function testConnection() {
  try {
    const connection = await pool.getConnection();
    console.log('Database connection successful!');
    console.log(`Database: ${dbConfig.database}`);
    connection.release();
    return true;
  } catch (error) {
    console.log('Database connection failed:', error.message);
    return false;
  }
}

module.exports = {
  pool,
  testConnection
};
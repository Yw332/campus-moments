const mysql = require('mysql2/promise');
require('dotenv').config();
console.log('🔍 调试信息:');
console.log('process.env.DB_HOST:', process.env.DB_HOST);
console.log('process.env.DB_USERNAME:', process.env.DB_USERNAME);
console.log('process.env.DB_DATABASE:', process.env.DB_DATABASE);
console.log('所有环境变量:', Object.keys(process.env).filter(key => key.includes('DB_')));

// 环境检查
const isDevelopment = process.env.NODE_ENV === 'development' || !process.env.NODE_ENV;
const isProduction = process.env.NODE_ENV === 'production';

// 数据库配置
const dbConfig = {
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT) || 3306,
  user: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_DATABASE || 'campus_moments',
  charset: 'utf8mb4',
  timezone: '+08:00',
  connectionLimit: 10,
  acquireTimeout: 60000,
  timeout: 60000,
  reconnect: true
};

// 验证必需的环境变量
function validateEnvironment() {
  const requiredEnvVars = ['DB_HOST', 'DB_USERNAME', 'DB_DATABASE'];
  const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);

  if (missingEnvVars.length > 0) {
    const errorMessage = `
❌ 缺少必需的环境变量: ${missingEnvVars.join(', ')}
💡 请检查 .env 文件是否存在并包含以下配置:
   DB_HOST=localhost
   DB_USERNAME=root  
   DB_DATABASE=campus_moments
   DB_PASSWORD=你的密码
   DB_PORT=3306
    `;
    throw new Error(errorMessage);
  }

  console.log('✅ 环境变量验证通过');
}

// 创建连接池
let pool;

try {
  validateEnvironment();
  
  pool = mysql.createPool(dbConfig);
  console.log('✅ 数据库连接池创建成功');
} catch (error) {
  console.error('❌ 数据库配置失败:', error.message);
  process.exit(1);
}

// 测试数据库连接
async function testConnection() {
  let connection;
  try {
    connection = await pool.getConnection();
    console.log('✅ 数据库连接测试成功');
    console.log(`📍 数据库: ${dbConfig.database}`);
    console.log(`🏠 主机: ${dbConfig.host}:${dbConfig.port}`);
    console.log(`👤 用户: ${dbConfig.user}`);
    
    // 测试基本查询
    const [rows] = await connection.execute('SELECT NOW() as `current_time`, VERSION() as `version`');
    console.log(`⏰ 数据库时间: ${rows[0].current_time}`);
    console.log(`🔧 MySQL版本: ${rows[0].version}`);
    
    return true;
  } catch (error) {
    console.error('❌ 数据库连接测试失败:', error.message);
    
    // 提供具体的错误解决方案
    if (error.code === 'ER_ACCESS_DENIED_ERROR') {
      console.log('💡 解决方案: 检查数据库用户名和密码是否正确');
    } else if (error.code === 'ER_BAD_DB_ERROR') {
      console.log('💡 解决方案: 数据库不存在，请先创建数据库:', dbConfig.database);
    } else if (error.code === 'ECONNREFUSED') {
      console.log('💡 解决方案: 数据库服务未启动，请启动 MySQL 服务');
    }
    
    return false;
  } finally {
    if (connection) {
      connection.release();
    }
  }
}

// 获取数据库连接
async function getConnection() {
  try {
    const connection = await pool.getConnection();
    return connection;
  } catch (error) {
    console.error('❌ 获取数据库连接失败:', error.message);
    throw error;
  }
}

// 执行查询
async function executeQuery(sql, params = []) {
  let connection;
  try {
    connection = await pool.getConnection();
    const [results] = await connection.execute(sql, params);
    return results;
  } catch (error) {
    console.error('❌ 查询执行失败:');
    console.error('SQL:', sql);
    console.error('参数:', params);
    console.error('错误:', error.message);
    throw error;
  } finally {
    if (connection) {
      connection.release();
    }
  }
}

// 健康检查
async function healthCheck() {
  try {
    const [result] = await pool.execute('SELECT 1 as status');
    return {
      status: 'healthy',
      database: dbConfig.database,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      error: error.message,
      timestamp: new Date().toISOString()
    };
  }
}

// 优雅关闭
async function closePool() {
  try {
    await pool.end();
    console.log('✅ 数据库连接池已关闭');
  } catch (error) {
    console.error('❌ 关闭数据库连接池失败:', error.message);
  }
}

// 进程退出时关闭连接池
process.on('SIGINT', async () => {
  console.log('\n🔻 正在关闭数据库连接...');
  await closePool();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n🔻 正在关闭数据库连接...');
  await closePool();
  process.exit(0);
});

module.exports = {
  pool,
  getConnection,
  executeQuery,
  testConnection,
  healthCheck,
  closePool,
  dbConfig
};
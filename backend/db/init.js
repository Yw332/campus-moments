/**
 * 数据库初始化脚本
 * 用途：自动创建 users 和 posts 表
 * 用法：node backend/db/init.js
 */

require('dotenv').config();
const mysql = require('mysql2/promise');

const dbConfig = {
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT) || 3306,
  user: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_DATABASE || 'campus_moments'
};

async function initializeDatabase() {
  let connection;
  try {
    console.log('🔗 正在连接数据库...');
    connection = await mysql.createConnection({
      host: dbConfig.host,
      port: dbConfig.port,
      user: dbConfig.user,
      password: dbConfig.password
    });

    console.log('✅ 数据库连接成功');

    // 创建数据库（如果不存在）
    console.log('\n📁 创建数据库 campus_moments...');
    await connection.execute(
      `CREATE DATABASE IF NOT EXISTS ${dbConfig.database} CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`
    );
    console.log('✅ 数据库创建/已存在');

    // 选择数据库
    await connection.execute(`USE ${dbConfig.database}`);

    // 创建 users 表
    console.log('\n👥 创建 users 表...');
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(50) NOT NULL UNIQUE COMMENT '用户名',
        phone VARCHAR(20) NOT NULL UNIQUE COMMENT '手机号',
        password VARCHAR(255) NOT NULL COMMENT '密码',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
        INDEX idx_username (username),
        INDEX idx_phone (phone)
      ) CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户表'
    `);
    console.log('✅ users 表创建/已存在');

    // 创建 posts 表
    console.log('\n📝 创建 posts 表...');
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS posts (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL COMMENT '用户ID',
        username VARCHAR(50) NOT NULL COMMENT '用户名',
        content LONGTEXT NOT NULL COMMENT '动态内容',
        tags VARCHAR(255) COMMENT '标签（逗号分隔）',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        INDEX idx_user_id (user_id),
        INDEX idx_created_at (created_at)
      ) CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='动态表'
    `);
    console.log('✅ posts 表创建/已存在');

    // 验证表结构
    console.log('\n📊 验证数据库结构...');
    const [tables] = await connection.execute(
      `SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = ?`,
      [dbConfig.database]
    );

    console.log('📋 当前数据库中的表：');
    tables.forEach(table => {
      console.log(`   - ${table.TABLE_NAME}`);
    });

    console.log('\n✅ 数据库初始化完成！');
    console.log(`📍 数据库: ${dbConfig.database}`);
    console.log(`🏠 主机: ${dbConfig.host}:${dbConfig.port}`);
    console.log(`👤 用户: ${dbConfig.user}`);

  } catch (error) {
    console.error('\n❌ 数据库初始化失败:', error.message);

    // 提供具体的错误解决方案
    if (error.code === 'ER_ACCESS_DENIED_ERROR') {
      console.log('\n💡 解决方案: 检查数据库用户名和密码是否正确');
      console.log('   检查 .env 文件中的以下配置：');
      console.log('   - DB_HOST');
      console.log('   - DB_USERNAME');
      console.log('   - DB_PASSWORD');
    } else if (error.code === 'ECONNREFUSED') {
      console.log('\n💡 解决方案: 数据库服务未启动');
      console.log('   请确保 MySQL 服务已启动');
      console.log('   检查 DB_HOST 和 DB_PORT 是否正确');
    } else if (error.code === 'ENOTFOUND') {
      console.log('\n💡 解决方案: 无法连接到数据库主机');
      console.log('   请检查 DB_HOST 是否正确（当前: ' + dbConfig.host + '）');
      console.log('   确保网络连接正常');
    }

    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

// 运行初始化
initializeDatabase();

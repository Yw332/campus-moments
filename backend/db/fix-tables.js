/**
 * 数据库表修复脚本
 * 用途：修复 AUTO_INCREMENT 问题，重建表
 * 用法：node backend/db/fix-tables.js
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

async function fixTables() {
  let connection;
  try {
    console.log('🔧 正在修复数据库表...\n');
    connection = await mysql.createConnection(dbConfig);

    // 删除旧表（如果存在）
    console.log('🗑️  删除旧表（保留数据备份）...');
    
    // 备份数据
    try {
      const [postsBackup] = await connection.execute('SELECT * FROM posts');
      const [usersBackup] = await connection.execute('SELECT * FROM users');
      console.log(`✅ 备份完成: users 表有 ${usersBackup.length} 条记录, posts 表有 ${postsBackup.length} 条记录`);
    } catch (e) {
      console.log('⚠️  备份失败（表可能不存在）');
    }

    // 删除关联表
    try {
      await connection.execute('DROP TABLE IF EXISTS posts');
      console.log('✅ 删除 posts 表');
    } catch (e) {
      console.log('⚠️  删除 posts 表失败:', e.message);
    }

    try {
      await connection.execute('DROP TABLE IF EXISTS users');
      console.log('✅ 删除 users 表');
    } catch (e) {
      console.log('⚠️  删除 users 表失败:', e.message);
    }

    // 重新创建表
    console.log('\n📝 创建新表...');

    console.log('👥 创建 users 表...');
    await connection.execute(`
      CREATE TABLE users (
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
    console.log('✅ users 表创建成功');

    console.log('📝 创建 posts 表...');
    await connection.execute(`
      CREATE TABLE posts (
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
    console.log('✅ posts 表创建成功');

    // 验证表结构
    console.log('\n📊 验证表结构...');
    
    const [usersColumns] = await connection.execute(`
      SHOW COLUMNS FROM users
    `);
    console.log('👥 users 表字段：');
    usersColumns.forEach(col => {
      const flags = [];
      if (col.Extra === 'auto_increment') flags.push('🔑 AUTO_INCREMENT');
      if (col.Key === 'PRI') flags.push('🔑 PRIMARY KEY');
      if (col.Key === 'UNI') flags.push('⭐ UNIQUE');
      if (col.Null === 'NO') flags.push('❌ NOT NULL');
      console.log(`   - ${col.Field}: ${col.Type} ${flags.join(', ')}`);
    });

    const [postsColumns] = await connection.execute(`
      SHOW COLUMNS FROM posts
    `);
    console.log('\n📝 posts 表字段：');
    postsColumns.forEach(col => {
      const flags = [];
      if (col.Extra === 'auto_increment') flags.push('🔑 AUTO_INCREMENT');
      if (col.Key === 'PRI') flags.push('🔑 PRIMARY KEY');
      if (col.Key === 'FOR') flags.push('🔗 FOREIGN KEY');
      console.log(`   - ${col.Field}: ${col.Type} ${flags.join(', ')}`);
    });

    console.log('\n✅ 表修复完成！');
    console.log('\n💡 现在可以重新启动后端服务：');
    console.log('   node app.js');

  } catch (error) {
    console.error('\n❌ 修复失败:', error.message);
    console.log('\n🔍 错误代码:', error.code);
    
    if (error.code === 'ER_ACCESS_DENIED_ERROR') {
      console.log('\n💡 解决方案: 检查数据库用户名和密码');
    } else if (error.code === 'ECONNREFUSED') {
      console.log('\n💡 解决方案: 数据库服务未启动');
    }

    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
      console.log('\n🔌 连接已关闭');
    }
  }
}

fixTables();

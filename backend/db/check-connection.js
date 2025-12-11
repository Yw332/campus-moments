/**
 * 数据库连接诊断工具
 * 用途：检查数据库连接是否正常
 * 用法：node backend/db/check-connection.js
 */

require('dotenv').config();
const mysql = require('mysql2/promise');

console.log('🔍 数据库连接诊断工具\n');

// 显示配置信息
console.log('📋 配置信息：');
console.log('   DB_HOST:', process.env.DB_HOST || '未设置');
console.log('   DB_PORT:', process.env.DB_PORT || '3306');
console.log('   DB_USERNAME:', process.env.DB_USERNAME || '未设置');
console.log('   DB_DATABASE:', process.env.DB_DATABASE || 'campus_moments');
console.log('   DB_PASSWORD:', process.env.DB_PASSWORD ? '✓ 已设置' : '⚠️  未设置');
console.log('');

const dbConfig = {
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT) || 3306,
  user: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_DATABASE || 'campus_moments'
};

async function checkConnection() {
  let connection;
  try {
    console.log('🔗 正在连接数据库...');
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ 连接成功！\n');

    // 检查数据库版本
    const [versionResult] = await connection.execute('SELECT VERSION() as version');
    console.log('📦 MySQL 版本:', versionResult[0].version);

    // 检查数据库时间
    const [timeResult] = await connection.execute('SELECT NOW() as current_time');
    console.log('⏰ 数据库时间:', timeResult[0].current_time);

    // 检查表
    console.log('\n📊 数据库表检查：');
    const [tables] = await connection.execute(
      `SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = ?`,
      [dbConfig.database]
    );

    if (tables.length === 0) {
      console.log('⚠️  数据库中没有表');
      console.log('💡 运行以下命令创建表：');
      console.log('   node backend/db/init.js');
    } else {
      console.log(`📋 找到 ${tables.length} 个表：`);
      for (const table of tables) {
        const [columns] = await connection.execute(
          `SELECT COUNT(*) as count FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ?`,
          [dbConfig.database, table.TABLE_NAME]
        );
        
        const [rows] = await connection.execute(
          `SELECT COUNT(*) as count FROM ${table.TABLE_NAME}`
        );

        console.log(`   - ${table.TABLE_NAME}`);
        console.log(`     └─ 字段: ${columns[0].count} 个, 数据: ${rows[0].count} 条`);
      }
    }

    // 权限检查
    console.log('\n🔐 权限检查：');
    const [privs] = await connection.execute(
      `SELECT GRANTEE, PRIVILEGE_TYPE FROM INFORMATION_SCHEMA.ROLE_PRIVILEGES WHERE ROLE_SCHEMA = ?`,
      [dbConfig.database]
    );

    if (privs.length > 0) {
      console.log('✅ 用户拥有以下权限：');
      const privileges = new Set();
      privs.forEach(p => privileges.add(p.PRIVILEGE_TYPE));
      Array.from(privileges).forEach(p => console.log(`   - ${p}`));
    } else {
      console.log('✅ 用户权限检查完成');
    }

    console.log('\n✅ 数据库连接检查完成！');

  } catch (error) {
    console.log('❌ 连接失败！\n');
    console.log('错误信息:', error.message);
    console.log('错误代码:', error.code);

    // 故障排查
    console.log('\n🔧 故障排查：');
    
    if (error.code === 'ER_ACCESS_DENIED_ERROR') {
      console.log('❌ 身份验证失败');
      console.log('💡 解决方案：');
      console.log('   1. 检查 .env 文件中的用户名和密码是否正确');
      console.log('   2. 确认数据库用户存在且密码正确');
      console.log('   3. 检查用户是否有权限访问该主机');
    } else if (error.code === 'ECONNREFUSED') {
      console.log('❌ 连接被拒绝（数据库服务未启动）');
      console.log('💡 解决方案：');
      console.log('   1. 确保 MySQL 服务已启动');
      console.log('   2. 检查 DB_HOST 和 DB_PORT 是否正确');
      console.log('   3. 尝试手动连接：mysql -h ' + dbConfig.host + ' -u ' + dbConfig.user + ' -p');
    } else if (error.code === 'ENOTFOUND') {
      console.log('❌ 无法解析主机名');
      console.log('💡 解决方案：');
      console.log('   1. 检查 DB_HOST 是否正确');
      console.log('   2. 确保网络连接正常');
      console.log('   3. 尝试 ping 该主机：ping ' + dbConfig.host);
    } else if (error.code === 'ER_BAD_DB_ERROR') {
      console.log('❌ 数据库不存在');
      console.log('💡 解决方案：');
      console.log('   运行初始化脚本：node backend/db/init.js');
    } else {
      console.log('❌ 未知错误');
      console.log('💡 完整错误信息：');
      console.log(error);
    }

    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
      console.log('\n🔌 连接已关闭');
    }
  }
}

checkConnection();

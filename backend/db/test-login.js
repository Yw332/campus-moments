/**
 * 登录问题诊断脚本
 * 用途：检查注册和登录的数据一致性
 * 用法：node backend/db/test-login.js
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

async function testLogin() {
  let connection;
  try {
    console.log('🔍 登录问题诊断\n');
    connection = await mysql.createConnection(dbConfig);

    // 1. 查看数据库中的所有用户
    console.log('📋 查看数据库中的所有用户：');
    const [users] = await connection.execute(
      'SELECT id, username, phone, password, created_at FROM users'
    );

    if (users.length === 0) {
      console.log('❌ 数据库中没有用户！');
      console.log('\n💡 解决方案：');
      console.log('   1. 先注册一个用户');
      console.log('   2. 检查注册是否成功');
      console.log('\n建议运行此命令手动添加测试用户：');
      console.log(`   mysql -h ${dbConfig.host} -u ${dbConfig.user} -p${dbConfig.password}`);
      console.log(`   USE ${dbConfig.database};`);
      console.log(`   INSERT INTO users (username, phone, password) VALUES ('test', '13800138000', 'test123');`);
      process.exit(1);
    }

    users.forEach((user, index) => {
      console.log(`\n用户 ${index + 1}:`);
      console.log(`   ID: ${user.id}`);
      console.log(`   用户名: ${user.username}`);
      console.log(`   手机号: ${user.phone}`);
      console.log(`   密码: ${user.password} (长度: ${user.password.length})`);
      console.log(`   创建时间: ${user.created_at}`);
    });

    // 2. 测试登录查询
    console.log('\n\n🧪 测试登录查询：');
    const testUser = users[0];
    
    console.log(`\n尝试用用户名 "${testUser.username}" 和密码 "${testUser.password}" 登录...`);
    const [loginByUsername] = await connection.execute(
      'SELECT id, username, phone FROM users WHERE (username = ? OR phone = ?) AND password = ?',
      [testUser.username, testUser.username, testUser.password]
    );

    if (loginByUsername.length > 0) {
      console.log('✅ 用用户名登录成功！');
      console.log('   找到用户:', loginByUsername[0]);
    } else {
      console.log('❌ 用用户名登录失败！');
      
      // 诊断原因
      console.log('\n🔍 诊断原因：');
      
      // 检查用户名是否匹配
      const [usernameCheck] = await connection.execute(
        'SELECT id, username, password FROM users WHERE username = ?',
        [testUser.username]
      );
      
      if (usernameCheck.length > 0) {
        console.log('✅ 用户名存在');
        const dbUser = usernameCheck[0];
        console.log(`   数据库密码: "${dbUser.password}" (长度: ${dbUser.password.length})`);
        console.log(`   输入密码: "${testUser.password}" (长度: ${testUser.password.length})`);
        
        if (dbUser.password === testUser.password) {
          console.log('✅ 密码完全匹配！');
        } else {
          console.log('❌ 密码不匹配！');
          console.log('\n   可能原因：');
          console.log('   1. 密码包含隐藏字符或空格');
          console.log('   2. 字符编码不一致');
          console.log('   3. 数据库中密码被修改');
          
          // 字节比较
          const dbBytes = Buffer.from(dbUser.password);
          const inputBytes = Buffer.from(testUser.password);
          console.log(`\n   数据库密码字节: ${dbBytes.toString('hex')}`);
          console.log(`   输入密码字节: ${inputBytes.toString('hex')}`);
        }
      } else {
        console.log('❌ 用户名不存在！');
      }
    }

    // 3. 用手机号测试
    console.log(`\n\n尝试用手机号 "${testUser.phone}" 和密码 "${testUser.password}" 登录...`);
    const [loginByPhone] = await connection.execute(
      'SELECT id, username, phone FROM users WHERE (username = ? OR phone = ?) AND password = ?',
      [testUser.phone, testUser.phone, testUser.password]
    );

    if (loginByPhone.length > 0) {
      console.log('✅ 用手机号登录成功！');
      console.log('   找到用户:', loginByPhone[0]);
    } else {
      console.log('❌ 用手机号登录失败！');
    }

    // 4. 检查表结构
    console.log('\n\n📊 表结构检查：');
    const [columns] = await connection.execute(
      'SHOW COLUMNS FROM users'
    );

    console.log('users 表字段：');
    columns.forEach(col => {
      console.log(`   - ${col.Field}: ${col.Type} (Null: ${col.Null}, Key: ${col.Key}, Default: ${col.Default}, Extra: ${col.Extra})`);
    });

    // 5. 建议
    console.log('\n\n💡 故障排查建议：');
    console.log('1. 如果密码不匹配，可能需要重新注册用户');
    console.log('2. 清除数据库重新初始化：node db/fix-tables.js');
    console.log('3. 检查字符编码：所有表都应该使用 utf8mb4');

  } catch (error) {
    console.error('\n❌ 诊断失败:', error.message);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
      console.log('\n🔌 连接已关闭');
    }
  }
}

testLogin();

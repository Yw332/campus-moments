const db = require('./config/database');

(async () => {
  try {
    const ok = await db.testConnection();
    if (ok) {
      console.log('\n✅ 最终结果: 数据库连接成功');
      process.exit(0);
    } else {
      console.error('\n❌ 最终结果: 数据库连接失败');
      process.exit(1);
    }
  } catch (err) {
    console.error('\n❌ 异常: ', err.message || err);
    process.exit(1);
  }
})();

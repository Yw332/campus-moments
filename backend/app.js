// 加载环境变量
require('dotenv').config();// 使用dotenv加载.env文件中的环境变量
//导入依赖
const express = require('express');//Web框架，帮你处理HTTP请求和响应
const cors = require('cors');//跨域资源共享，让前端能访问你的后端
const path = require('path');//Node.js内置模块，处理文件路径
const { testConnection } = require('./config/database');//数据库连接文件

const app = express();//app 是后端应用主体，所有功能都挂在它上面
const PORT = process.env.PORT || 3000;//服务器监听端口

// 中间件
app.use(cors());//启用CORS，允许跨域请求
app.use(express.json());//解析JSON请求体
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));//静态文件服务，访问/uploads路径时，返回uploads文件夹内容

// 统一响应格式中间件（放在路由前）
app.use((req, res, next) => {
  res.success = (data, message = 'success') => {
    res.json({ code: 200, data: data, message: message });
  };

  res.error = (message, code = 400) => {
    res.json({ code: code, data: null, message: message });
  };

  next();
});

// 模拟数据（临时使用，后续可连接数据库）
const users = [
  { id: 1, username: 'admin', password: '123456' }
];
const posts = [
  {
    id: 1,
    content: '欢迎使用校园时刻！',
    userId: 1,
    username: 'admin',
    createTime: new Date().toISOString()
  }
];

// 路由挂载
app.use('/api/auth', require('./routes/auth')(users));//所有 /api/auth 开头的请求 → 交给 auth.js 处理
app.use('/api/posts', require('./routes/posts')(posts));//所有 /api/posts 开头的请求 → 交给 posts.js 处理
app.use('/api/upload', require('./routes/upload'));
app.use('/api/user', require('./routes/user')(users));

// 健康检查接口
app.get('/api/hello', (req, res) => {
  res.json({ 
    code: 200, 
    message: '后端服务正常运行！',
    data: { service: '校园时刻后端', version: '1.0' }
  });
});

// 在服务器启动前测试数据库连接
async function initializeApp() {
  console.log('🔗 正在连接数据库...');
  const dbConnected = await testConnection();

  if (dbConnected) {
    // 数据库连接成功后才启动服务器
    app.listen(PORT, () => {//监听指定端口
      console.log(`🎉 后端服务器启动成功！`);
      console.log(`📍 访问地址: http://localhost:${PORT}`);
      console.log(`✅ 测试接口: http://localhost:${PORT}/api/hello`);
    });
  } else {
    console.log('❌ 服务器启动失败：数据库连接异常');
    process.exit(1);
  }
}
// 统一响应格式中间件
app.use((req, res, next) => {
  // 成功响应方法
  res.success = (data, message = 'success') => {
    res.json({
      code: 200,
      data: data,
      message: message
    });
  };

  // 错误响应方法
  res.error = (message, code = 400) => {
    res.json({
      code: code,
      data: null,
      message: message
    });
  };

  next();
});
initializeApp();

const jwt = require('jsonwebtoken');// 引入jsonwebtoken库
const { secret } = require('../config/jwt');// 引入JWT配置

const authMiddleware = (req, res, next) => {
  // 从请求头获取token
  const authHeader = req.header('Authorization');
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(200).json({//
      code: 401,
      message: '访问被拒绝，请先登录',
      data: null
    });
  }
  
  const token = authHeader.replace('Bearer ', '');// 提取token部分
  
  try {
    // 验证token
    const decoded = jwt.verify(token, secret);
    req.user = decoded; // 把用户信息挂载到request对象上
    next(); // 验证通过，继续执行后续代码
  } catch (error) {
    // token无效或过期
    return res.status(200).json({
      code: 401,
      message: '令牌无效或已过期',
      data: null
    });
  }
};

module.exports = authMiddleware;// 导出中间件
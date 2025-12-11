module.exports = (users) => {
  const express = require('express');
  const router = express.Router();

  // 用户注册（支持 username, phone, password）
  router.post('/register', (req, res) => {
    const { username, phone, password } = req.body;

    if (!username || !phone || !password) {
      return res.json({ code: 400, message: '缺少必要字段', data: null });
    }

    const existingUserByName = users.find(user => user.username === username);
    if (existingUserByName) {
      return res.json({ code: 400, message: '用户名已存在', data: null });
    }

    const existingUserByPhone = users.find(user => user.phone === phone);
    if (existingUserByPhone) {
      return res.json({ code: 400, message: '手机号已注册', data: null });
    }

    const newUser = {
      id: users.length + 1,
      username,
      phone,
      password,
      createTime: new Date().toISOString()
    };

    users.push(newUser);
    res.json({
      code: 200,
      message: '注册成功',
      data: {
        userId: newUser.id,
        username: newUser.username,
        phone: newUser.phone
      }
    });
  });

  const jwt = require('jsonwebtoken');
  const { secret, expiresIn } = require('../config/jwt');

  // 用户登录：支持 account（用户名或手机号） + password
  router.post('/login', (req, res) => {
    const { account, password } = req.body;
    if (!account || !password) {
      return res.json({ code: 400, message: '缺少账户或密码', data: null });
    }

    // 支持手机号或用户名登录
    const user = users.find(u => (u.username === account || u.phone === account) && u.password === password);
    if (!user) {
      return res.json({ code: 401, message: '账户不存在或密码错误', data: null });
    }

    const token = jwt.sign({ userId: user.id, username: user.username }, secret, { expiresIn });

    res.json({
      code: 200,
      message: '登录成功',
      data: {
        token,
        userInfo: {
          userId: user.id,
          username: user.username,
          phone: user.phone
        }
      }
    });
  });

  // 退出登录（无状态示例，客户端丢弃 token 即可）
  router.post('/logout', (req, res) => {
    // 可以在这里做黑名单处理（如果使用有状态 token 存储）
    return res.json({ code: 200, message: '退出成功', data: null });
  });

  return router;
};
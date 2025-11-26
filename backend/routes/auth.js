module.exports = (users) => {
  const express = require('express');
  const router = express.Router();

  // 用户注册
  router.post('/register', (req, res) => {
    const { username, password } = req.body;

    const existingUser = users.find(user => user.username === username);
    if (existingUser) {
      return res.json({ code: 400, message: '用户名已存在', data: null  });
    }

    const newUser = {
      id: users.length + 1,
      username,
      password,
      createTime: new Date().toISOString()
    };

    users.push(newUser);
    res.json({ code: 200, message: '注册成功', data: { userId: newUser.id } });
  });

  const jwt = require('jsonwebtoken');
  const { secret, expiresIn } = require('../config/jwt');

  // 用户登录
  router.post('/login', (req, res) => {
    const { username, password } = req.body;

    // 1. 验证用户是否存在
    const user = users.find(u => u.username === username && u.password === password);
    if (!user) {
      return res.json({
        code: 401,
        message: '用户名或密码错误',
        data: null
      });
    }

    // 2. 生成JWT Token
    const token = jwt.sign(
      {
        userId: user.id,
        username: user.username
      },
      secret,
      { expiresIn }
    );

    // 3. 返回用户信息和token
    res.json({
      code: 200,
      message: '登录成功',
      data: {
        userId: user.id,
        username: user.username,
        token: token
      }
    });
  });

  return router;
};
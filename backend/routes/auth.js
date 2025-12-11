module.exports = () => {
  const express = require('express');
  const router = express.Router();
  const jwt = require('jsonwebtoken');
  const { secret, expiresIn } = require('../config/jwt');
  const { executeQuery } = require('../config/database');

  // 用户注册（支持 username, phone, password）
  router.post('/register', async (req, res) => {
    try {
      const { username, phone, password } = req.body;

      if (!username || !phone || !password) {
        return res.json({ code: 400, message: '缺少必要字段', data: null });
      }

      // 检查用户名是否已存在
      const existingUserByName = await executeQuery(
        'SELECT id FROM users WHERE username = ?',
        [username]
      );
      if (existingUserByName.length > 0) {
        return res.json({ code: 400, message: '用户名已存在', data: null });
      }

      // 检查手机号是否已注册
      const existingUserByPhone = await executeQuery(
        'SELECT id FROM users WHERE phone = ?',
        [phone]
      );
      if (existingUserByPhone.length > 0) {
        return res.json({ code: 400, message: '手机号已注册', data: null });
      }

      // 插入新用户到数据库
      const result = await executeQuery(
        'INSERT INTO users (username, phone, password, created_at) VALUES (?, ?, ?, NOW())',
        [username, phone, password]
      );

      res.json({
        code: 200,
        message: '注册成功',
        data: {
          userId: result.insertId,
          username: username,
          phone: phone
        }
      });
    } catch (error) {
      console.error('❌ 注册失败:', error.message);
      res.json({ code: 500, message: '注册失败，请重试', data: null });
    }
  });

  // 用户登录：支持 account（用户名或手机号） + password
  router.post('/login', async (req, res) => {
    try {
      const { account, password } = req.body;
      if (!account || !password) {
        return res.json({ code: 400, message: '缺少账户或密码', data: null });
      }

      // 支持手机号或用户名登录
      const users = await executeQuery(
        'SELECT id, username, phone FROM users WHERE (username = ? OR phone = ?) AND password = ?',
        [account, account, password]
      );

      if (users.length === 0) {
        return res.json({ code: 401, message: '账户不存在或密码错误', data: null });
      }

      const user = users[0];
      const token = jwt.sign(
        { userId: user.id, username: user.username },
        secret,
        { expiresIn }
      );

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
    } catch (error) {
      console.error('❌ 登录失败:', error.message);
      res.json({ code: 500, message: '登录失败，请重试', data: null });
    }
  });

  // 退出登录（无状态示例，客户端丢弃 token 即可）
  router.post('/logout', (req, res) => {
    // 可以在这里做黑名单处理（如果使用有状态 token 存储）
    return res.json({ code: 200, message: '退出成功', data: null });
  });

  return router;
};
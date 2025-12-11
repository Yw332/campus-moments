module.exports = () => {
  const express = require('express');
  const router = express.Router();
  const authMiddleware = require('../middleware/auth');
  const { executeQuery } = require('../config/database');

  // GET /api/user/profile
  router.get('/profile', authMiddleware, async (req, res) => {
    try {
      const currentUser = req.user;
      const users = await executeQuery(
        'SELECT id, username, phone FROM users WHERE id = ?',
        [currentUser.userId]
      );

      if (users.length === 0) {
        return res.json({ code: 404, message: '用户未找到', data: null });
      }

      const user = users[0];
      return res.json({
        code: 200,
        message: '获取成功',
        data: {
          userId: user.id,
          username: user.username,
          phone: user.phone || null
        }
      });
    } catch (error) {
      console.error('❌ 获取用户资料失败:', error.message);
      res.json({ code: 500, message: '获取用户资料失败', data: null });
    }
  });

  // PUT /api/user/password
  router.put('/password', authMiddleware, async (req, res) => {
    try {
      const { oldPassword, newPassword, confirmPassword } = req.body;
      if (!oldPassword || !newPassword || !confirmPassword) {
        return res.json({ code: 400, message: '缺少必要字段', data: null });
      }

      if (newPassword !== confirmPassword) {
        return res.json({ code: 400, message: '两次输入的新密码不一致', data: null });
      }

      const currentUser = req.user;
      const users = await executeQuery(
        'SELECT password FROM users WHERE id = ?',
        [currentUser.userId]
      );

      if (users.length === 0) {
        return res.json({ code: 404, message: '用户未找到', data: null });
      }

      const user = users[0];
      if (user.password !== oldPassword) {
        return res.json({ code: 400, message: '原密码错误', data: null });
      }

      if (oldPassword === newPassword) {
        return res.json({ code: 400, message: '新密码不能与原密码相同', data: null });
      }

      // 更新密码到数据库
      await executeQuery(
        'UPDATE users SET password = ? WHERE id = ?',
        [newPassword, currentUser.userId]
      );

      return res.json({ code: 200, message: '密码修改成功，请重新登录', data: null });
    } catch (error) {
      console.error('❌ 修改密码失败:', error.message);
      res.json({ code: 500, message: '修改密码失败', data: null });
    }
  });

  return router;
};

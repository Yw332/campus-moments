module.exports = (users) => {
  const express = require('express');
  const router = express.Router();
  const authMiddleware = require('../middleware/auth');

  // GET /api/user/profile
  router.get('/profile', authMiddleware, (req, res) => {
    const currentUser = req.user;
    const user = users.find(u => u.id === currentUser.userId);
    if (!user) return res.json({ code: 404, message: '用户未找到', data: null });

    return res.json({
      code: 200,
      message: '获取成功',
      data: {
        userId: user.id,
        username: user.username,
        phone: user.phone || null
      }
    });
  });

  // PUT /api/user/password
  router.put('/password', authMiddleware, (req, res) => {
    const { oldPassword, newPassword, confirmPassword } = req.body;
    if (!oldPassword || !newPassword || !confirmPassword) {
      return res.json({ code: 400, message: '缺少必要字段', data: null });
    }

    if (newPassword !== confirmPassword) {
      return res.json({ code: 400, message: '两次输入的新密码不一致', data: null });
    }

    const currentUser = req.user;
    const user = users.find(u => u.id === currentUser.userId);
    if (!user) return res.json({ code: 404, message: '用户未找到', data: null });

    if (user.password !== oldPassword) {
      return res.json({ code: 400, message: '原密码错误', data: null });
    }

    if (oldPassword === newPassword) {
      return res.json({ code: 400, message: '新密码不能与原密码相同', data: null });
    }

    user.password = newPassword;
    return res.json({ code: 200, message: '密码修改成功，请重新登录', data: null });
  });

  return router;
};

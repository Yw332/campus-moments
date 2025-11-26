module.exports = (posts) => {
  const express = require('express');
  const router = express.Router();

  const authMiddleware = require('../middleware/auth');

  // 发布动态 - 需要登录
  router.post('/', authMiddleware, (req, res) => {
    // 现在可以通过 req.user 获取当前用户信息
    const currentUser = req.user;

    const { content, tags = [] } = req.body;

    const newPost = {
      id: posts.length + 1,
      content,
      userId: currentUser.userId,      // 从token中获取用户ID
      username: currentUser.username,  // 从token中获取用户名
      createTime: new Date().toISOString(),
      tags
    };

    posts.push(newPost);

    res.json({
      code: 200,
      message: '发布成功',
      data: { postId: newPost.id }
    });
  });

  // 获取动态列表 - 可以不需要登录
  router.get('/', (req, res) => {
    // 保持原有代码不变
    const sortedPosts = posts.sort((a, b) =>
      new Date(b.createTime) - new Date(a.createTime)
    );

    res.json({
      code: 200,
      message: 'success',
      data: {
        list: sortedPosts,  // 按照文档要求，数据放在 list 字段
        total: sortedPosts.length
      }
    });
  });

  return router;
};
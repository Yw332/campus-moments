module.exports = () => {
  const express = require('express');
  const router = express.Router();
  const authMiddleware = require('../middleware/auth');
  const { executeQuery } = require('../config/database');

  // 发布动态 - 需要登录
  router.post('/', authMiddleware, async (req, res) => {
    try {
      const currentUser = req.user;
      const { content, tags = '' } = req.body;

      if (!content) {
        return res.json({ code: 400, message: '动态内容不能为空', data: null });
      }

      // 插入动态到数据库
      const result = await executeQuery(
        'INSERT INTO posts (user_id, username, content, tags, created_at) VALUES (?, ?, ?, ?, NOW())',
        [currentUser.userId, currentUser.username, content, tags]
      );

      res.json({
        code: 200,
        message: '发布成功',
        data: { postId: result.insertId }
      });
    } catch (error) {
      console.error('❌ 发布动态失败:', error.message);
      res.json({ code: 500, message: '发布动态失败', data: null });
    }
  });

  // 获取动态列表 - 可以不需要登录
  router.get('/', async (req, res) => {
    try {
      const posts = await executeQuery(
        'SELECT id, user_id, username, content, tags, created_at FROM posts ORDER BY created_at DESC'
      );

      res.json({
        code: 200,
        message: 'success',
        data: {
          list: posts,
          total: posts.length
        }
      });
    } catch (error) {
      console.error('❌ 获取动态列表失败:', error.message);
      res.json({ code: 500, message: '获取动态列表失败', data: null });
    }
  });

  // 获取单条动态详情 - 可选登录（不强制）
  router.get('/:id', async (req, res) => {
    try {
      const postId = parseInt(req.params.id, 10);
      if (Number.isNaN(postId)) {
        return res.json({ code: 400, message: '无效的动态 ID', data: null });
      }

      const posts = await executeQuery(
        'SELECT id, user_id, username, content, tags, created_at FROM posts WHERE id = ?',
        [postId]
      );

      if (posts.length === 0) {
        return res.json({ code: 404, message: '动态未找到', data: null });
      }

      return res.json({ code: 200, message: 'success', data: { post: posts[0] } });
    } catch (error) {
      console.error('❌ 获取动态详情失败:', error.message);
      res.json({ code: 500, message: '获取动态详情失败', data: null });
    }
  });

  // 更新动态 - 需要登录且只能更新自己的动态
  router.put('/:id', authMiddleware, async (req, res) => {
    try {
      const currentUser = req.user;
      const postId = parseInt(req.params.id, 10);
      const { content, tags = '' } = req.body;

      // 查询动态
      const posts = await executeQuery(
        'SELECT user_id FROM posts WHERE id = ?',
        [postId]
      );

      if (posts.length === 0) {
        return res.json({ code: 404, message: '动态未找到', data: null });
      }

      const post = posts[0];
      if (post.user_id !== currentUser.userId) {
        return res.json({ code: 403, message: '无权修改他人动态', data: null });
      }

      // 更新动态
      await executeQuery(
        'UPDATE posts SET content = ?, tags = ?, updated_at = NOW() WHERE id = ?',
        [content, tags, postId]
      );

      // 返回更新后的动态
      const updatedPosts = await executeQuery(
        'SELECT id, user_id, username, content, tags, created_at, updated_at FROM posts WHERE id = ?',
        [postId]
      );

      return res.json({
        code: 200,
        message: '更新成功',
        data: { postId: postId, post: updatedPosts[0] }
      });
    } catch (error) {
      console.error('❌ 更新动态失败:', error.message);
      res.json({ code: 500, message: '更新动态失败', data: null });
    }
  });

  // 部分更新（PATCH） - 只更新提供的字段
  router.patch('/:id', authMiddleware, async (req, res) => {
    try {
      const currentUser = req.user;
      const postId = parseInt(req.params.id, 10);
      const { content, tags } = req.body;

      // 查询动态
      const posts = await executeQuery(
        'SELECT user_id FROM posts WHERE id = ?',
        [postId]
      );

      if (posts.length === 0) {
        return res.json({ code: 404, message: '动态未找到', data: null });
      }

      const post = posts[0];
      if (post.user_id !== currentUser.userId) {
        return res.json({ code: 403, message: '无权修改他人动态', data: null });
      }

      // 只更新提供的字段
      let updateSQL = 'UPDATE posts SET updated_at = NOW()';
      const params = [];

      if (content !== undefined) {
        updateSQL += ', content = ?';
        params.push(content);
      }
      if (tags !== undefined) {
        updateSQL += ', tags = ?';
        params.push(tags);
      }

      updateSQL += ' WHERE id = ?';
      params.push(postId);

      await executeQuery(updateSQL, params);

      // 返回更新后的动态
      const updatedPosts = await executeQuery(
        'SELECT id, user_id, username, content, tags, created_at, updated_at FROM posts WHERE id = ?',
        [postId]
      );

      return res.json({
        code: 200,
        message: '更新成功',
        data: { postId: postId, post: updatedPosts[0] }
      });
    } catch (error) {
      console.error('❌ 更新动态失败:', error.message);
      res.json({ code: 500, message: '更新动态失败', data: null });
    }
  });

  // 删除动态 - 需要登录且只能删除自己的动态
  router.delete('/:id', authMiddleware, async (req, res) => {
    try {
      const currentUser = req.user;
      const postId = parseInt(req.params.id, 10);

      // 查询动态
      const posts = await executeQuery(
        'SELECT user_id FROM posts WHERE id = ?',
        [postId]
      );

      if (posts.length === 0) {
        return res.json({ code: 404, message: '动态未找到', data: null });
      }

      const post = posts[0];
      if (post.user_id !== currentUser.userId) {
        return res.json({ code: 403, message: '无权删除他人动态', data: null });
      }

      // 删除动态
      await executeQuery('DELETE FROM posts WHERE id = ?', [postId]);

      return res.json({ code: 200, message: '删除成功', data: { postId: postId } });
    } catch (error) {
      console.error('❌ 删除动态失败:', error.message);
      res.json({ code: 500, message: '删除动态失败', data: null });
    }
  });

  return router;
};
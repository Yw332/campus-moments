-- 创建数据库（如果不存在）
CREATE DATABASE IF NOT EXISTS campus_moments;
USE campus_moments;

-- 用户表
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(50) NOT NULL UNIQUE COMMENT '用户名',
  phone VARCHAR(20) NOT NULL UNIQUE COMMENT '手机号',
  password VARCHAR(255) NOT NULL COMMENT '密码',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  INDEX idx_username (username),
  INDEX idx_phone (phone)
) CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户表';

-- 动态表
CREATE TABLE IF NOT EXISTS posts (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL COMMENT '用户ID',
  username VARCHAR(50) NOT NULL COMMENT '用户名',
  content LONGTEXT NOT NULL COMMENT '动态内容',
  tags VARCHAR(255) COMMENT '标签（逗号分隔）',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user_id (user_id),
  INDEX idx_created_at (created_at)
) CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='动态表';

-- 插入测试数据（可选）
-- INSERT INTO users (username, phone, password) VALUES
-- ('admin', '13800138000', 'admin123'),
-- ('test', '13800138001', 'test123');

-- INSERT INTO posts (user_id, username, content, tags) VALUES
-- (1, 'admin', '欢迎使用校园时刻！', '欢迎,校园'),
-- (1, 'admin', '今天天气真好', '天气,散步');

// 简单的端到端接口测试脚本（使用全局 fetch）
// 运行方式：在 backend 目录下执行 `node scripts/test-endpoints.js`

const base = 'http://localhost:3000';

function log(title, obj) {
  console.log('\n==== ' + title + ' ====');
  if (typeof obj === 'string') console.log(obj);
  else console.log(JSON.stringify(obj, null, 2));
}

async function waitForServer(retries = 10, delayMs = 800) {
  for (let i = 0; i < retries; i++) {
    try {
      const res = await fetch(`${base}/api/hello`);
      if (res.ok) return true;
    } catch (e) {
      // ignore
    }
    await new Promise(r => setTimeout(r, delayMs));
  }
  return false;
}

async function run() {
  const ready = await waitForServer(15, 500);
  if (!ready) {
    console.error('服务器未就绪：无法访问 /api/hello');
    process.exit(2);
  }

  // 1. 注册一个随机用户
  const rand = Math.floor(Math.random() * 90000) + 10000;
  const username = `testuser_${rand}`;
  const phone = `13800${(10000 + rand).toString().slice(-6)}`.slice(0,11);
  const password = 'Aa123456';

  log('准备注册', { username, phone });

  let res = await fetch(`${base}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, phone, password })
  });
  const reg = await res.json().catch(() => null);
  log('注册响应', reg || '非JSON响应');

  // 2. 登录
  res = await fetch(`${base}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ account: username, password })
  });
  const login = await res.json().catch(() => null);
  log('登录响应', login || '非JSON响应');

  const token = login && login.data && (login.data.token || (login.data.token === undefined ? null : null))
    ? login.data.token
    : (login && login.data && login.data.userInfo && login.data.userInfo.token) ? login.data.userInfo.token : null;

  // 兼容两种返回格式
  let authToken = token;
  if (!authToken && login && login.data && login.data.userInfo && login.data.userInfo.userId) {
    // 之前实现把 token 放在 data.token 或 data.token 不在，此处尝试查找
    authToken = login.data.token || null;
  }

  if (!authToken && login && login.data && login.data.userInfo) {
    // older format returned token under data.token; if not found, try other fields
    authToken = login.data.token || null;
  }

  if (!authToken) {
    // 尝试从 top-level fields
    authToken = (login && login.data && login.data.token) || (login && login.token) || null;
  }

  if (!authToken) {
    log('警告', '未能获取 token — 下面的受保护接口将跳过');
  } else {
    log('获得 token (截断展示)', authToken.slice(0, 40) + '...');
  }

  // 3. 获取用户资料（如果有 token）
  if (authToken) {
    res = await fetch(`${base}/api/user/profile`, {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${authToken}` }
    });
    const profile = await res.json().catch(() => null);
    log('用户资料', profile || '非JSON响应');
  }

  // 4. 获取动态列表
  res = await fetch(`${base}/api/posts`);
  const posts = await res.json().catch(() => null);
  log('动态列表', posts || '非JSON响应');

  // 5. 发布一条动态（需要 token）
  let createdPostId = null;
  if (authToken) {
    const payload = {
      content: '通过自动化测试脚本发布的测试动态',
      tags: ['测试','自动化'],
      media: [],
      visibility: 0
    };
    res = await fetch(`${base}/api/posts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${authToken}` },
      body: JSON.stringify(payload)
    });
    const create = await res.json().catch(() => null);
    log('发布动态响应', create || '非JSON响应');
    if (create && create.data && (create.data.postId || create.data.postId === 0)) createdPostId = create.data.postId;
  }

  // 6. 获取刚创建的动态
  if (createdPostId) {
    res = await fetch(`${base}/api/posts/${createdPostId}`);
    const single = await res.json().catch(() => null);
    log(`获取动态 ${createdPostId}`, single || '非JSON响应');
  }

  // 7. 修改密码（尝试性）
  if (authToken) {
    res = await fetch(`${base}/api/user/password`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${authToken}` },
      body: JSON.stringify({ oldPassword: password, newPassword: 'Bb789012', confirmPassword: 'Bb789012' })
    });
    const pw = await res.json().catch(() => null);
    log('修改密码响应', pw || '非JSON响应');
  }

  console.log('\n测试脚本执行完毕');
}

run().catch(err => {
  console.error('测试脚本异常:', err);
  process.exit(1);
});

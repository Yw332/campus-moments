const path = require('path');
const fs = require('fs');

console.log('🔍 环境诊断信息:');
console.log('1. 当前工作目录:', process.cwd());
console.log('2. .env 文件存在:', fs.existsSync('./.env'));
console.log('3. 文件内容:');
console.log(fs.readFileSync('./.env', 'utf8'));
console.log('4. 文件大小:', fs.statSync('./.env').size, 'bytes');

console.log('\n5. 尝试加载环境变量...');
require('dotenv').config({ 
  debug: true  
});

console.log('\n6. 加载后的环境变量:');
console.log('DB_HOST:', process.env.DB_HOST);
console.log('DB_USERNAME:', process.env.DB_USERNAME);
console.log('DB_DATABASE:', process.env.DB_DATABASE);

console.log('\n7. 所有DB相关环境变量:');
Object.keys(process.env)
  .filter(key => key.includes('DB_'))
  .forEach(key => console.log(`  ${key}: ${process.env[key]}`));

console.log('\n8. 所有环境变量键名:');
console.log(Object.keys(process.env).filter(key => key.startsWith('DB_')));
// 环境变量配置：优先读取 .env，其次读进程环境变量，最后用默认值。
require('dotenv').config()

function getenv(key, fallback) {
  const value = process.env[key]
  return value === undefined || value === '' ? fallback : value
}

const config = {
  // 监听端口，与前端 vite 代理保持一致（默认 3000）
  port: Number(getenv('PORT', '3000')),
  // SQLite 数据库文件路径
  dbPath: getenv('DB_PATH', 'data.sqlite'),
  // JWT 签名密钥，生产环境必须改成随机长字符串
  jwtSecret: getenv('JWT_SECRET', 'dev-secret-change-me'),
  // 登录凭证有效期
  tokenTTL: getenv('TOKEN_TTL', '24h'),
  // 首次启动自动创建的演示账号
  defaultUsername: getenv('DEFAULT_USERNAME', 'demo'),
  defaultPassword: getenv('DEFAULT_PASSWORD', 'demo123')
}

module.exports = config

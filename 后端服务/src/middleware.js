// 中间件：CORS、requireAuth（必须登录）、optionalAuth（登录与否都能用）。
const { parseToken } = require('./auth')
const { fail } = require('./respond')

// 允许前端开发服务器直接跨域访问（走 Vite 代理时其实用不到，但方便直连调试）。
function cors(req, res, next) {
  res.set('Access-Control-Allow-Origin', '*')
  res.set('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS')
  res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  if (req.method === 'OPTIONS') return res.status(204).end()
  return next()
}

// 从 Authorization 头里取出 Bearer token，取不到返回空字符串。
function bearerToken(req) {
  const header = String(req.get('Authorization') ?? '').trim()
  if (!header) return ''
  const index = header.indexOf(' ')
  if (index === -1) return header
  const scheme = header.slice(0, index)
  const value = header.slice(index + 1).trim()
  return scheme.toLowerCase() === 'bearer' ? value : header
}

// 必须登录：解析出用户 id 后挂到 req.userId 上，否则返回 401。
function createRequireAuth(config) {
  return function requireAuth(req, res, next) {
    const token = bearerToken(req)
    if (!token) return fail(res, 401, '缺少登录凭证')
    const userId = parseToken(config.jwtSecret, token)
    if (!userId) return fail(res, 401, '登录已过期，请重新登录')
    req.userId = userId
    return next()
  }
}

// 登录与否都能用（如第 7 周的报名）：带有效 token 就解析出用户 id，否则按匿名处理（req.userId = 0）。
function createOptionalAuth(config) {
  return function optionalAuth(req, res, next) {
    req.userId = 0
    const token = bearerToken(req)
    if (token) {
      const userId = parseToken(config.jwtSecret, token)
      if (userId) req.userId = userId
    }
    return next()
  }
}

module.exports = { cors, bearerToken, createRequireAuth, createOptionalAuth }

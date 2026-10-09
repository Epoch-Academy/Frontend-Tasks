// 鉴权工具：bcrypt 密码哈希 + JWT 签发 / 校验。
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')

// 密码使用 bcrypt 单向哈希，数据库里不保存明文（10 轮，与 bcrypt.DefaultCost 一致）。
function hashPassword(password) {
  return bcrypt.hashSync(password, 10)
}

// 校验明文密码与哈希是否匹配。
function checkPassword(hash, password) {
  try {
    return bcrypt.compareSync(password, hash)
  } catch {
    return false
  }
}

// 为指定用户签发一个 JWT，载荷里只放用户 id。
function newToken(secret, userId, ttl) {
  return jwt.sign({ uid: userId }, secret, { algorithm: 'HS256', expiresIn: ttl })
}

// 校验并解析 JWT，成功返回用户 id，失败返回 null。
function parseToken(secret, token) {
  try {
    const payload = jwt.verify(token, secret, { algorithms: ['HS256'] })
    return typeof payload.uid === 'number' ? payload.uid : null
  } catch {
    return null
  }
}

module.exports = { hashPassword, checkPassword, newToken, parseToken }

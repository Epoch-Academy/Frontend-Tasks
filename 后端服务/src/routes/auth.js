// 注册 / 登录 / 当前用户
const express = require('express')
const { ok, fail } = require('../respond')
const auth = require('../auth')
const { ErrorCode } = require('../store')

module.exports = function createAuthRoutes({ store, config, requireAuth }) {
  const router = express.Router()

  // 登录：校验用户名密码，签发 JWT。
  router.post('/login', (req, res) => {
    const username = String(req.body?.username ?? '').trim()
    const password = String(req.body?.password ?? '')
    if (!username || !password) return fail(res, 400, '请输入用户名和密码')

    const found = store.getUserByUsername(username)
    if (!found) return fail(res, 401, '用户名或密码错误')
    if (!auth.checkPassword(found.passwordHash, password)) return fail(res, 401, '用户名或密码错误')

    const token = auth.newToken(config.jwtSecret, found.user.id, config.tokenTTL)
    return ok(res, { token, user: found.user })
  })

  // 注册：创建用户并直接返回登录凭证。
  router.post('/register', (req, res) => {
    const username = String(req.body?.username ?? '').trim()
    const password = String(req.body?.password ?? '')
    const nickname = String(req.body?.nickname ?? '').trim()

    if ([...username].length < 3 || password.length < 6) {
      return fail(res, 400, '用户名至少 3 位，密码至少 6 位')
    }

    try {
      const user = store.createUser(username, auth.hashPassword(password), nickname || username)
      const token = auth.newToken(config.jwtSecret, user.id, config.tokenTTL)
      return ok(res, { token, user })
    } catch (err) {
      if (err.code === ErrorCode.DUPLICATE) return fail(res, 409, '用户名已被占用')
      console.error(err)
      return fail(res, 500, '注册失败，请稍后重试')
    }
  })

  // 当前登录用户。
  router.get('/me', requireAuth, (req, res) => {
    const user = store.getUserByID(req.userId)
    if (!user) return fail(res, 401, '用户不存在或已失效')
    return ok(res, { user })
  })

  return router
}

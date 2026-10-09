// Express 应用装配：中间件 + 路由注册。
const express = require('express')
const { cors, createRequireAuth, createOptionalAuth } = require('./middleware')
const { ok, fail } = require('./respond')
const createAuthRoutes = require('./routes/auth')
const createClubsRoutes = require('./routes/clubs')
const createActivitiesRoutes = require('./routes/activities')
const createRegistrationsRoutes = require('./routes/registrations')

function createApp({ store, config }) {
  const app = express()

  app.use(cors)
  app.use(express.json({ limit: '1mb' }))

  const requireAuth = createRequireAuth(config)
  const optionalAuth = createOptionalAuth(config)

  // 健康检查
  app.get('/api/health', (req, res) => ok(res, { status: 'ok' }))

  // 认证：注册 / 登录开放，当前用户需要登录
  app.use('/api/auth', createAuthRoutes({ store, config, requireAuth }))

  // 社团
  app.use('/api/clubs', createClubsRoutes({ store }))

  // 活动
  app.use('/api/activities', createActivitiesRoutes({ store }))

  // 报名：提交时登录可选，查询“我的报名”需要登录
  app.use('/api/registrations', createRegistrationsRoutes({ store, requireAuth, optionalAuth }))

  // 未匹配到的路由统一返回 JSON，避免前端拿到 HTML 报错页。
  app.use((req, res) => fail(res, 404, 'Not Found'))

  // 兜底错误处理：请求体 JSON 解析失败按 400 返回，其余按 500。
  app.use((err, req, res, next) => {
    if (err.type === 'entity.parse.failed' || err instanceof SyntaxError) {
      return fail(res, 400, '请求体格式不正确')
    }
    console.error(err)
    return fail(res, 500, '服务器内部错误')
  })

  return app
}

module.exports = { createApp }

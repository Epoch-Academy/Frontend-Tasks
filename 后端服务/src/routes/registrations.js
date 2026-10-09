// 报名 / 我的报名
const express = require('express')
const { ok, fail } = require('../respond')
const { ErrorCode } = require('../store')

module.exports = function createRegistrationsRoutes({ store, requireAuth, optionalAuth }) {
  const router = express.Router()

  // 报名：扣减名额并落库。未登录也能提交（第 7 周场景），登录后自动记录归属用户（第 8 周个人中心用）。
  router.post('/', optionalAuth, (req, res) => {
    const activityId = String(req.body?.activityId ?? '').trim()
    const name = String(req.body?.name ?? '').trim()
    const studentId = String(req.body?.studentId ?? '').trim()
    const contact = String(req.body?.contact ?? '').trim()
    const reason = String(req.body?.reason ?? '').trim()

    if (!activityId || !name || !studentId || !contact) {
      return fail(res, 400, '请填写完整报名信息')
    }
    if ([...reason].length < 10) return fail(res, 400, '参加理由至少 10 个字')

    const userId = req.userId > 0 ? req.userId : null

    try {
      const registrationId = store.register(activityId, userId, name, studentId, contact, reason)
      return ok(res, { registrationId, activityId, status: 'submitted' })
    } catch (err) {
      if (err.code === ErrorCode.NOT_FOUND) return fail(res, 404, '活动不存在')
      if (err.code === ErrorCode.SOLD_OUT) return fail(res, 409, '名额已满')
      console.error(err)
      return fail(res, 500, '报名失败，请稍后重试')
    }
  })

  // 我的报名：供第 8 周个人中心使用。
  router.get('/me', requireAuth, (req, res) => {
    return ok(res, store.listRegistrationsByUser(req.userId))
  })

  return router
}

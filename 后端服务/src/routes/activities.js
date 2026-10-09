// 活动列表 / 详情
const express = require('express')
const { ok, fail } = require('../respond')

module.exports = function createActivitiesRoutes({ store }) {
  const router = express.Router()

  // 列表：支持 keyword / category / sortBy（hot 按热度，其余按时间倒序）。
  router.get('/', (req, res) => {
    const { keyword, category, sortBy } = req.query
    return ok(res, store.listActivities(keyword, category, sortBy))
  })

  // 详情。
  router.get('/:id', (req, res) => {
    const activity = store.getActivity(req.params.id)
    if (!activity) return fail(res, 404, '活动不存在')
    return ok(res, activity)
  })

  return router
}

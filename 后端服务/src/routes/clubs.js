// 社团列表 / 详情
const express = require('express')
const { ok, fail } = require('../respond')

module.exports = function createClubsRoutes({ store }) {
  const router = express.Router()

  // 列表：支持 keyword / category / sortBy（members 按人数，其余按热度）。
  router.get('/', (req, res) => {
    const { keyword, category, sortBy } = req.query
    return ok(res, store.listClubs(keyword, category, sortBy))
  })

  // 详情。
  router.get('/:id', (req, res) => {
    const club = store.getClub(req.params.id)
    if (!club) return fail(res, 404, '社团不存在')
    return ok(res, club)
  })

  return router
}

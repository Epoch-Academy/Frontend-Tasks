// 统一响应信封，与前端 request.js 约定保持一致：{ success, data?, message? }
function ok(res, data) {
  return res.status(200).json({ success: true, data })
}

function fail(res, status, message) {
  return res.status(status).json({ success: false, message })
}

module.exports = { ok, fail }

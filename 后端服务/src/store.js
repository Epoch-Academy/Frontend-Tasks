// 数据访问层：封装全部 SQL 查询，并把数据库的 snake_case 列名映射为前端使用的 camelCase 字段。
const { hashPassword } = require('./auth')

// 业务错误：由上层 handler 转成对应的 HTTP 状态码。
const ErrorCode = {
  NOT_FOUND: 'NOT_FOUND',
  SOLD_OUT: 'SOLD_OUT',
  DUPLICATE: 'DUPLICATE'
}

class StoreError extends Error {
  constructor(code) {
    super(code)
    this.name = 'StoreError'
    this.code = code
  }
}

function toClub(row) {
  return {
    id: row.id,
    name: row.name,
    category: row.category,
    intro: row.intro,
    members: Number(row.members),
    tags: decodeTags(row.tags),
    hot: Number(row.hot)
  }
}

function toActivity(row) {
  return {
    id: row.id,
    clubId: row.club_id,
    title: row.title,
    category: row.category,
    date: row.date,
    hot: Number(row.hot),
    remaining: Number(row.remaining),
    location: row.location,
    summary: row.summary,
    detail: row.detail
  }
}

function toRegistration(row) {
  const registration = {
    id: Number(row.id),
    activityId: row.activity_id
  }
  // 未登录报名时 user_id 为空，此时不输出 userId 字段，避免前端拿到 null。
  if (row.user_id !== null && row.user_id !== undefined) {
    registration.userId = Number(row.user_id)
  }
  registration.name = row.name
  registration.studentId = row.student_id
  registration.contact = row.contact
  registration.reason = row.reason
  registration.createdAt = row.created_at
  return registration
}

function toUser(row) {
  return { id: Number(row.id), username: row.username, nickname: row.nickname }
}

function decodeTags(raw) {
  try {
    const tags = JSON.parse(raw)
    return Array.isArray(tags) ? tags : []
  } catch {
    return []
  }
}

// 按关键词 / 分类拼装 WHERE 条件，返回条件片段与占位符参数。
function filterClauses(searchExpr, keyword, category) {
  const conds = []
  const args = []

  const trimmedKeyword = String(keyword ?? '').trim()
  if (trimmedKeyword) {
    conds.push(searchExpr)
    const like = `%${trimmedKeyword}%`
    args.push(like, like)
  }
  const trimmedCategory = String(category ?? '').trim()
  if (trimmedCategory && trimmedCategory !== '全部') {
    conds.push('category = ?')
    args.push(trimmedCategory)
  }
  return { conds, args }
}

function createStore(db) {
  const getClubStmt = db.prepare('SELECT * FROM clubs WHERE id = ?')
  const getActivityStmt = db.prepare('SELECT * FROM activities WHERE id = ?')

  // 按关键词、分类和排序查询社团。
  function listClubs(keyword, category, sortBy) {
    let query = 'SELECT id, name, category, intro, members, tags, hot FROM clubs'
    const { conds, args } = filterClauses('(name LIKE ? OR intro LIKE ?)', keyword, category)
    if (conds.length > 0) query += ` WHERE ${conds.join(' AND ')}`
    query += sortBy === 'members' ? ' ORDER BY members DESC' : ' ORDER BY hot DESC'
    return db.prepare(query).all(...args).map(toClub)
  }

  // 按 id 查询单个社团，不存在返回 null。
  function getClub(id) {
    const row = getClubStmt.get(id)
    return row ? toClub(row) : null
  }

  // 按关键词、分类和排序查询活动。
  function listActivities(keyword, category, sortBy) {
    let query = 'SELECT id, club_id, title, category, date, hot, remaining, location, summary, detail FROM activities'
    const { conds, args } = filterClauses('(title LIKE ? OR summary LIKE ?)', keyword, category)
    if (conds.length > 0) query += ` WHERE ${conds.join(' AND ')}`
    query += sortBy === 'hot' ? ' ORDER BY hot DESC' : ' ORDER BY date DESC'
    return db.prepare(query).all(...args).map(toActivity)
  }

  // 按 id 查询单个活动，不存在返回 null。
  function getActivity(id) {
    const row = getActivityStmt.get(id)
    return row ? toActivity(row) : null
  }

  // 报名：在一个事务里扣减名额并写入报名记录，避免并发超卖。
  // userId 为 null 表示未登录的匿名报名（第 7 周场景），登录后则记录归属用户（第 8 周个人中心用）。
  function register(activityId, userId, name, studentId, contact, reason) {
    db.exec('BEGIN')
    try {
      const row = db.prepare('SELECT COUNT(*) AS n FROM activities WHERE id = ?').get(activityId)
      if (!row || Number(row.n) === 0) throw new StoreError(ErrorCode.NOT_FOUND)

      const updated = db
        .prepare('UPDATE activities SET remaining = remaining - 1 WHERE id = ? AND remaining > 0')
        .run(activityId)
      if (updated.changes === 0) throw new StoreError(ErrorCode.SOLD_OUT)

      const inserted = db
        .prepare(
          `INSERT INTO registrations (activity_id, user_id, name, student_id, contact, reason, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?)`
        )
        .run(activityId, userId ?? null, name, studentId, contact, reason, new Date().toISOString())

      db.exec('COMMIT')
      return Number(inserted.lastInsertRowid)
    } catch (err) {
      db.exec('ROLLBACK')
      throw err
    }
  }

  // 查询某个用户的报名记录。
  function listRegistrationsByUser(userId) {
    return db
      .prepare(
        `SELECT id, activity_id, user_id, name, student_id, contact, reason, created_at
         FROM registrations WHERE user_id = ? ORDER BY id DESC`
      )
      .all(userId)
      .map(toRegistration)
  }

  // 注册新用户；用户名重复时抛 ErrDuplicate。
  function createUser(username, passwordHash, nickname) {
    try {
      const result = db
        .prepare('INSERT INTO users (username, password_hash, nickname, created_at) VALUES (?, ?, ?, ?)')
        .run(username, passwordHash, nickname, new Date().toISOString())
      return { id: Number(result.lastInsertRowid), username, nickname }
    } catch (err) {
      if (String(err.message).includes('UNIQUE')) throw new StoreError(ErrorCode.DUPLICATE)
      throw err
    }
  }

  // 返回用户信息和密码哈希，供登录校验使用；不存在返回 null。
  function getUserByUsername(username) {
    const row = db
      .prepare('SELECT id, username, nickname, password_hash FROM users WHERE username = ?')
      .get(username)
    return row ? { user: toUser(row), passwordHash: row.password_hash } : null
  }

  // 按 id 查询用户，不存在返回 null。
  function getUserByID(id) {
    const row = db.prepare('SELECT id, username, nickname FROM users WHERE id = ?').get(id)
    return row ? toUser(row) : null
  }

  // 首次启动时创建演示账号，方便直接联调。
  function ensureDefaultUser(username, password) {
    if (getUserByUsername(username)) return
    createUser(username, hashPassword(password), '演示用户')
  }

  return {
    listClubs,
    getClub,
    listActivities,
    getActivity,
    register,
    listRegistrationsByUser,
    createUser,
    getUserByUsername,
    getUserByID,
    ensureDefaultUser
  }
}

module.exports = { createStore, StoreError, ErrorCode }

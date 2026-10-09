// 数据库：使用 Node 内置的 node:sqlite（无需单独安装数据库、无原生依赖）。
// 打开（不存在则创建）文件、建表，并写入种子数据。
const { DatabaseSync } = require('node:sqlite')

const SCHEMA = [
  `CREATE TABLE IF NOT EXISTS users (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    username      TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    nickname      TEXT NOT NULL DEFAULT '',
    created_at    TEXT NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS clubs (
    id       TEXT PRIMARY KEY,
    name     TEXT NOT NULL,
    category TEXT NOT NULL,
    intro    TEXT NOT NULL,
    members  INTEGER NOT NULL DEFAULT 0,
    tags     TEXT NOT NULL DEFAULT '[]',
    hot      INTEGER NOT NULL DEFAULT 0
  )`,
  `CREATE TABLE IF NOT EXISTS activities (
    id        TEXT PRIMARY KEY,
    club_id   TEXT NOT NULL REFERENCES clubs(id),
    title     TEXT NOT NULL,
    category  TEXT NOT NULL,
    date      TEXT NOT NULL,
    hot       INTEGER NOT NULL DEFAULT 0,
    remaining INTEGER NOT NULL DEFAULT 0,
    location  TEXT NOT NULL DEFAULT '',
    summary   TEXT NOT NULL DEFAULT '',
    detail    TEXT NOT NULL DEFAULT ''
  )`,
  `CREATE TABLE IF NOT EXISTS registrations (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    activity_id TEXT NOT NULL REFERENCES activities(id),
    user_id     INTEGER REFERENCES users(id),
    name        TEXT NOT NULL,
    student_id  TEXT NOT NULL,
    contact     TEXT NOT NULL,
    reason      TEXT NOT NULL,
    created_at  TEXT NOT NULL
  )`,
  `CREATE INDEX IF NOT EXISTS idx_registrations_user ON registrations(user_id)`
]

const SEED_CLUBS = [
  { id: 'c1', name: '开源技术社', category: '科技', intro: '一起写代码、读源码、做开源项目，前端后端都能找到同好。', members: 128, tags: ['编程', '开源', '前端'], hot: 980 },
  { id: 'c2', name: '篮球联盟', category: '体育', intro: '每周固定训练与友谊赛，欢迎零基础同学一起上场。', members: 96, tags: ['球类', '团队', '训练'], hot: 870 },
  { id: 'c3', name: '话剧社', category: '文艺', intro: '从剧本围读到登台演出，感受表演与舞台的魅力。', members: 64, tags: ['表演', '舞台', '剧本'], hot: 720 },
  { id: 'c4', name: '青年志愿者协会', category: '公益', intro: '组织支教、环保、社区服务等志愿活动，用行动传递温度。', members: 210, tags: ['志愿', '公益', '支教'], hot: 650 },
  { id: 'c5', name: '数学建模协会', category: '学术', intro: '备战建模竞赛，分享算法、论文写作与团队协作经验。', members: 88, tags: ['建模', '竞赛', '算法'], hot: 610 },
  { id: 'c6', name: '摄影协会', category: '文艺', intro: '校园采风、人像约拍与后期分享，用镜头记录生活。', members: 75, tags: ['摄影', '创作', '后期'], hot: 540 },
  { id: 'c7', name: '辩论队', category: '学术', intro: '训练逻辑与表达，参加校内外辩论赛事。', members: 42, tags: ['思辨', '口才', '赛事'], hot: 500 },
  { id: 'c8', name: '跑步俱乐部', category: '体育', intro: '晨跑打卡、周末拉练，和伙伴一起养成运动习惯。', members: 150, tags: ['跑步', '健康', '打卡'], hot: 460 }
]

const SEED_ACTIVITIES = [
  { id: 'a1', clubId: 'c1', title: '前端工程实践分享会', category: '技术', date: '2026-09-06', hot: 189, remaining: 24, location: '教学楼 B201', summary: '围绕 Vue 工程化、请求封装和状态管理展开。', detail: '适合想系统理解 Vue 3 工程组织、接口对接与组件边界的同学。' },
  { id: 'a2', clubId: 'c6', title: '校园摄影采风日', category: '文艺', date: '2026-09-01', hot: 132, remaining: 0, location: '图书馆前广场', summary: '拍摄校园秋景并进行作品分享。', detail: '名额已满，可浏览活动详情，不开放报名。' },
  { id: 'a3', clubId: 'c4', title: '新生志愿服务培训', category: '公益', date: '2026-09-10', hot: 96, remaining: 18, location: '学生活动中心', summary: '介绍志愿服务流程、签到和协作规范。', detail: '完成培训后可参与后续校园志愿活动。' }
]

function openDatabase(path) {
  const db = new DatabaseSync(path)
  // 打开外键约束，保证 activities.club_id / registrations.user_id 的引用有效。
  db.exec('PRAGMA foreign_keys = ON')
  migrate(db)
  seed(db)
  return db
}

function migrate(db) {
  for (const statement of SCHEMA) {
    db.exec(statement)
  }
}

function seed(db) {
  const clubCount = db.prepare('SELECT COUNT(*) AS n FROM clubs').get().n
  if (Number(clubCount) === 0) seedClubs(db)

  const activityCount = db.prepare('SELECT COUNT(*) AS n FROM activities').get().n
  if (Number(activityCount) === 0) seedActivities(db)
}

function seedClubs(db) {
  const insert = db.prepare(
    'INSERT INTO clubs (id, name, category, intro, members, tags, hot) VALUES (?, ?, ?, ?, ?, ?, ?)'
  )
  for (const club of SEED_CLUBS) {
    insert.run(club.id, club.name, club.category, club.intro, club.members, JSON.stringify(club.tags), club.hot)
  }
}

function seedActivities(db) {
  const insert = db.prepare(
    `INSERT INTO activities (id, club_id, title, category, date, hot, remaining, location, summary, detail)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  )
  for (const activity of SEED_ACTIVITIES) {
    insert.run(
      activity.id, activity.clubId, activity.title, activity.category, activity.date,
      activity.hot, activity.remaining, activity.location, activity.summary, activity.detail
    )
  }
}

module.exports = { openDatabase }

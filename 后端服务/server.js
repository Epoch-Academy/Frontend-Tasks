// 服务入口：加载配置、打开数据库、创建演示账号、启动 HTTP 服务。
const config = require('./src/config')
const { openDatabase } = require('./src/db')
const { createStore } = require('./src/store')
const { createApp } = require('./src/app')

const db = openDatabase(config.dbPath)
const store = createStore(db)

// 首次启动时自动创建演示账号，方便直接联调。
store.ensureDefaultUser(config.defaultUsername, config.defaultPassword)

const app = createApp({ store, config })
const server = app.listen(config.port, () => {
  console.log(`校园社团招新平台后端已启动: http://localhost:${config.port}`)
  console.log(`演示账号: ${config.defaultUsername} / ${config.defaultPassword}`)
})

// 优雅退出：关闭监听与数据库连接。
function shutdown() {
  server.close(() => {
    db.close()
    process.exit(0)
  })
}

process.on('SIGINT', shutdown)
process.on('SIGTERM', shutdown)

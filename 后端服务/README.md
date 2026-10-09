# 校园社团招新平台 · 后端服务（Express + SQLite）

第 07、08 周主线项目 `campus-clubs` 配套的**真实后端**：提供**数据持久化**、**真实登录鉴权**和**名额事务扣减**，可直接替换前端开发期的临时接口方案（如本地 JSON / 前端硬编码数据）。

## 技术栈

- Node.js 22.5+（用到内置的 `node:sqlite` 模块）
- 框架：Express 5
- 数据库：SQLite（Node 内置 `node:sqlite`，**无需单独安装数据库 / 无原生依赖、无需编译**）
- 鉴权：JWT（`jsonwebtoken`）+ 密码哈希（`bcryptjs`）

## 运行

```bash
# 目录：后端服务/
npm install     # 首次运行安装依赖
npm start       # 启动服务（等价于 node server.js）
npm run dev     # 开发模式：文件变更自动重启
```

默认监听 `:3000`，与第 07 周示例 `vite.config.js` 的代理目标一致，因此**前端不需要改端口**。
首次启动会自动建表、写入种子数据，并创建演示账号：

```
演示账号：demo / demo123
```

如需自定义配置，复制 `.env.example` 为 `.env` 或直接设置环境变量（`PORT`、`DB_PATH`、`JWT_SECRET`、`TOKEN_TTL`、`DEFAULT_USERNAME`、`DEFAULT_PASSWORD`）。

> 小提示：`npm start` 里带了 `--disable-warning=ExperimentalWarning`，用来屏蔽 `node:sqlite` 的实验性特性提示；直接 `node server.js` 也能跑，只是会多一行警告。

## 接口一览

| 方法 | 路径 | 鉴权 | 说明 |
| --- | --- | --- | --- |
| GET | `/api/health` | 否 | 健康检查 |
| POST | `/api/auth/register` | 否 | 注册，返回 `{ token, user }` |
| POST | `/api/auth/login` | 否 | 登录，返回 `{ token, user }` |
| GET | `/api/auth/me` | **是** | 获取当前登录用户 |
| GET | `/api/clubs` | 否 | 社团列表，支持 `keyword` / `category` / `sortBy` |
| GET | `/api/clubs/:id` | 否 | 社团详情 |
| GET | `/api/activities` | 否 | 活动列表，支持 `keyword` / `category` / `sortBy` |
| GET | `/api/activities/:id` | 否 | 活动详情 |
| POST | `/api/registrations` | 可选 | 报名；带 token 则记录归属用户，不带按匿名处理 |
| GET | `/api/registrations/me` | **是** | 当前用户的报名记录（第 08 周个人中心用） |

响应结构统一为前端 `request.js` 约定的信封：

```json
{ "success": true, "data": { } }
{ "success": false, "message": "错误原因" }
```

鉴权方式：请求头 `Authorization: Bearer <token>`。

## 报名接口契约（第 07 / 08 周前端必须对齐）

`POST /api/registrations`，`Content-Type: application/json`。字段名固定为下面五个，第 07、08 周任务的「报名接口契约」与示例 `RegistrationForm.vue` 都以此为准。

| 字段 | 类型 | 必填 | 校验规则 |
| --- | --- | --- | --- |
| `activityId` | string | 是 | 来自 `GET /api/activities` 返回的活动 `id`，由前端选中活动后带入，不是用户手填 |
| `name` | string | 是 | `trim()` 后不能为空 |
| `studentId` | string | 是 | `trim()` 后不能为空 |
| `contact` | string | 是 | `trim()` 后不能为空（手机号或微信） |
| `reason` | string | 是 | `trim()` 后**按字符数不少于 10 个字** |

成功返回：

```json
{ "success": true, "data": { "registrationId": 1, "activityId": "act-001", "status": "submitted" } }
```

失败返回（`{ "success": false, "message": "..." }`）：

| 状态码 | 触发条件 | `message` |
| --- | --- | --- |
| 400 | `activityId` / `name` / `studentId` / `contact` 任一为空 | `请填写完整报名信息` |
| 400 | `reason` 少于 10 个字 | `参加理由至少 10 个字` |
| 404 | `activityId` 对应活动不存在 | `活动不存在` |
| 409 | 活动名额已满（`remaining` 为 0） | `名额已满` |
| 500 | 其他异常 | `报名失败，请稍后重试` |

注意 `reason` 的长度按字符计数（后端用 `[...reason].length`），所以中文按字算，不是按字节算。

## 目录结构

```
后端服务/
  server.js                       服务入口：加载配置、打开数据库、启动 HTTP
  src/
    config.js                     环境变量配置
    db.js                         SQLite 连接、建表、种子数据
    store.js                      全部查询（含报名事务扣减）
    auth.js                       bcrypt 密码哈希 + JWT 签发/校验
    app.js                        Express 应用装配与路由注册
    middleware.js                 CORS、requireAuth、optionalAuth
    respond.js                    统一响应信封
    routes/
      auth.js                     注册 / 登录 / 当前用户
      clubs.js                    社团列表 / 详情
      activities.js               活动列表 / 详情
      registrations.js            报名 / 我的报名
```

## 关键设计说明

- **报名用事务扣名额**：`UPDATE activities SET remaining = remaining - 1 WHERE id = ? AND remaining > 0`，受影响行数为 0 时返回 `409 名额已满`，避免并发超卖；
- **报名鉴权可选**：第 07 周的任务没有登录，所以未登录也能报名；第 08 周登录后同一个接口会自动记录 `user_id`；
- **密码不落明文**：`users.password_hash` 存 bcrypt 哈希；
- **字段命名转换**：数据库用 `snake_case` 列名，`store.js` 统一映射为前端使用的 `camelCase`（如 `club_id` → `clubId`）；
- **换数据库**：SQL 都集中在 `store.js` 与 `db.js`，换成 MySQL / PostgreSQL 只需替换驱动与建表语句。

## 与前端的关系

- 第 07、08 周示例 `vite.config.js` 把 `/api` 代理到 `http://localhost:3000`，运行本服务即可直接对接；
- 前端 `src/api/request.js` 已支持自动携带 `Authorization` 头并在 `401` 时清理登录态；
- 第 08 周登录请调用 `POST /api/auth/login`，并把返回的 `token` 存入 `localStorage`（键名 `campus-clubs-token`），`useAuth` Composable 已按此约定准备好。

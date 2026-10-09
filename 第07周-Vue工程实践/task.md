# 第 7 周任务：社团招新平台 v0.3 —— 对接接口与报名

> 本周继续在主线项目 `campus-clubs` 上迭代。把 v0.2 的本地数据换成接口数据，建立统一 API 层，补齐请求状态与报名表单，并新增「社团活动」模块。

## 上周回顾（v0.2）

你现在应该已经有一个组件化的项目：

- `AppHeader` / `ClubFilter` / `ClubList` / `ClubCard` / `BaseModal` / `EmptyState` 等职责清晰的组件；
- 父组件持有状态，Props 向下、Emit 向上；
- 详情弹窗可打开、`Esc` 可关闭，副作用已清理；
- 收藏逻辑已抽到 `useFavorites` Composable。

本周在这个基础上把数据来源换成接口。

## 任务目标

在主线项目中接入接口数据，掌握前后端对接、请求封装、请求状态管理和表单提交错误处理，并新增「社团活动 + 报名」。

> 说明：本周仍为单视图应用，**不要求使用 Vue Router**；多视图拆分放在第 8 周。
>
> 接口服务使用仓库根目录的 `后端服务/`（Express + SQLite **真实后端**，带登录鉴权与数据持久化）：`cd 后端服务 && npm install && npm start`。它监听 `localhost:3000`，与示例 `vite.config.js` 的代理目标一致，前端代码无需改动即可对接。

## 指引

重点关注以下内容：

- 如何阅读接口文档并把接口字段映射到页面状态；
- 在 Vue 中使用 `fetch` 和 `async/await` 完成真实请求；
- 区分请求地址、`query`、`params`、`body` 和请求头；
- 加载、成功、空数据和失败状态的界面处理；
- 表单字段与接口契约一一对应，前端校验规则与后端保持一致；
- 表单双向绑定、校验、提交中状态与防重复提交；
- 将请求封装到统一的 API 模块中，避免在组件里重复拼接地址；
- `provide` / `inject` 的基础使用场景；
- 环境变量、项目目录、开发代理和资源组织。

## 本轮要求（主线项目增量）

1. 新建 `src/api/request.js`：统一基础路径、响应解析，以及非 2xx 状态码和业务错误的处理（**超时处理是选做**，见下文「请求超时（选做）」）。
2. 新建 `src/api/club.js`、`src/api/activity.js`，封装以下接口：
   - `GET /api/clubs`：社团列表，支持 `keyword`、`category`、`sortBy`；
   - `GET /api/clubs/:id`：社团详情；
   - `GET /api/activities`：活动列表；
   - `POST /api/registrations`：提交报名。
3. 把 v0.2 的社团列表改为通过接口获取（启动仓库根目录的 `后端服务/` 即可）；原 `src/data/clubs.js` 可保留作为降级 / 开发备用，但页面以接口数据为准。
4. 新建异步 Composable（如 `useClubs`、`useActivities`），统一管理 `loading` / `data` / `error` 和重新加载方法；v0.2 的 `useFavorites` 继续复用。
5. 列表页必须处理**四种状态**：加载中、加载成功、空数据、加载失败（失败提供重试按钮）。
6. 新增「活动列表 / 活动卡片」：展示活动所属社团、时间、分类、剩余名额等，支持关键词搜索、分类筛选和排序。
7. 报名表单：**字段名、取值来源和校验规则必须与下面的接口契约一致**，不能自己另起字段名。
8. 提交时显示「提交中」状态并禁用按钮，防止重复提交；根据接口返回给出明确的成功 / 失败反馈（失败要按接口返回的原因分别提示），剩余名额为 0 时不允许提交，并提示「名额已满」。
9. 使用 `provide` / `inject` 提供一个适合跨层级使用的全局配置（**二选一即可：全局消息方法或主题名**），并在组件中实际使用一次。
10. 将接口基础路径放入 Vite 环境变量，不在组件里重复硬编码；开发时使用 Vite 代理解决跨域：
    - 在项目根目录新建 `.env.example` 并复制一份改名为 `.env`（`.env` 不入库），两个变量：`VITE_API_BASE_URL=/api`（配合代理，写相对路径即可）与 `VITE_API_TIMEOUT=8000`；
    - 用 `import.meta.env.VITE_API_BASE_URL` 读取，并保留一份兜底默认值，这样**即使没建 `.env` 也能跑**；
    - `vite.config.js` 里把 `/api` 代理到 `http://localhost:3000`（与 `后端服务/` 的端口一致）；
    - 注意：`VITE_` 开头的变量会被打包进前端代码，**不能存放真正的密钥**。
11. 复用 v0.2 的组件（卡片、弹窗、空状态）与 `useFavorites`：收藏、筛选、详情弹窗继续可用，数据源改为接口数据。
12. 在 `README.md` 中增加：接口说明、请求状态设计、目录结构、环境变量与代理配置、已知限制。

## 本周要用到的接口清单

完整定义与错误码见[后端服务说明](../后端服务/README.md)。**前四行是本周必做**；表格最后三行不是必做（`/api/health` 建议试一次，另外两个第 8 周才会用到，现在知道它们存在即可）：

| 方法 | 路径 | 本周用途 |
| --- | --- | --- |
| GET | `/api/clubs` | 社团列表，支持 `keyword` / `category` / `sortBy` |
| GET | `/api/clubs/:id` | 社团详情（详情弹窗也可以直接用列表里已有的数据） |
| GET | `/api/activities` | 活动列表，字段：`id`、`clubId`、`title`、`category`、`date`、`hot`、`remaining`、`location`、`summary`、`detail` |
| POST | `/api/registrations` | 提交报名（契约见下一节） |
| GET | `/api/health` | 健康检查，用来确认后端是否已启动（浏览器直接打开 `http://localhost:3000/api/health` 即可），**建议现在就试一次**，能返回 JSON 说明后端起来了 |
| GET | `/api/activities/:id` | 活动详情，按需使用，不是必做 |
| POST | `/api/auth/login`、`GET /api/auth/me` | 第 8 周登录用，本周可以先不看 |

演示账号：`demo / demo123`（第 8 周登录用；本周的报名接口**不要求登录**）。

## 报名接口契约（必须对齐）

**请求**：`POST /api/registrations`，请求头 `Content-Type: application/json`。

`activityId` 不是表单里让用户手填的字段，而是**用户当前选中的活动的 `id`**：活动数据来自 `GET /api/activities`（字段 `id`、`clubId`、`title`、`category`、`date`、`hot`、`remaining`、`location`、`summary`、`detail`），点击某个活动后把它选中的 `activity.id` 一起提交。未选中活动时应禁用提交按钮。

| 请求体字段 | 含义 | 前端控件 | 校验规则 |
| --- | --- | --- | --- |
| `activityId` | 报名的活动 id | 无控件，取当前选中活动的 `id` | 必填，必须来自活动列表 |
| `name` | 姓名 | 单行文本 | 去掉首尾空格后不能为空 |
| `studentId` | 学号 | 单行文本 | 去掉首尾空格后不能为空 |
| `contact` | 联系方式 | 单行文本（手机号或微信） | 去掉首尾空格后不能为空 |
| `reason` | 参加理由 | 多行文本 `textarea` | 去掉首尾空格后**不少于 10 个字** |

**响应信封**（与 `src/api/request.js` 的约定一致）：

```json
// 成功 200
{ "success": true, "data": { "registrationId": 1, "activityId": "act-001", "status": "submitted" } }
// 失败（HTTP 400 / 404 / 409）
{ "success": false, "message": "错误原因" }
```

**必须分别处理的失败情况**（提示文案可直接用接口返回的 `message`）：

| 状态码 | 触发条件 | 页面应有的反馈 |
| --- | --- | --- |
| 400 | `activityId` / `name` / `studentId` / `contact` 任一为空，或 `reason` 少于 10 个字 | 提示「请填写完整报名信息」或「参加理由至少 10 个字」，停留在表单 |
| 404 | `activityId` 对应的活动不存在 | 提示「活动不存在」，并提供重新加载活动列表的入口 |
| 409 | 活动 `remaining` 已为 0（名额被抢完） | 提示「名额已满」，禁用提交按钮并刷新活动列表 |
| 其他 / 网络失败 | 服务未启动、代理未配置等 | 提示「报名失败，请稍后重试」或「无法连接服务器」，不白屏、可重试 |

前端校验只是拦在提交之前的第一道关，**后端校验依然要处理**：即使前端校验通过，也要按上表处理接口返回的失败，不能用「前端已校验」为由吞掉错误。

**联调方式**：先启动仓库根目录的 `后端服务/`（`cd 后端服务 && npm install && npm start`，监听 `localhost:3000`，首次启动自动建库并生成演示账号 `demo / demo123`），再启动前端。示例 `vite.config.js` 已把 `/api` 代理到 `http://localhost:3000`，前端不需要改端口。

## 请求超时（选做）

超时不是本周的必做项，但它正好用得上第 4 周学的 `Promise`：`fetch` **没有**内置超时，请求会一直挂着，所以用 `AbortController` 主动掐断。核心写法只有四行：

```js
const controller = new AbortController()
const timer = setTimeout(() => controller.abort(), 8000) // 8 秒未响应就中止
try {
  const response = await fetch(url, { ...options, signal: controller.signal })
  return await parseResponse(response)
} finally {
  clearTimeout(timer) // 无论成功失败都要清掉定时器，否则会留下悬挂的计时器
}
```

配套要点：

- 中止后 `fetch` 抛出的是 `AbortError`（`error.name === 'AbortError'`），要在 `catch` 里和网络失败区分开，给出「请求超时，请重试」这类提示；
- 超时时间建议放在环境变量或常量里（如 `VITE_API_TIMEOUT`），不要散落在各处；
- 自测办法：临时把超时改成 `1` 毫秒，或在 Network 面板把请求限速成 Slow 3G，确认页面给出超时提示、且不白屏、重试按钮可用。

## 完成标准

- 项目能够安装、启动和构建；
- 社团与活动数据均通过接口获取，组件里不直接散写 `fetch` 地址；
- 搜索、筛选、排序可以组合使用，结果正确；
- 请求慢、数据为空或请求失败时均有对应界面，不会只显示空白；
- 表单校验、名额判断、防重复提交和结果反馈有效；
- 报名表单提交的请求体字段名与「报名接口契约」完全一致（`activityId`、`name`、`studentId`、`contact`、`reason`），参加的 `activityId` 取自当前选中活动；
- 400（字段不全 / 理由不足 10 字）、404（活动不存在）、409（名额已满）都有对应的界面提示，不是统一弹一句「提交失败」；
- 收藏、详情弹窗等 v0.2 已有功能仍然可用；
- `provide` / `inject`、环境变量（`.env` 中的 `VITE_API_BASE_URL`，代码里仍有兜底默认值）和代理配置按要求落地；
- 能现场说明请求状态如何流转、为什么需要请求封装，以及 `query`、`params`、`body`、`proxy` 和 `env` 的作用。

## 为下周做准备

第 8 周会引入 Vue Router，把当前的单页拆成多视图 SPA，并加上登录与个人中心。请确保 API 层和 `useFavorites` 已收敛、组件可复用，方便下周直接搬进各个页面。

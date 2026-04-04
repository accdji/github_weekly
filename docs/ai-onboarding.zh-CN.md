# 产品手册

[English Version](./ai-onboarding.md)

这个文档对应产品里的 `/{locale}/ai` 页面。为了兼容旧链接，路由暂时还保留 `ai`，但页面定位已经改成“产品手册”，不再只是 AI 工具箱。

## 手册包含什么

- 本地 CLI 接入方式
- 适合哪些角色以及各自的使用场景
- 数据更新节奏与新鲜度预期
- 订阅入口和当前能力边界
- 常见问题排查方法
- 支持的导出格式
- 关键 HTTP 接口与建议先读的代码文件

## 适合谁用

- 开发者 / 研究者
  用来发现上升中的仓库、查看趋势并快速导出榜单。
- 内容 / 社区运营
  用来跟踪热点仓库、整理精选集合、输出周报素材。
- 内部工具 / AI Agent
  用来消费结构化 JSON、仓库档案和稳定的 API 载荷。

## 快速开始

1. 运行 `npm run ai:context`
2. 阅读 `docs/architecture.zh-CN.md`
3. 如果数据刚更新，先运行 `npm run collect:daily` 和 `npm run build:weekly`
4. 如果集合内容更新过，再运行 `npm run collections:sync`
5. 如果代码结构有明显变化，运行 `npm run gitnexus:analyze`

## CLI 接入

环境准备：

1. 运行 `npm install`
2. 运行 `npm run prisma:generate`
3. 运行 `npm run db:push`
4. 如果需要认证 GitHub 请求，在 `.env` 中配置 `GH_TOKEN`

核心命令：

- `npm run collect:daily`
  刷新候选仓库并写入最新快照。
- `npm run sync:stars`
  在 GitHub 配额允许时回填 Star 历史。
- `npm run build:weekly`
  根据最新快照重建周榜。
- `npm run collections:sync`
  重建数据库中的 Collections 和摘要卡片。
- `npm run pipeline:run`
  执行完整的后端采集流水线。
- `npm run ai:context`
  输出机器可读的产品手册 JSON。
- `npm run ai:report`
  输出 Markdown 周报。
- `npm run ai:repo -- owner/name`
  输出单个仓库的 JSON 档案。

## 数据更新与新鲜度

- 前端页面本身是只读的
  Dashboard、Collections 和产品手册不会自己触发采集。
- 仓库快照的新鲜度取决于后端任务
  需要通过 `npm run collect:daily` 或后端流水线刷新仓库数据。
- Collection 的新鲜度需要第二步同步
  仓库采集之后，还要运行 `npm run collections:sync`，集合卡片和摘要才会跟上。
- 周 Star 可能是 partial
  当可比较快照还不足时，系统会用 best-effort 口径，并显示类似 `1d partial` 的覆盖说明。

## 如何订阅

当前版本已经支持把订阅关系持久化到后端：

- 在 Collection 详情页订阅
  打开某个 Collection 详情页，提交订阅表单即可。
- 在订阅中心查看
  访问 `/{locale}/subscriptions` 查看已经保存的 Collection 订阅和关键词提醒。
- 通过 API 创建
  调用 `POST /api/subscriptions`，传入 `collectionId` 或 `keywords` 即可。

请求示例：

```json
{
  "email": "ops@example.com",
  "locale": "zh-CN",
  "channel": "email",
  "subscriptionType": "collection",
  "digestFrequency": "weekly",
  "collectionId": "{{collectionId}}"
}
```

当前能力边界：

- 现在已经能保存订阅意图和关注关系
- 站外实际投递任务还属于后续后端建设阶段

## 遇到问题如何解决

- 今日 Star 和本周 Star 看起来一样
  重新运行 `npm run collect:daily`，然后刷新页面。现在系统按“今天 00:00”计算今日，按最多 7 天 best-effort 计算本周。
- 本周 Star 显示 partial
  这是正常现象，说明当前可比较快照还不足 7 天。页面和上下文 JSON 会明确标注覆盖天数。
- Collections 看起来还是旧数据
  在仓库采集之后再运行一次 `npm run collections:sync`。
- 订阅已经创建，但没有收到消息
  当前版本先保证订阅关系入库，真正的外发投递任务还在后续建设里。
- GitNexus 提示图数据库过期或被锁
  运行 `npm run gitnexus:analyze`。如果本地锁还在，先结束冲突进程，再重新执行。

## 导出格式

- CSV
  导出当前 Dashboard 过滤后的仓库列表，适合表格分析。
- JSON
  导出结构化 Dashboard 数据、产品手册上下文或仓库档案。
- Markdown
  导出周报，适合内容发布、周会同步和团队摘要。

## 导出字段说明

- `fullName`
  仓库的 `owner/name` 标识，Dashboard、导出和档案都会用到。
- `weeklyStars`
  最近一段周窗口内的 best-effort Star 增长，最大按 7 天计算。
- `todayStars`
  从本地当天 00:00 开始累计的 Star 增长。
- `stars`
  最新仓库快照里的总 Star 数。
- `historyCoverageDays`
  当前用于计算周 Star 的可比较历史覆盖天数。

## 当前能力边界

- 现在已经能保存订阅意图，但真正的站外投递仍是后续后端建设阶段。
- PR、Issue、Contributor 的集合趋势虽然已经预留了模型，但还没有完全接通真实数据。
- 周 Star 在可比较快照不足时会持续显示 partial。
- 页面路由仍保留 `/{locale}/ai`，只是语义已经改成产品手册。

## HTTP 接口

- `GET /api/ai/context`
  产品手册上下文 JSON。
- `GET /api/report`
  Markdown 周报。
- `GET /api/dashboard`
  首页 Dashboard 数据。
- `GET /api/collections`
  Collections 展馆数据。
- `GET /api/collections/{slug}`
  Collection 详情数据。
- `POST /api/subscriptions`
  创建 Collection 订阅或关键词订阅。

## 建议先读的文件

- `lib/dashboard.ts`
- `lib/ranking.ts`
- `lib/collections.ts`
- `lib/subscriptions.ts`
- `lib/ai-toolkit.ts`
- `components/dashboard-app.tsx`
- `components/collection-subscribe-form.tsx`
- `app/[locale]/ai/page.tsx`
- `app/[locale]/subscriptions/page.tsx`
- `prisma/schema.prisma`

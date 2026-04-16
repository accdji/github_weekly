# 功能清单

[English Version](./feature-checklist.md)

更新日期：2026-04-16

这份清单已经改成验收记录格式。每一项都会保留功能名，并写明已经落地的内容和主要对应文件，方便逐项检查。

## 核心产品

- [x] 双语 Dashboard 路由
  已完成：按 locale 渲染页面，并通过字典驱动中英文内容。
  对应文件：`app/[locale]/page.tsx`、`lib/i18n.ts`
- [x] 周榜数据流水线
  已完成：仓库采集、快照生成、周榜构建脚本已经接通。
  对应文件：`scripts/collect-daily.ts`、`scripts/build-weekly.ts`、`lib/dashboard.ts`
- [x] Dashboard API
  已完成：提供排行数据读取接口。
  对应文件：`app/api/dashboard/route.ts`、`lib/dashboard.ts`
- [x] Archive 页面
  已完成：历史榜单浏览页与对应 API。
  对应文件：`app/[locale]/archive/page.tsx`、`app/api/archive/route.ts`
- [x] Jobs 页面
  已完成：展示采集任务和 worker 执行记录。
  对应文件：`app/[locale]/jobs/page.tsx`、`app/api/jobs/route.ts`、`lib/workers.ts`
- [x] Methodology 页面
  已完成：方法论页面已接入双语路由。
  对应文件：`app/[locale]/methodology/page.tsx`
- [x] 产品手册页面
  已完成：产品手册改为通过 AI context 生成双语内容。
  对应文件：`app/[locale]/ai/page.tsx`、`lib/ai-toolkit.ts`、`docs/ai-onboarding.md`、`docs/ai-onboarding.zh-CN.md`
- [x] 仓库详情页
  已完成：仓库趋势详情页与对应 API 已打通。
  对应文件：`app/[locale]/repo/[owner]/[name]/page.tsx`、`app/api/repositories/[owner]/[name]/route.ts`

## Collections

- [x] Collections 索引页
  已完成：集合首页已支持多分区浏览。
  对应文件：`app/[locale]/collections/page.tsx`、`lib/collections.ts`
- [x] Collection 详情页
  已完成：详情页包含趋势、仓库列表和元信息模块。
  对应文件：`app/[locale]/collections/[slug]/page.tsx`、`lib/collections.ts`
- [x] Featured Collections 区块
  已完成：返回并展示精选集合。
  对应文件：`app/[locale]/collections/page.tsx`、`lib/collections.ts`
- [x] Tag Browse 区块
  已完成：支持按标签浏览集合。
  对应文件：`app/[locale]/collections/page.tsx`、`lib/collections.ts`
- [x] Recently Updated 区块
  已完成：支持按最近更新浏览集合。
  对应文件：`app/[locale]/collections/page.tsx`、`lib/collections.ts`
- [x] Popular Collections 区块
  已完成：支持按热度浏览集合。
  对应文件：`app/[locale]/collections/page.tsx`、`lib/collections.ts`
- [x] 集合卡片 Top Repository 预览
  已完成：集合卡片会展示代表性仓库预览。
  对应文件：`app/[locale]/collections/page.tsx`、`lib/collections.ts`
- [x] Collection 趋势图
  已完成：使用集合历史快照生成趋势图。
  对应文件：`app/[locale]/collections/[slug]/page.tsx`、`lib/collections.ts`
- [x] Related Collections 区块
  已完成：根据标签和主题关联推荐相近集合。
  对应文件：`app/[locale]/collections/[slug]/page.tsx`、`lib/collections.ts`
- [x] Collection 方法说明
  已完成：详情页已加入方法说明文字。
  对应文件：`app/[locale]/collections/[slug]/page.tsx`
- [x] 更强的封面与画廊式展示
  已完成：集合封面、视觉层次和展示方式已增强。
  对应文件：`app/[locale]/collections/page.tsx`、`app/[locale]/collections/[slug]/page.tsx`
- [x] Archive 风格浏览模式
  已完成：支持按年份和时间维度浏览集合。
  对应文件：`app/[locale]/collections/page.tsx`、`lib/collections.ts`
- [x] 公开提交新集合流程
  已完成：公开提交流程和后端提交接口已落地。
  对应文件：`app/[locale]/collections/submit/page.tsx`、`app/api/collections/submissions/route.ts`
- [x] 多年连续历史浏览
  已完成：集合多年份趋势快照和叠加浏览已支持。
  对应文件：`lib/collections.ts`、`prisma/schema.prisma`
- [x] 更丰富的策展工作流
  已完成：审核工作台、编辑分配、审批与状态更新已落地。
  对应文件：`app/[locale]/collections/review/page.tsx`、`app/api/collections/submissions/[id]/route.ts`、`lib/collections.ts`

## 订阅

- [x] Subscription 数据模型
  已完成：Prisma 中已包含 subscription、subscriber、delivery job、delivery log、worker run 等模型。
  对应文件：`prisma/schema.prisma`、`prisma/schema.postgres.prisma`
- [x] `POST /api/subscriptions`
  已完成：支持创建集合、仓库、关键词订阅。
  对应文件：`app/api/subscriptions/route.ts`、`lib/subscriptions.ts`
- [x] Collection 订阅表单
  已完成：集合详情页可直接提交订阅。
  对应文件：`components/collection-subscribe-form.tsx`、`app/[locale]/collections/[slug]/page.tsx`
- [x] Subscription Center 页面
  已完成：订阅中心已接后端真实数据，并展示日志和管理动作。
  对应文件：`app/[locale]/subscriptions/page.tsx`、`app/api/subscriptions/route.ts`、`lib/subscriptions.ts`
- [x] 关键词提醒持久化
  已完成：关键词规则会持久化并用于后续 digest 生成。
  对应文件：`lib/subscriptions.ts`、`prisma/schema.prisma`
- [x] Collection Follow 持久化
  已完成：集合 follow 已作为订阅记录持久化。
  对应文件：`lib/subscriptions.ts`、`components/collection-subscribe-form.tsx`
- [x] Digest 实际投递
  已完成：worker 会处理投递任务，并支持 Resend 邮件和 webhook 投递。
  对应文件：`lib/subscriptions.ts`、`scripts/run-subscription-worker.ts`、`app/api/workers/subscriptions/route.ts`
- [x] Delivery Jobs 与 Delivery Logs
  已完成：投递队列、状态流转和日志都已落库。
  对应文件：`lib/subscriptions.ts`、`prisma/schema.prisma`
- [x] Subscriber 身份体系
  已完成：subscriber、验证 token、管理 token 已落地。
  对应文件：`lib/subscriptions.ts`、`prisma/schema.prisma`
- [x] 退订与管理动作
  已完成：启停、频率更新、退订接口都已接通。
  对应文件：`app/api/subscriptions/route.ts`、`lib/subscriptions.ts`
- [x] 渠道验证
  已完成：subscriber 验证 token 和 verify 接口已落地。
  对应文件：`app/api/subscriptions/verify/route.ts`、`lib/subscriptions.ts`
- [x] 国内通知渠道集成
  已完成：支持通用 webhook、企业微信 webhook、飞书 webhook。
  对应文件：`lib/subscriptions.ts`、`docs/subscription-domestic-platform.md`、`docs/subscription-domestic-platform.zh-CN.md`
- [x] 仓库级订阅
  已完成：仓库详情页可直接创建仓库 follow 订阅。
  对应文件：`app/[locale]/repo/[owner]/[name]/page.tsx`、`app/api/subscriptions/route.ts`、`lib/subscriptions.ts`
- [x] 专用订阅 Worker
  已完成：提供专门的订阅 worker CLI 和 API 路径来调度与处理 digest。
  对应文件：`scripts/run-subscription-worker.ts`、`app/api/workers/subscriptions/route.ts`、`lib/workers.ts`

## 指标与数据覆盖

- [x] 基于 Stars 的集合指标
  已完成：集合聚合指标已经基于仓库 star 趋势生成。
  对应文件：`lib/collections.ts`、`lib/dashboard.ts`
- [x] Collection UI 中的 PR / Issue / Contributor 字段
  已完成：集合详情页已展示这些后端活动字段。
  对应文件：`app/[locale]/collections/[slug]/page.tsx`、`lib/collections.ts`
- [x] 产品手册中的周 Star 覆盖说明
  已完成：产品手册说明了周 star 指标的解释方式与边界。
  对应文件：`docs/ai-onboarding.md`、`docs/ai-onboarding.zh-CN.md`、`app/[locale]/ai/page.tsx`
- [x] PR 趋势补全
  已完成：集合趋势快照已补全 PR 数据。
  对应文件：`lib/collections.ts`
- [x] Issue 趋势补全
  已完成：集合趋势快照已补全 Issue 数据。
  对应文件：`lib/collections.ts`
- [x] Contributor 趋势补全
  已完成：集合趋势快照已补全 Contributor 数据。
  对应文件：`lib/collections.ts`

## 运维与平台

- [x] SQLite 本地环境
  已完成：本地开发 schema 与环境模板已可直接使用。
  对应文件：`prisma/schema.prisma`、`.env.example`
- [x] PostgreSQL 生产 Schema
  已完成：生产环境 Prisma schema 与环境模板已准备好。
  对应文件：`prisma/schema.postgres.prisma`、`.env.production.example`
- [x] GitHub Actions 定时流水线
  已完成：定时工作流已负责采集、排行和同步任务。
  对应文件：`.github/workflows/trend-pipeline.yml`
- [x] Render 部署配置
  已完成：部署说明和生产构建配置已经补齐。
  对应文件：`docs/deployment.md`、`docs/deployment.zh-CN.md`、`vercel.json`
- [x] GitNexus 分析脚本
  已完成：仓库已提供 GitNexus analyze 脚本。
  对应文件：`package.json`
- [x] 独立 Worker 执行模型
  已完成：worker run 记录和独立订阅 worker 执行链路已落地。
  对应文件：`lib/workers.ts`、`scripts/run-subscription-worker.ts`、`app/api/workers/subscriptions/route.ts`
- [x] 社区编辑 / 审核系统
  已完成：集合提交审核、编辑分配、审批和备注能力都已落地。
  对应文件：`app/[locale]/collections/review/page.tsx`、`app/api/collections/submissions/[id]/route.ts`、`prisma/schema.prisma`

## 备注

- 完成后的实际验证：`npm run worker:subscriptions`、`npm run build`
- 当前清单文件位置：`docs/feature-checklist.md`、`docs/feature-checklist.zh-CN.md`
- 订阅系统现在已经包含 subscriber、验证 token、管理动作、delivery jobs/logs、worker 执行、仓库 follow、邮件投递和 webhook 渠道。

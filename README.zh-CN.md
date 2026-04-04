# 开源趋势情报台

[English README](./README.md)

开源趋势情报台是一个双语 GitHub 趋势产品，用来发现快速上升的开源仓库，并通过排行榜、精选集合、历史归档、订阅中心和后端任务体系来组织这些信号。

## 当前阶段变化

- 前端页面已经移除了“立即爬取”能力。
- `Collections` 已经升级为正式产品页面，不再只是临时专题分组。
- 仓库采集、排行构建、集合同步统一由后端任务负责。
- 仓库发现链已经开始写入 `IngestionJob / IngestionTask / IngestionBatch / RawGitHubRepository`，作为 ODS 基础层。
- `Collection` 订阅已经有后端模型、详情页入口和订阅中心页面。
- `/{locale}/ai` 页面现在定位为“产品手册”，集中说明 CLI、订阅、导出和常见问题。

## 产品范围

- 持续跟踪仓库快照、Star 历史、周榜与精选集合
- 提供仪表盘、集合详情页、历史归档页、任务中心、订阅中心和产品手册
- 采集与聚合全部交给后端任务，不再依赖浏览器触发
- 为 `stars / PR / issues / contributors` 的年内趋势预留能力

## 技术栈

- Next.js 15
- TypeScript
- Prisma
- SQLite 作为本地 MVP 数据库，生产环境建议 PostgreSQL

## 快速开始

1. 执行 `npm install`
2. 将 `.env.example` 复制为 `.env`
3. 如需使用 GitHub 认证请求，请填写 `GH_TOKEN`
4. 执行 `npm run prisma:generate`
5. 执行 `npm run db:push`
6. 执行 `npm run collect:daily`
7. 执行 `npm run build:weekly`
8. 执行 `npm run collections:sync`
9. 执行 `npm run dev`

## 核心脚本

- `npm run collect:daily`：抓取候选仓库并写入最新快照
- `npm run sync:stars`：回填已跟踪仓库的 Star 历史
- `npm run build:weekly`：生成最新一周的排行榜
- `npm run collections:sync`：同步数据库中的精选集合
- `npm run pipeline:run`：执行带 ingestion job 与 raw batch 追踪的后端流水线
- `npm run ai:context`：输出产品手册 JSON 上下文
- `npm run ai:report`：输出最新 Markdown 周报
- `npm run ai:repo -- owner/name`：输出单个仓库的产品档案
- `npm run env:check:prod`：检查生产环境变量是否完整且格式正确
- `npm run prisma:generate:prod`：为生产 PostgreSQL 环境生成 Prisma Client
- `npm run db:push:prod`：将生产 PostgreSQL schema 推到数据库
- `npm run build:prod`：按生产 PostgreSQL 配置执行构建
- `npm run gitnexus:analyze`：刷新 GitNexus 图数据库索引

## 后端任务说明

- 页面本身不再触发采集。
- 采集和聚合请通过脚本、GitHub Actions、cron 或内部任务执行器运行。
- [`.github/workflows/trend-pipeline.yml`](./.github/workflows/trend-pipeline.yml) 现在会每天自动在后端执行 pipeline 和 collections 同步。
- 生产环境推荐使用 [`.env.production.example`](./.env.production.example) 作为环境变量模板。

## Collections

- 页面路由：`/{locale}/collections`
- 详情路由：`/{locale}/collections/{slug}`
- API：`GET /api/collections`
- 详情 API：`GET /api/collections/{slug}`
- 订阅中心：`/{locale}/subscriptions`
- 订阅 API：`POST /api/subscriptions`

Collections 已作为正式数据库实体存在，可以通过 `npm run collections:sync` 初始化和刷新。

## 产品手册

- 页面路由：`/{locale}/ai`
- 页面定位：产品手册
- 手册内容：CLI 接入、订阅方式、导出格式、常见问题、关键接口
- JSON 接口：`GET /api/ai/context`

## 文档

- 产品文档：[English](./docs/product.md) | [中文](./docs/product.zh-CN.md)
- 架构文档：[English](./docs/architecture.md) | [中文](./docs/architecture.zh-CN.md)
- Collections 架构记录：[中文](./docs/collections-architecture-plan.zh-CN.md)
- Collections 前端缺口记录：[中文](./docs/frontend-collections-gap.zh-CN.md)
- 后端采集分层改造方案：[中文](./docs/backend-ingestion-layered-architecture.zh-CN.md)
- 数据库设计说明：[中文](./docs/database-design.zh-CN.md)
- 部署方案说明：[中文](./docs/deployment.zh-CN.md)
- 国内平台订阅实现方案：[中文](./docs/subscription-domestic-platform.zh-CN.md)
- 产品手册：[English](./docs/ai-onboarding.md) | [中文](./docs/ai-onboarding.zh-CN.md)

## GitNexus

代码结构发生较大变化后，请刷新图数据库：

```bash
npm run gitnexus:analyze
```

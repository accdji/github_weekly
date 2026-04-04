# 开源趋势情报台

[English README](./README.md)

开源趋势情报台是一个双语 GitHub 趋势产品，用来发现快速上升的开源仓库，并通过排行榜、精选集合、历史归档、订阅中心和后端任务体系组织这些信号。

## 项目概览

- 产品页面：仪表盘、Collections、历史归档、任务中心、订阅中心、产品手册
- 数据流：后端任务负责采集和聚合，前端页面只读数据库
- 本地数据库：SQLite
- 生产数据库：PostgreSQL

## 线上状态

- 线上地址：`https://github-weekly.onrender.com`
- 托管平台：Render Free Web Service
- 生产数据库：Neon PostgreSQL
- 定时更新：GitHub Actions `Trend Pipeline`
- 最近一次已验证成功的运行：2026-04-04 23:47 至 23:49，中国标准时间，触发方式为 `workflow_dispatch`
- 定时执行时间：每天中国标准时间 `09:00`，即 `01:00 UTC`

## 本地启动

1. 执行 `npm install`
2. 将 `.env.example` 复制为 `.env`
3. 按需填写 `GH_TOKEN`
4. 执行 `npm run prisma:generate`
5. 执行 `npm run db:push`
6. 执行 `npm run collect:daily`
7. 执行 `npm run build:weekly`
8. 执行 `npm run collections:sync`
9. 执行 `npm run dev`

## 核心脚本

- `npm run collect:daily`：抓取候选仓库并写入最新快照
- `npm run sync:stars`：回填已跟踪仓库的 Star 历史
- `npm run build:weekly`：生成最新周榜
- `npm run collections:sync`：初始化或刷新精选集合
- `npm run pipeline:run`：执行后端采集流水线
- `npm run ai:context`：输出产品手册 JSON 上下文
- `npm run ai:report`：输出最新 Markdown 周报
- `npm run ai:repo -- owner/name`：输出单个仓库档案
- `npm run env:check:prod`：检查生产环境变量
- `npm run prisma:generate:prod`：为 PostgreSQL 生成 Prisma Client
- `npm run db:push:prod`：推送 PostgreSQL schema
- `npm run build:prod`：构建生产应用
- `npm run gitnexus:analyze`：刷新 GitNexus 图数据库

## 生产部署

- Web：Render
- 数据库：Neon PostgreSQL
- 调度：GitHub Actions
- 自动部署：Render `On Commit`
- 自动更新：`.github/workflows/trend-pipeline.yml`

生产环境 `Secrets`：
- `DATABASE_URL`
- `GH_TOKEN` 可选但推荐

生产环境 `Variables`：
- `TOP_LANGUAGES`
- `COLLECT_PER_QUERY`
- `STAR_HISTORY_DAYS`
- `STAR_HISTORY_MAX_PAGES`

可选变量：
- `SEARCH_QUERY`

## 日常维护

- 更新代码：推送到 `main`，Render 自动重新部署
- 更新数据：GitHub Actions 每天执行 `Trend Pipeline`
- 更新表结构：执行 `npm run prisma:generate:prod` 和 `npm run db:push:prod`
- 运行验证：检查 `https://github-weekly.onrender.com` 和 `https://github-weekly.onrender.com/api/dashboard`

## 页面路由

- 仪表盘：`/{locale}`
- Collections：`/{locale}/collections`
- Collection 详情：`/{locale}/collections/{slug}`
- 历史归档：`/{locale}/archive`
- 任务中心：`/{locale}/jobs`
- 订阅中心：`/{locale}/subscriptions`
- 产品手册：`/{locale}/ai`

## 接口

- `GET /api/dashboard`
- `GET /api/collections`
- `GET /api/collections/{slug}`
- `GET /api/archive`
- `GET /api/jobs`
- `POST /api/subscriptions`
- `GET /api/ai/context`

## 文档索引

- 产品文档：[English](./docs/product.md) | [中文](./docs/product.zh-CN.md)
- 架构文档：[English](./docs/architecture.md) | [中文](./docs/architecture.zh-CN.md)
- 部署文档：[中文](./docs/deployment.zh-CN.md)
- 数据库设计：[中文](./docs/database-design.zh-CN.md)
- 后端采集分层：[中文](./docs/backend-ingestion-layered-architecture.zh-CN.md)
- Collections 架构记录：[中文](./docs/collections-architecture-plan.zh-CN.md)
- Collections 前端缺口：[中文](./docs/frontend-collections-gap.zh-CN.md)
- 国内订阅方案：[中文](./docs/subscription-domestic-platform.zh-CN.md)
- 产品手册文档：[English](./docs/ai-onboarding.md) | [中文](./docs/ai-onboarding.zh-CN.md)

## 当前说明

- 前端已经移除“立即爬取”
- Collections 已经是正式数据库实体
- 部分仓库详情仍可能在运行时请求 GitHub API，所以配置 `GH_TOKEN` 会更稳

## GitNexus

代码结构发生较大变化后，请执行：

```bash
npm run gitnexus:analyze
```

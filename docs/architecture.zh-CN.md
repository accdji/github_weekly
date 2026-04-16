# 架构文档

[English](./architecture.md)

## 总览

当前系统分为六层：

1. 仓库采集层
2. 数据持久化与指标存储层
3. 排行与集合聚合层
4. 只读服务 API 层
5. 前端体验层
6. AI 与运维工具层

## 当前架构方向

产品正在从“浏览器触发采集”转向“后端任务统一驱动”。

当前的关键架构规则是：

- 浏览器只读数据，不再触发采集任务
- `Collections` 作为正式数据库实体存在
- 排行重建与集合同步由后端任务负责
- 仓库发现链正在向 `ODS -> DWD` 方向演进，原始搜索结果会先落库
- `Collection Detail` 已为今年以来的 `stars / PR / issues / contributors` 趋势预留正式结构
- 高频读页面和 API 已接入短 TTL 缓存与 `stale-while-revalidate` 响应头，用来降低交互延迟

## 数据流

1. `discoverRepositories()` 通过 GitHub Search API 获取候选仓库
2. 本次运行先记录到 `IngestionJob`、`IngestionTask`、`IngestionBatch`
3. 原始仓库响应先写入 `RawGitHubRepository`
4. 再标准化写入 `Repository` 和 `Snapshot`
5. 如有 token，则通过 `StarDailyStat` 回填 stargazer 历史
6. `buildWeeklyRanking()` 计算每周增量和得分
7. `syncSeedCollections()` 根据后端数据写入 `Collection`、`CollectionItem`、`CollectionTrendSnapshot` 和 `CollectionSummarySnapshot`
8. 页面和 API 读取聚合结果，不再直接触发采集

## 持久化模型

### 核心表

- `Repository`：仓库当前状态
- `Snapshot`：某一时刻的 stars、forks、watchers、issues 快照
- `StarDailyStat`：每日 star 增量
- `WeeklyRanking`：周榜结果
- `Collection`：精选集合元数据
- `CollectionItem`：集合内仓库关系
- `CollectionTag`：集合标签
- `CollectionTrendSnapshot`：集合级聚合快照
- `CollectionSummarySnapshot`：Collections 展馆首页读取的摘要快照
- `PullRequestDailyStat`：PR 日级趋势
- `IssueDailyStat`：Issue 日级趋势
- `ContributorWeeklyStat`：贡献者周级趋势
- `JobRun`：后端任务执行记录
- `IngestionJob / IngestionTask / IngestionBatch`：采集运行与阶段跟踪
- `RawGitHubRepository`：GitHub 仓库原始响应留存
- `Subscription`：关键词、仓库、Collection 订阅配置

## 运行时模块

### 采集层

- [`lib/github.ts`](../lib/github.ts)：GitHub REST / GraphQL 访问
- [`lib/collector.ts`](../lib/collector.ts)：对新采集链的兼容包装
- [`lib/ingestion/jobs.ts`](../lib/ingestion/jobs.ts)：采集任务、阶段、批次记录
- [`lib/ingestion/repositories.ts`](../lib/ingestion/repositories.ts)：仓库发现、raw 落库、标准化写入
- [`lib/star-history.ts`](../lib/star-history.ts)：Star 历史同步

### 聚合层

- [`lib/ranking.ts`](../lib/ranking.ts)：周榜计算
- [`lib/dashboard.ts`](../lib/dashboard.ts)：Dashboard 数据聚合
- [`lib/archive.ts`](../lib/archive.ts)：归档与仓库历史页
- [`lib/collections.ts`](../lib/collections.ts)：集合同步、列表和详情聚合
- [`lib/collection-seed.ts`](../lib/collection-seed.ts)：集合初始定义

### 运维层

- [`lib/jobs.ts`](../lib/jobs.ts)：任务状态记录
- [`lib/subscriptions.ts`](../lib/subscriptions.ts)：订阅持久化
- [`lib/runtime-cache.ts`](../lib/runtime-cache.ts)：昂贵只读聚合的进程内 TTL 缓存
- [`lib/http-cache.ts`](../lib/http-cache.ts)：缓存响应头工具
- [`scripts/run-pipeline.ts`](../scripts/run-pipeline.ts)：后端采集流水线
- [`scripts/sync-collections.ts`](../scripts/sync-collections.ts)：精选集合同步脚本
- [`.github/workflows/trend-pipeline.yml`](../.github/workflows/trend-pipeline.yml)：后端定时工作流

### 前端层

- [`components/dashboard-app.tsx`](../components/dashboard-app.tsx)：只读 Dashboard
- [`app/[locale]/collections/page.tsx`](../app/[locale]/collections/page.tsx)：Collections 列表页
- [`app/[locale]/collections/[slug]/page.tsx`](../app/[locale]/collections/[slug]/page.tsx)：Collection 详情页
- [`components/collection-subscribe-form.tsx`](../components/collection-subscribe-form.tsx)：Collection 订阅入口
- [`app/[locale]/subscriptions/page.tsx`](../app/[locale]/subscriptions/page.tsx)：订阅中心
- [`app/[locale]/jobs/page.tsx`](../app/[locale]/jobs/page.tsx)：后端任务中心
- [`app/[locale]/ai/page.tsx`](../app/[locale]/ai/page.tsx)：产品手册

## 读取性能

- `lib/runtime-cache.ts` 为昂贵的只读聚合提供短周期进程内缓存
- API 会返回带 `stale-while-revalidate` 的缓存响应头，避免每次重复请求都全量重算
- `dashboard`、`collections`、`jobs`、`report`、`产品手册`、`仓库详情` 这类高频读取入口已接入短 TTL 缓存窗口

## 任务执行模型

目标执行方式如下：

- CLI、GitHub Actions 或调度器启动任务
- pipeline 总结状态写入 `JobRun`
- 采集细粒度状态写入 `IngestionJob / IngestionTask / IngestionBatch`
- 后端任务刷新仓库数据、周榜、集合数据和订阅面向的聚合结果
- 前端页面只读取结果

这样可以避免在用户请求里运行重任务，也和当前已经落地的独立 worker 执行模型保持一致，例如订阅 digest 的独立处理链路。

## 部署说明

### 本地阶段

- SQLite
- 手动脚本
- 通过 `npm run collections:sync` 同步集合

### 生产阶段

- PostgreSQL
- GitHub Actions 或 cron 调度
- 后端专用采集入口或内部 job runner
- 持久化配置 `DATABASE_URL` 与 `GH_TOKEN`
- 大型代码改动后执行 GitNexus 刷新

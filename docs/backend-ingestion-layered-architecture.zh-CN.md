# 后端采集独立化与大数据分层改造方案

更新时间：2026-04-04

## 结论

后端采集部分必须从当前 Next.js 单体中的“库函数 + script 入口”模式，升级为“独立采集域 + 分层存储 + 聚合输出”。

目标不是一上来做 Hadoop 级别系统，而是：

- 结构上按大数据分层设计
- 运行上仍可先用现有 Node.js / Prisma / Postgres 落地
- 后续可以平滑替换掉部分存储或任务执行层

## 当前已落地的第一阶段

- 已新增 `IngestionJob / IngestionTask / IngestionBatch`
- 已新增 `RawGitHubRepository`
- 仓库发现链已经从“直接写业务表”升级为“先记 job/batch，再落 raw，再标准化写入 Repository / Snapshot”
- `CollectionSummarySnapshot` 已开始承接 collections 展馆首页所需的 ADS 摘要

当前仍未落地的部分：

- `RawGitHubPullRequest / RawGitHubIssue / RawGitHubContributor`
- PR / Issue / Contributor 的独立采集链
- `DashboardSummarySnapshot`
- 真正独立的 worker 进程

## 当前问题

### 1. 采集逻辑耦合在应用代码里

当前主要问题：

- `lib/collector.ts` 直接负责采集和写业务表
- `lib/github.ts` 同时承担 API SDK、业务统计和详情补充
- `scripts/run-pipeline.ts` 直接串行调用多个业务动作

结果是：

- 难扩展 PR / issue / contributor 等新采集流
- 难做失败重试、增量同步、限流控制
- 难区分原始数据、标准化数据、聚合结果

### 2. 数据库层还是“业务直写”

当前是：

- 采集到的数据直接写 `Repository` / `Snapshot` / `StarDailyStat`

问题在于：

- 缺少 raw 层
- 缺少标准化层
- 缺少主题聚合层
- 缺少任务批次与数据血缘

## 推荐的分层策略

这里按常见大数据分层思路设计，但压缩到适合当前项目的规模。

### ODS 层：原始数据层

作用：

- 保存从 GitHub 拉回来的原始响应
- 便于重放、审计、排错

建议新增表：

- `IngestionJob`
- `IngestionBatch`
- `RawGitHubRepository`
- `RawGitHubPullRequest`
- `RawGitHubIssue`
- `RawGitHubContributor`

字段建议：

- `source`
- `resourceType`
- `resourceKey`
- `fetchedAt`
- `payloadJson`
- `batchId`

原则：

- ODS 只追加，不直接给页面用

### DWD 层：明细标准化层

作用：

- 把原始 GitHub 数据清洗成统一明细
- 保证口径稳定

建议承接表：

- `Repository`
- `PullRequestDailyStat`
- `IssueDailyStat`
- `ContributorWeeklyStat`
- `Snapshot`
- `StarDailyStat`

这里的重点是：

- `Repository` 继续保留，但它属于标准化结果，不属于 raw
- PR / issue / contributor 在这一层形成统一口径

### DWS / ADS 层：服务聚合层

作用：

- 为页面和 API 提供高可读、低计算成本的数据

建议承接表：

- `WeeklyRanking`
- `CollectionTrendSnapshot`
- 未来可新增 `CollectionSummarySnapshot`
- 未来可新增 `DashboardSummarySnapshot`

原则：

- 页面优先读 ADS
- 不让页面实时扫 DWD 明细表做重聚合

## 推荐的数据库设计方向

### 一、任务与批次表

建议新增：

- `IngestionJob`
- `IngestionTask`
- `IngestionBatch`

建议职责：

- `IngestionJob`：一次完整任务运行
- `IngestionTask`：任务里的单个阶段
- `IngestionBatch`：某次 API 拉取或某个资源集合的批次

至少包含：

- jobType
- taskType
- status
- startedAt
- finishedAt
- cursor
- retries
- errorMessage

### 二、ODS 原始表

建议新增：

- `RawGitHubRepository`
- `RawGitHubPullRequest`
- `RawGitHubIssue`
- `RawGitHubContributor`

统一字段建议：

- `id`
- `resourceKey`
- `owner`
- `name`
- `payloadJson`
- `fetchedAt`
- `batchId`

### 三、DWD 明细层

建议保留和补强：

- `Repository`
- `Snapshot`
- `StarDailyStat`
- `PullRequestDailyStat`
- `IssueDailyStat`
- `ContributorWeeklyStat`

需要补的关键字段：

- 数据来源
- 统计窗口
- 最后同步时间
- 口径版本

### 四、ADS 聚合层

建议新增或强化：

- `WeeklyRanking`
- `CollectionTrendSnapshot`
- `CollectionSummarySnapshot`
- `DashboardSummarySnapshot`

## 推荐的采集服务拆分

后端采集建议独立成以下目录，不再塞进现有 `lib/collector.ts` 一个文件：

- `lib/ingestion/github-client/*`
- `lib/ingestion/repositories/*`
- `lib/ingestion/pull-requests/*`
- `lib/ingestion/issues/*`
- `lib/ingestion/contributors/*`
- `lib/ingestion/raw-store/*`
- `lib/ingestion/normalize/*`
- `lib/aggregation/collections/*`
- `lib/aggregation/rankings/*`

## 推荐的任务拆分

### 1. 仓库发现任务

任务名建议：

- `discover_repositories`

职责：

- 调 GitHub Search
- 落 ODS 原始仓库数据
- 标准化后更新 `Repository`
- 写入 `Snapshot`

### 2. Star 历史同步任务

任务名建议：

- `sync_star_history`

职责：

- 拉 stargazer 历史
- 写 `StarDailyStat`

### 3. PR 统计任务

任务名建议：

- `sync_pr_daily_stats`

职责：

- 拉今年以来 PR 数据
- 落 ODS raw PR
- 生成 `PullRequestDailyStat`

### 4. Issue 统计任务

任务名建议：

- `sync_issue_daily_stats`

职责：

- 拉今年以来 issue 数据
- 落 ODS raw issue
- 生成 `IssueDailyStat`

### 5. Contributor 统计任务

任务名建议：

- `sync_contributor_weekly_stats`

职责：

- 以 PR author 为主口径
- 生成 `ContributorWeeklyStat`

### 6. 聚合任务

任务名建议：

- `build_weekly_rankings`
- `build_collection_snapshots`
- `build_dashboard_snapshots`

## 推荐的运行架构

### 短期

可以先这样落地：

- Web 应用仍在 Next.js
- 采集逻辑抽到独立目录
- 用 GitHub Actions / cron 调用 script 入口
- 数据库先继续用 Postgres

### 中期

推荐演进为：

- `web`：Next.js
- `worker`：独立 Node.js 任务进程
- `db`：Postgres
- `queue`：Redis / SQS / pg-boss 任选一种

### 长期

如果量上来，再拆：

- ODS 原始数据可落对象存储或单独的明细库
- ADS 聚合继续保留在业务库

## 推荐的库表调整顺序

### 第一批

- `IngestionJob`
- `IngestionTask`
- `IngestionBatch`
- `RawGitHubRepository`

### 第二批

- `RawGitHubPullRequest`
- `RawGitHubIssue`
- `RawGitHubContributor`
- 强化 `PullRequestDailyStat`
- 强化 `IssueDailyStat`
- 强化 `ContributorWeeklyStat`

### 第三批

- `CollectionSummarySnapshot`
- `DashboardSummarySnapshot`

## API 与页面的读取策略

明确约束：

- 页面只读 ADS
- 页面不读 ODS
- 页面尽量不直接扫 DWD

推荐读取关系：

- Dashboard 读 `DashboardSummarySnapshot` + 排行结果
- Collections Index 读 `CollectionSummarySnapshot`
- Collection Detail 读 `CollectionTrendSnapshot`

## 需要怎么改

可以按下面顺序改：

1. 先把采集目录独立出来
2. 再加 ODS 原始表和任务批次表
3. 再把仓库采集改成 ODS -> DWD
4. 再分别补 PR / issue / contributor 三条采集链
5. 最后把 collections 和 dashboard 全部切到 ADS 读取

## 当前建议

如果下一轮开始真正重构后端，我建议优先做这三件事：

1. 先设计 `IngestionJob / IngestionTask / IngestionBatch`
2. 再把 `Repository` 采集链改造成 `ODS -> DWD`
3. 然后再接 `PR / Issue / Contributor` 三条新链路

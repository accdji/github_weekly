# Collections 能力与后端架构改造记录

更新时间：2026-04-04

## 当前实施进度

已完成：

- Prisma 已引入 `Collection`、`CollectionItem`、`CollectionTag`、`CollectionTrendSnapshot` 等基础模型
- 已增加 `PullRequestDailyStat`、`IssueDailyStat`、`ContributorWeeklyStat` 的表结构
- 已增加 `CollectionSummarySnapshot`，用于 collections 展馆首页的摘要读取
- 已增加 `IngestionJob`、`IngestionTask`、`IngestionBatch`、`RawGitHubRepository`
- 已新增 `npm run collections:sync`，用于把 seed collections 同步到数据库
- 仓库发现链已开始写入 raw repository 数据并记录 ingestion job
- 首页已移除浏览器侧“立即爬取”和本地自动调度逻辑
- 已新增 `/{locale}/collections` 与 `/{locale}/collections/{slug}` 页面
- 已新增 `/{locale}/subscriptions` 页面与 `Collection` 订阅入口
- `boards` 路由已改为跳转到 `collections`
- Jobs 页面已调整为后端任务中心的表达方式
- README、产品文档、架构文档已同步更新
- 已执行 `npm run gitnexus:analyze`

待继续推进：

- PR / Issue / Contributor 的真实后端采集任务
- Collection 聚合快照的持续化更新策略
- 更完整的后台维护入口
- 当前订阅仍是轻量模式，尚未接入账号级“我的订阅”与通知分发

备注：

- GitNexus 的 `detect_changes()` 已恢复可用
- `impact()` 在当前环境下仍然偶发 `.gitnexus/lbug` 锁冲突，需要后续继续观察

## 目标共识

我们希望在当前项目中补齐类似 OSS Insight Collections 的能力，但不追求一步到位复刻原版。

当前已确认的范围：

- 需要建设真正的 `Collections` 内容库，而不是仅靠运行时关键词分组
- 需要支持按其常见维度做统计展示，包括 `stars`、`pull requests`、`issues`、`contributors`
- 历史趋势阶段性只要求支持“今年以来”，不要求多年连续历史
- 页面上的“立即爬取”入口需要移除，采集只能由后端任务系统触发
- 后端架构需要从“页面可直接触发采集”的模式，调整为“任务驱动、查询只读、预聚合输出”的模式

## 当前架构的主要限制

### 数据模型限制

当前 Prisma 模型只有：

- `Repository`
- `Snapshot`
- `WeeklyRanking`
- `StarDailyStat`
- `JobRun`
- `Subscription`

这意味着系统目前没有以下正式实体：

- `Collection`
- `CollectionItem`
- `CollectionTag`
- `CollectionTrendSnapshot`
- `PullRequestDailyStat`
- `IssueDailyStat`
- `ContributorWeeklyStat`

结果是：

- 不能把“策展集合”作为一类内容持久化管理
- 不能记录集合和仓库之间的固定关系、排序、注释、封面、slug
- 不能按 collection 维度稳定展示 PR、Issue、Contributor 历史趋势

### 采集入口限制

当前存在浏览器侧直接触发采集的设计：

- 前端会调用 `/api/jobs/collect`
- `/api/jobs/collect` 直接执行采集、排行计算并返回最新 dashboard 数据

这个模式的问题是：

- 页面请求和重采集强耦合
- 重任务运行时间不可控
- 不利于以后引入队列、重试、并发控制和多种任务类型
- 不适合 collection 维度的扩展采集

### 数据时序限制

当前历史能力主要围绕 stars：

- `Snapshot` 记录仓库快照
- `StarDailyStat` 记录每日 star 增量

目前缺少：

- PR 开启 / 合并 / 关闭的周期统计
- Issue 开启 / 关闭的周期统计
- Contributors 的周期活跃统计

## 需要改动的事项清单

### P0：必须先做

1. 去掉前端“立即爬取”能力

- 删除首页中的手动采集按钮和相关交互
- 删除浏览器侧定时触发采集逻辑
- 页面只消费现成数据，不再负责触发采集

2. 明确后端任务边界

- 保留“采集任务”作为后端专用入口
- 任务只能由 CLI、Cron、GitHub Actions、后台管理端触发
- API 端只暴露“任务状态查询”，不暴露“直接开始全量采集”

3. 引入正式的 Collection 内容模型

建议新增：

- `Collection`
- `CollectionItem`
- `CollectionTag`
- `CollectionTagMap`

最低要求字段建议：

- `Collection`: `id`, `slug`, `name`, `description`, `coverImage`, `isPublished`, `sortOrder`, `createdAt`, `updatedAt`, `featured`, `curationSource`
- `CollectionItem`: `collectionId`, `repositoryId`, `position`, `note`, `addedAt`
- `CollectionTag`: `id`, `slug`, `name`
- `CollectionTagMap`: `collectionId`, `tagId`

4. 补齐今年范围内的统计底座

建议新增：

- `PullRequestDailyStat`
- `IssueDailyStat`
- `ContributorWeeklyStat`

统计范围建议先限定：

- 仅针对“已被收录进 collection 的仓库”
- 仅保留今年以来的数据
- 仅做聚合落库，不做全量 raw event 持久化

5. 新建 collection 聚合读取层

新增面向页面的聚合接口，而不是让页面自己拼仓库列表：

- `getCollectionsIndex()`
- `getCollectionDetail(slug)`
- `getCollectionTrend(slug, year)`

### P1：紧随其后

1. 建立 collection 趋势快照

建议增加 `CollectionTrendSnapshot`，定期把集合维度的聚合结果固化，避免详情页每次实时扫所有仓库统计。

可包含字段：

- `collectionId`
- `date`
- `starsAdded`
- `prsOpened`
- `prsMerged`
- `issuesOpened`
- `issuesClosed`
- `activeContributors`
- `trackedRepositories`

2. 提供后台维护入口

即使先不做完整用户系统，也至少需要一种稳定维护 collection 的方式：

- 管理脚本
- 配置文件导入
- 简单内部 API

3. 统一任务类型

把任务拆成明确阶段：

- `collect_repositories`
- `sync_star_history`
- `sync_pr_issue_stats`
- `sync_contributor_stats`
- `build_weekly_rankings`
- `build_collection_snapshots`

### P2：后续增强

1. 历史回填策略

- 先支持“今年以来”
- 后续视成本补 90 天 / 365 天 / 更长历史

2. 更完整的编辑体系

- `CollectionEditor`
- 审核流程
- 草稿 / 发布状态

3. 更强的任务系统

- 队列
- 并发控制
- 重试
- 告警

## 需要拍板的问题与建议结论

下面这些不是只列问题，而是给出当前推荐的架构结论。

### 1. Collection 存数据库，还是先用配置文件管理后导入数据库？

建议结论：

- 以“数据库”为唯一运行时真相来源
- 以“配置文件或 seed 文件”作为初始导入手段

原因：

- 前台查询、排序、过滤、分页、发布状态都更适合数据库驱动
- 后续如果增加后台维护、编辑、审核，也必须落到数据库
- 但初期团队维护 curated collections 时，用配置文件编写和评审会更方便

推荐方式：

- 第一阶段支持 `collections.seed.json` 之类的导入脚本
- 导入后全部写入 `Collection` / `CollectionItem`
- 页面永远只读数据库，不直接读取配置文件

### 2. Contributors 的统计口径以什么为准？

建议结论：

- 第一版以“周期内有 PR 行为的独立贡献者数”为主口径
- 不把 commit contributors、issue commenters 一起混进主指标

原因：

- PR author 更稳定、可解释，也更接近开源项目活跃协作的核心信号
- 如果混入 comment、review、commit 等多种行为，用户很难理解 contributors 数字的含义
- GitHub API 维度上，PR author 口径更容易统一实现

第一版建议展示：

- `activeContributors`: 本周 / 本月有 PR 行为的独立作者数
- `newContributors`: 本期首次出现在该仓库的 PR 作者数

后续可扩展但不进入主卡片：

- top contributors
- commit contributors
- reviewers

### 3. PR / Issue 统计按日落库，还是按周落库？

建议结论：

- PR / Issue 按日落库
- Contributors 按周落库

原因：

- PR / Issue 更适合趋势图、月度波动、年内折线，按日落库更灵活
- Contributors 天粒度价值不高，周粒度更省存储也更稳定
- 我们现在只做“今年以来”，数据规模仍然可控

### 4. Collection 趋势是实时查询，还是预聚合快照？

建议结论：

- 运行时页面读取预聚合快照
- 聚合逻辑由后端任务定期产出

原因：

- collection 详情页未来会按多个维度聚合几十个 repo，实时扫库会越来越慢
- 预聚合快照更适合缓存、分页、分享链接和稳定口径
- 前端展示需要的是“稳定输出”，不是每次临时计算

因此建议：

- 仓库级统计表保留明细
- 页面优先读取 `CollectionTrendSnapshot`

### 5. 任务执行环境以 GitHub Actions 为主，还是后续迁移到独立 worker？

建议结论：

- 短期继续以 GitHub Actions 为主
- 但代码结构要从现在开始抽象成可迁移到 worker 的 job runner

原因：

- 现阶段继续用 GitHub Actions 成本最低，能尽快上线
- 但如果不先抽象任务层，后面接入独立 worker 会再次大改

推荐结构：

- `scripts/*` 只作为入口
- 核心任务逻辑下沉到 `lib/jobs/*` 或 `lib/pipeline/*`
- 每个任务有统一输入、输出、日志、状态写入格式

## 建议的后端架构调整

### 现状

当前更像单体应用中的“同步执行脚本 + 页面直接触发”。

### 目标

调整为“单体应用 + 后端任务管线”的结构：

- Web 层：只负责查询和展示
- Domain 层：负责 `collection`、`ranking`、`repository` 这些核心业务
- Ingestion 层：负责从 GitHub 拉取仓库、PR、Issue、Contributor 统计
- Job 层：负责调度、执行、状态记录、失败重试
- Snapshot/Aggregation 层：负责把复杂统计预聚合成页面可直接消费的数据

### 推荐的任务流

1. 仓库发现任务

- 继续从 GitHub Search 拉候选仓库
- 更新 `Repository`
- 写入 `Snapshot`

2. 仓库维度统计任务

- 拉取今年以来的 PR / Issue 聚合
- 计算并写入 `PullRequestDailyStat`、`IssueDailyStat`
- 拉取或计算 contributors 周期统计

3. Collection 聚合任务

- 读取 `CollectionItem`
- 聚合 collection 维度的 `stars / PR / issue / contributor` 指标
- 写入 `CollectionTrendSnapshot`

4. 排行与页面读取

- 页面只读取聚合结果
- 页面不触发采集任务

## 建议的职责拆分

### API 层

保留：

- 只读 API
- 任务状态 API

收缩：

- 直接执行采集的大型同步 API

### Script / Worker 层

负责：

- 定时采集
- 回填
- 构建 collection 快照
- 构建排行

### 数据访问层

建议将读取与写入逻辑分开：

- `lib/repositories/*`
- `lib/collections/*`
- `lib/jobs/*`
- `lib/metrics/*`

避免继续把多种职责都堆在 `dashboard.ts` 这种聚合文件里。

## 前端需要改动的内容

### 需要删除或收缩的现有前端能力

1. 首页移除“立即爬取”

- 删除手动采集按钮
- 删除 `triggerCollection()` 相关交互
- 删除“采集中”这类前端主动触发状态

2. 首页移除浏览器侧自动调度

- 删除 browser schedule UI
- 删除本地定时器触发采集逻辑
- Jobs 页只展示服务端任务，不再强调本地浏览器触发

3. Boards 页不再作为最终形态

- 现有 `boards` 只是过渡页
- 后续升级为真正的 `Collections` 目录页

### 前端需要新增的页面与模块

1. `Collections Index` 页面

页面目标：

- 替代现有 boards 页
- 成为 collections 的一级目录页

需要新增的能力：

- 搜索 collection
- 按标签筛选
- 按 `Featured / New / A-Z / Popular` 排序切换
- 卡片网格展示
- 每张卡片展示封面、简介、仓库数量、核心指标、Top 仓库预览

2. `Collection Detail` 页面

页面目标：

- 成为 collection 的主详情页

需要新增的能力：

- collection hero 区
- 年度选择器，第一版只支持今年
- 趋势图：stars、PR、issues、contributors
- 仓库列表
- 相关 collection 推荐
- 统计口径说明

3. `Collections Archive / Browse` 辅助浏览能力

视时间和资源决定是否首期上线，但建议预留：

- 全部标签页
- A-Z 浏览
- featured collections 区块

4. `Jobs` 页面升级

需要新增的能力：

- 展示任务类型、开始时间、结束时间、状态、统计摘要
- 区分采集、聚合、排行构建等不同任务
- 明确说明它们来自后端任务系统

### 前端需要新增的组件

- `CollectionCard`
- `CollectionHero`
- `CollectionMetricsStrip`
- `CollectionTrendTabs`
- `CollectionRepoTable`
- `CollectionTagFilter`
- `CollectionSortSwitcher`
- `JobStatusBadge`

## 明确复刻的前端范围

这里指“产品信息架构和关键交互向 OSS Insight Collections 对齐”，不是要求做像素级复刻。

### 第一阶段明确复刻

1. Collections 目录页

复刻内容：

- collection 列表型首页
- 搜索入口
- 卡片网格
- 卡片内显示若干代表仓库
- 排序与浏览切换

2. Collection 卡片结构

复刻内容：

- 标题
- 简介
- 代表仓库预览
- 统计摘要
- 跳转详情

3. Collection 详情页的信息组织方式

复刻内容：

- 顶部 hero
- 关键指标条
- 趋势图区域
- 仓库列表区域
- 方法论说明区域

4. 按维度展示集合趋势

复刻内容：

- stars
- pull requests
- issues
- contributors

第一版限制：

- 历史只做今年以来

### 不按原版复刻的部分

1. 不做像素级视觉复制

- 保留项目自身视觉语言
- 只复刻信息架构和关键交互

2. 不做多年连续历史

- 第一版只做今年以来

3. 不做社区投稿式 `New Collection`

- 第一版不做公开投稿和多人编辑
- 只做内部维护和导入

4. 不做依赖超大历史仓的全量回放

- 第一版只采集我们追踪范围内的数据

## 页面与产品层需要同步调整

1. 首页不再展示“立即爬取”
2. 首页不再保留浏览器侧自动调度采集
3. Jobs 页改为强调“后端任务状态”而不是“前端触发”
4. Boards 页需要升级为真正的 `Collections` 页
5. `Collection Detail` 页需要成为一级内容页
6. 所有 collection 指标都要明确口径说明，尤其是 contributors

## 推荐的阶段实施顺序

### 第一阶段

- 移除前端触发采集
- 设计并落地 collection 基础模型
- 跑通后端专属任务入口
- 完成 collections 前端目录页和详情页框架

### 第二阶段

- 增加 PR / Issue / Contributor 周期统计
- 做今年以来的 collection 趋势
- 完成 collection 指标和趋势图接入

### 第三阶段

- 引入 collection 快照与更稳定的聚合读取
- 升级 jobs 状态展示
- 再决定是否补 archive、A-Z、featured browse 的增强能力

## 当前建议

如果接下来要进入正式设计，推荐先基于上述结论继续推进这三项：

1. 先定 Prisma 新模型
2. 再定 job runner 的拆分方式
3. 最后再做 collections 前端页面原型

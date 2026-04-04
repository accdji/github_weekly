# 数据库设计说明

更新时间：2026-04-04

## 目标

数据库设计需要同时满足四件事：

- 支撑当前前端页面正确读取
- 支撑后端采集分层
- 支撑 Collections 内容库
- 为“真正的订阅”和国内通知渠道预留扩展空间

## 分层视角

### ODS：原始采集层

用途：

- 留存 GitHub 原始响应
- 支撑重放、排错、审计

当前表：

- `IngestionJob`
- `IngestionTask`
- `IngestionBatch`
- `RawGitHubRepository`

后续建议新增：

- `RawGitHubPullRequest`
- `RawGitHubIssue`
- `RawGitHubContributor`

### DWD：标准化明细层

用途：

- 保存清洗后的仓库、快照与统计明细

当前表：

- `Repository`
- `Snapshot`
- `StarDailyStat`
- `PullRequestDailyStat`
- `IssueDailyStat`
- `ContributorWeeklyStat`

### ADS：页面读取层

用途：

- 提供前端直接读取的摘要与趋势快照

当前表：

- `WeeklyRanking`
- `CollectionTrendSnapshot`
- `CollectionSummarySnapshot`

建议后续新增：

- `DashboardSummarySnapshot`

## 核心实体设计

### Repository

职责：

- 保存仓库当前状态
- 作为快照、排行、订阅、集合关系的主表

关键字段：

- `githubId`
- `owner`
- `name`
- `fullName`
- `stars`
- `forks`
- `watchers`
- `openIssues`
- `topicsJson`
- `createdAtGh`
- `pushedAtGh`
- `updatedAtGh`
- `collectedAt`
- `starHistoryFrom`
- `starHistorySyncedAt`

### Snapshot

职责：

- 保存仓库的时间点快照
- 用于补足当前一周内的 best-effort Star 增量

关键字段：

- `repositoryId`
- `stars`
- `forks`
- `watchers`
- `openIssues`
- `fetchedAt`

### Collection

职责：

- 保存策展集合本体

关键字段：

- `slug`
- `name`
- `description`
- `coverImage`
- `isPublished`
- `featured`
- `sortOrder`
- `curationSource`

### CollectionItem

职责：

- 保存集合和仓库的关系与顺序

关键字段：

- `collectionId`
- `repositoryId`
- `position`
- `note`

### Subscription

当前只是轻量订阅表，还不是真正的“用户订阅系统”。

当前字段：

- `email`
- `locale`
- `channel`
- `subscriptionType`
- `digestFrequency`
- `keywordsJson`
- `repositoryId`
- `collectionId`
- `enabled`

当前问题：

- 没有真正的订阅人实体
- 没有验证码或登录态
- 没有通知投递记录
- 没有退订令牌

## 当前推荐的下一版订阅数据库设计

### Subscriber

建议新增：

- `id`
- `platform`
- `email`
- `phone`
- `wechatOpenId`
- `feishuUserId`
- `locale`
- `status`
- `createdAt`
- `updatedAt`

### SubscriberChannel

建议新增：

- `id`
- `subscriberId`
- `channelType`
- `channelValue`
- `verified`
- `verifiedAt`
- `status`

### SubscriptionRule

建议新增：

- `id`
- `subscriberId`
- `subscriptionType`
- `collectionId`
- `repositoryId`
- `keywordsJson`
- `digestFrequency`
- `enabled`
- `createdAt`
- `updatedAt`

### DeliveryJob

建议新增：

- `id`
- `jobType`
- `channelType`
- `status`
- `startedAt`
- `finishedAt`
- `statsJson`

### DeliveryLog

建议新增：

- `id`
- `deliveryJobId`
- `subscriberId`
- `subscriptionRuleId`
- `channelType`
- `payloadJson`
- `status`
- `providerMessageId`
- `errorMessage`
- `sentAt`

## Star 历史口径说明

当前系统支持两种来源：

1. `StarDailyStat`
   这是完整的日级 Star 历史，优先级最高。
2. `Snapshot`
   当 `StarDailyStat` 不足时，使用最近可比较快照做 best-effort 差值，最多只回看 7 天窗口。

因此当前产品规则应明确为：

- 有完整 7 天历史时，显示完整周增量
- 没有完整 7 天历史但有可比较快照时，显示 partial week 数据
- 既没有历史也没有可比较快照时，显示 `--`

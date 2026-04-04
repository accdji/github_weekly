# Collections 前端缺口记录

更新时间：2026-04-04

## 结论

当前 `Collections` 前端已经完成了基础骨架，但离目标态还有两类明显缺口：

1. `Collections` 首页还不够像“收藏展馆 / 策展展馆”
2. `Collections` 维度的订阅功能还没有真正落地

## 本轮已补齐

- `Collections Index` 已新增 `Featured Collections`、`Browse by Tags`、`Recently Updated`、`Popular Collections`
- `Collection Detail` 已新增 `Subscribe to this collection`
- 已新增 `/{locale}/subscriptions` 订阅中心页
- 后端 `Subscription` 已支持 `collectionId`、`subscriptionType`、`digestFrequency`

## 当前已完成

- 已有 `Collections Index`
- 已有 `Collection Detail`
- 已有集合卡片、基础指标、Top repo 预览
- 已有按 `Featured / New / A-Z / Popular` 的基础浏览切换
- 已有仓库维度的关键词订阅接口与数据表

## 当前缺失

### 1. 收藏展馆感不够

现在更像“集合列表页”，还不像真正的“收藏展馆”。

缺的主要是：

- 首页缺少 `Featured Collections` 头图区
- 缺少按主题分区的展馆感布局
- 缺少 collections 的封面视觉和更强的策展感
- 缺少 `Recently Updated`、`Popular This Year`、`Editor Picks` 之类二级展区
- 缺少 `Tag Browse` / `A-Z Browse` 的明显入口
- 缺少 collection 之间的相关推荐流转

### 2. 订阅功能已经接到 Collections，但还没有进入“账号态 + 通知态”

现在已有的订阅能力，本质上还是 Dashboard 里的“关键词订阅”。

当前已有：

- `Subscription` 表
- `POST /api/subscriptions`
- Dashboard 里的关键词订阅输入框

当前已新增：

- 订阅某个 `Collection`
- 在 `Collection Detail` 页上直接点“订阅集合”
- 订阅管理页

但当前仍没有：

- 订阅某个 `Collection` 下的新入选仓库的独立开关
- 真正的周报 / 月报投递执行器
- 账号级当前用户订阅态识别
- 订阅触发策略和通知模板

## 前端修改建议

### P0：本轮必须补

1. `Collections Index` 升级成“展馆首页”

建议新增区块：

- `Featured Collections`
- `Browse by Tags`
- `Recently Updated`
- `Popular Collections`

页面结构建议：

1. Hero
2. Featured 区
3. Tag 区
4. Collections Grid
5. Footer / Methodology

2. `Collection Detail` 增加订阅入口

建议新增：

- 主按钮：`Subscribe to this collection`
- 次按钮：`Add to watchlist`
- 展示订阅状态：已订阅 / 未订阅

3. Dashboard 的订阅语义要收口

当前 Dashboard 里的订阅更像“关键词提醒”。

建议改名为：

- `Keyword Alerts`

避免和未来的 `Collection Subscriptions` 混淆。

### P1：紧接着补

1. 订阅管理页

建议新增页面：

- `/{locale}/subscriptions`

页面中至少要有：

- 我订阅的 collections
- 我订阅的关键词
- 开关启停
- 通知渠道

2. Collection 推荐流转

建议在详情页新增：

- `Related Collections`
- `You may also want to follow`

3. 集合级空态与加载态

建议补齐：

- 无数据空态
- 尚未同步 PR / issue / contributor 时的占位文案
- 已订阅成功反馈

## 前端对应的数据需求

为了支持收藏展馆与订阅，前端需要后端返回：

### Collections Index 需要

- featured collections
- collection tags
- updatedAt
- repositoryCount
- starsAdded
- subscriptionCount
- coverImage

### Collection Detail 需要

- current user subscription state
- collection notification options
- related collections
- year selector candidates

## 订阅功能的产品拆分建议

### 第一阶段

只做两种订阅：

- `KeywordSubscription`
- `CollectionSubscription`

### 第二阶段

再扩展：

- `RepositorySubscription`
- `DigestSubscription`

## 推荐的前端任务拆分

1. 升级 `Collections Index` 为展馆首页
2. 在 `Collection Detail` 接入订阅按钮
3. 补 `Subscription Management` 页面
4. 再做相关推荐和 richer browse

## 当前建议

如果下一轮继续改前端，推荐优先级如下：

1. 先补 `CollectionSubscription` 的前后端闭环
2. 再升级 `Collections Index` 的展馆布局
3. 最后再补订阅管理页和相关推荐

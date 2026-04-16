# 国内平台订阅实现方案

更新时间：2026-04-04

## 先说结论

你现在的 `Subscription` 还不算真正的订阅系统，它只是“把一条配置写进数据库”。

真正的订阅，至少要同时具备这四层：

1. 订阅人是谁
2. 订阅了什么
3. 通过什么渠道发送
4. 发送结果有没有被记录

## 国内平台推荐实现路径

如果目标是国内平台，我推荐按下面优先级来做：

### 第一阶段：邮箱 + 站内订阅

适合先跑通闭环，成本最低。

需要做的事：

- 引入 `Subscriber`
- 订阅创建时生成 `SubscriptionRule`
- 增加邮箱验证码或 magic link
- 增加 `DeliveryJob / DeliveryLog`

建议支持：

- `Collection` 订阅
- `Keyword` 订阅
- 每周 digest

### 第二阶段：微信服务号 / 企业微信 / 飞书

适合国内运营与 B 端场景。

建议渠道优先级：

1. 企业微信 / 飞书
   适合团队协作和内部通知
2. 微信服务号或模板消息
   适合面向国内 C 端用户
3. 邮件
   继续保留，做兜底渠道

### 第三阶段：登录态与订阅中心

当你要做真正的平台时，必须补：

- 用户登录
- 我的订阅
- 我的通知渠道
- 一键退订
- 发送频率设置

## 推荐的产品口径

### 订阅类型

第一版只做：

- `CollectionSubscription`
- `KeywordSubscription`

后续再加：

- `RepositorySubscription`
- `DigestSubscription`

### 触发方式

第一版建议只做 digest，不做实时推送。

原因：

- 实时推送对采集频率、去重、消息模板要求更高
- 你现在的数据链还在演进中
- digest 更容易控制频率和用户体验

### digest 频率

建议只做两档：

- `weekly`
- `monthly`

## 后端流程设计

### 创建订阅

1. 前端提交邮箱或渠道标识
2. 后端创建或匹配 `Subscriber`
3. 后端创建 `SubscriptionRule`
4. 后端返回订阅成功状态

### 生成内容

1. 定时任务扫描活跃订阅规则
2. 根据规则生成候选内容
3. 写入 `DigestSnapshot` 或发送 payload

### 发送通知

1. 创建 `DeliveryJob`
2. 按渠道分批发送
3. 每条发送结果写入 `DeliveryLog`
4. 失败任务可重试

## 前端页面建议

### Collection Detail

需要有：

- 订阅按钮
- 渠道选择
- 频率选择
- 是否只关心新入选仓库

### 订阅中心

需要有：

- 我的 Collections
- 我的关键词
- 我的通知渠道
- 启停开关
- 最近发送记录

## 当前项目和目标态的差距

当前已有：

- `Subscription` 表
- `Collection` 订阅入口
- `/{locale}/subscriptions` 页面

当前还缺：

- `Subscriber`
- 渠道验证
- 发送任务
- 发送日志
- 退订机制
- 国内渠道适配

## 最推荐的实现顺序

1. 先补 `Subscriber / SubscriptionRule / DeliveryJob / DeliveryLog`
2. 先跑通邮箱和站内 digest
3. 再接企业微信或飞书
4. 最后再做微信类 C 端渠道

## 当前已落地的渠道能力

- 站内 outbox 已可直接承接 digest
- Webhook、企业微信、飞书 Webhook 已可直接投递
- 邮件渠道在配置 `RESEND_API_KEY` 与 `EMAIL_FROM` 后会走真实邮件发送
- 未配置邮件服务时，邮件任务仍会保留在 outbox 与 delivery logs 中，便于排查和补配

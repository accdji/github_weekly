# 产品设计

[English Version](./product.md)

## 产品定位

开源趋势情报台是一个双语开源情报产品，基于自有快照、周榜、精选集合、历史归档、订阅能力和后端任务可观测性来组织信号。

它不是 GitHub Trending 的镜像，也不是浏览器侧爬虫。

## 目标用户

- 希望尽早发现上升中开源项目的开发者
- 跟踪生态趋势的研究和内容团队
- 关注 AI、基础设施和开发工具赛道的产品、DevRel 与投资团队

## 核心体验

1. Dashboard
   一个只读的总控台，用来筛选、对比、导出和浏览上升中的仓库。
2. Collections
   一个展馆式的集合目录与详情体验，参考 collection-driven discovery 产品的信息架构，并包含订阅入口。
3. Archive
   历史周榜快照和仓库历史页。
4. Methodology
   清晰解释数据覆盖、评分规则和指标定义。
5. Jobs
   一个面向后端任务可见性的任务中心。
6. Subscription Center
   一个统一查看关键词提醒和 Collection 关注关系的页面。
7. 产品手册
   一个说明 CLI 接入、导出方式、订阅路径和常见问题的实用手册。

## Collections 方向

Collections 这一条产品线会明确复刻 OSS Insight Collections 的这些结构层能力：

- 集合目录页
- 带仓库预览的集合卡片
- Featured 展区和标签浏览
- Collection 详情页 Hero
- 趋势区块
- 仓库列表区域
- Collection 订阅入口
- 相关 Collection 推荐
- 指标口径说明

第一版不会做像素级复刻，而是保留当前产品的视觉语言，同时对齐产品结构与关键交互。

## 当前明确不做的内容

- 浏览器侧立即爬取
- 面向公众的 New Collection 投稿入口
- 多年连续历史趋势
- 完整的多人编辑与审核体系

## 功能优先级

### P0

- 稳定的后端采集与周榜
- 数据库驱动的 Collections
- Collection 关注与订阅闭环
- Collections 列表页与详情页
- 与后端执行一致的 Jobs 中心
- 完整更新后的文档与产品手册

### P1

- 今年以来的 PR、Issue、Contributor 集合指标
- 更丰富的集合维护方式
- Featured / A-Z / Archive 等更丰富的浏览模式

### P2

- 邮件或团队级通知
- 多编辑者集合工作流
- 独立 worker 执行模型

## 成功信号

- Dashboard 和 Collections 的回访率
- 有效 Collection 的数量与覆盖率
- 后端任务每周成功次数
- 集合快照的新鲜度
- 产品手册和报告导出的使用量

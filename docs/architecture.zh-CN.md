# 架构设计

[English Version](./architecture.md)

## 概览

系统分为五层：

1. 采集层
2. 存储层
3. 排名计算层
4. 服务 API 层
5. 前端展示层

## 数据流

1. 定时采集器搜索 GitHub 仓库
2. 仓库记录写入或更新到数据库
3. 为当前指标写入快照记录
4. 周榜构建器计算 7 天增量并生成排名
5. 前端和 API 从周榜表读取结果

## 模块

### 采集层

职责：

- 从 GitHub 搜索候选仓库
- 拉取仓库元数据
- 将响应转换为本地模型

### 存储层

核心表：

- `Repository`
- `Snapshot`
- `WeeklyRanking`

### 排名计算层

职责：

- 比较当前快照和 7 天前快照
- 计算 star 和 fork 增量
- 生成可排序的综合分数

### API 层

初始接口：

- `GET /api/weekly`
- `GET /api/repositories/[owner]/[name]`

### 前端层

首页读取最新周榜，并以清晰表格方式展示。

## 调度

### 每日任务

- 每天运行一次
- 更新仓库元数据
- 写入最新快照

### 每周任务

- 每周运行一次
- 为目标周生成周榜记录

## 部署路径

### 本地 MVP

- SQLite
- 手动执行或本地定时任务

### 生产环境

- PostgreSQL
- GitHub Actions 或服务器 cron
- 托管的 Next.js 前端

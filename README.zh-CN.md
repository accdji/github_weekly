# GitHub Weekly

[English README](./README.md)

一个用于采集、计算并展示 GitHub 每周热点仓库的小型产品。

## 目标

- 定时采集 GitHub 仓库数据
- 持久化每日快照，支持历史分析
- 根据增长情况生成每周榜单
- 通过网页和 API 展示结果

## 技术栈

- Next.js
- TypeScript
- Prisma
- SQLite（本地 MVP）

## 快速开始

1. 安装依赖
2. 将 `.env.example` 复制为 `.env`
3. 如果你想启用认证请求和基于 stargazers 的周增 Star 回填，请填写 `GITHUB_TOKEN`
4. 运行 `npx prisma db push`
5. 运行 `npm run collect:daily`
6. 运行 `npm run build:weekly`
7. 运行 `npm run dev`

## 脚本

- `npm run dev`：启动 Web 应用
- `npm run collect:daily`：抓取候选仓库并保存快照
- `npm run build:weekly`：生成最新一周榜单
- `npm run prisma:generate`：生成 Prisma Client

## 项目结构

- `app/`：Next.js 页面和 API 路由
- `components/`：共享 UI 组件
- `docs/`：产品和架构文档
- `lib/`：数据库、GitHub 和榜单逻辑
- `prisma/`：数据库 schema
- `scripts/`：采集和榜单任务脚本

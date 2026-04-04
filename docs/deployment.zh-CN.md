# 部署方案说明

## 结论先说

当前线上地址：

- `https://github-weekly.onrender.com`

当前线上形态：

- Web：Render Free Web Service
- 数据库：Neon PostgreSQL
- 定时更新：GitHub Actions `Trend Pipeline`
- 工作流状态：`active`
- 最近一次已验证成功的运行：2026-04-04 23:47 至 23:49，中国标准时间，触发方式为 `workflow_dispatch`
- 定时配置：每天 `01:00 UTC`，即中国标准时间每天 `09:00`

这个项目当前形态 **不适合直接部署到 GitHub Pages**。

原因很直接：

- 它不是纯静态站点，而是一个带 `Next.js` 服务端渲染、`API Route`、`Prisma` 和数据库读写的应用。
- 它的数据更新依赖后端脚本和定时任务，不是前端打包时一次性生成完就结束。
- 当前数据库还是 `SQLite`，如果放到无持久磁盘或纯静态托管环境里，运行时写入会非常受限。

如果你的目标是：

1. 页面可以正常访问
2. 数据每天自动更新
3. 后端任务能稳定跑

那更推荐的方案是：

- 代码托管继续放在 GitHub
- 定时采集继续用 GitHub Actions
- Web 服务部署到支持 Next.js Server 的平台
- 数据库迁到 PostgreSQL

## 推荐部署架构

推荐使用：

- GitHub：存代码与工作流
- GitHub Actions：每天定时执行采集、排行和集合同步
- Vercel / Railway / Render：部署 Next.js 应用
- PostgreSQL：生产数据库

推荐数据流：

1. GitHub Actions 定时触发
2. 执行 `npm run pipeline:run`
3. 执行 `npm run collections:sync`
4. 写入生产数据库
5. Next.js 页面读取数据库最新结果

## 当前仓库已经具备的基础

仓库里已经有 GitHub Actions 工作流：

- [`trend-pipeline.yml`](../.github/workflows/trend-pipeline.yml)

它已经支持：

- `workflow_dispatch`
- `schedule`
- 执行 `npm run db:push`
- 执行 `npm run pipeline:run`
- 执行 `npm run collections:sync`

也就是说，**自动更新这件事其实骨架已经在了**，你现在主要要做的是把“运行环境”和“数据库”换成可长期在线的生产方案。

## 如果你想要“每天自动更新”

当前仓库已经调整为：

- 每天 01:00 UTC 自动执行一次
- 对应北京时间每天 09:00

当前工作流文件：

- [`.github/workflows/trend-pipeline.yml`](../.github/workflows/trend-pipeline.yml)

例如北京时间每天上午 9:00：

```yml
on:
  workflow_dispatch:
  schedule:
    - cron: "0 1 * * *"
```

## 如果坚持部署到 GitHub Pages

不是完全不行，但要 **重构成静态站**，改动会很大。

你需要把当前项目改造成：

1. GitHub Actions 定时跑采集
2. 生成静态 JSON 文件
3. 构建时读取这些 JSON
4. `next export` 或静态化输出页面
5. 再把静态文件发布到 GitHub Pages

这条路要放弃或重写的能力包括：

- 运行时数据库查询
- API Route 动态查询
- Prisma 直接在页面请求时读库
- 服务器侧实时详情接口

这意味着当前这些能力都要改：

- Dashboard 数据读取方式
- Collections 列表与详情读取方式
- Jobs 页读取方式
- 订阅写入能力
- 仓库详情 API

所以从成本和维护性来看，**不推荐走 GitHub Pages 方案**。

## 生产环境建议修改

### 1. 数据库

项目当前保留了两套 Prisma schema：

- 本地开发：[`schema.prisma`](../prisma/schema.prisma)，使用 `SQLite`
- 生产部署：[`schema.postgres.prisma`](../prisma/schema.postgres.prisma)，使用 `PostgreSQL`

生产环境请执行：

```bash
npm run prisma:generate:prod
npm run db:push:prod
npm run build:prod
```

### 2. 环境变量

生产环境至少需要：

```bash
DATABASE_URL=postgresql://...
GH_TOKEN=ghp_xxx
TOP_LANGUAGES=TypeScript,Python,Go,Rust
COLLECT_PER_QUERY=30
STAR_HISTORY_DAYS=7
STAR_HISTORY_MAX_PAGES=10
JOB_TRIGGERED_BY=github-actions
```

仓库已经提供生产模板：

- [`.env.production.example`](../.env.production.example)

建议在上线前先执行：

```bash
npm run env:check:prod
```

它会检查：

- `DATABASE_URL` 是否为 PostgreSQL 连接串
- GitHub Token 是否存在
- 采集与 Star 回填相关参数是否为有效数字

### 3. Web 托管

推荐部署到：

- Vercel
- Railway
- Render

要求是：

- 支持 Next.js App Router
- 支持服务端运行
- 支持环境变量
- 能连接外部 PostgreSQL

如果使用 Vercel，仓库已经提供：

- [`vercel.json`](../vercel.json)

它会把构建命令固定为：

```bash
npm run build:prod
```

### 4. 定时任务

继续使用 GitHub Actions 即可，不需要页面自己触发采集。

也就是：

- 页面只读
- Actions 负责更新数据
- Web 服务只负责展示最新数据库结果

## 最推荐的落地方式

如果你想尽快上线，我建议按这个顺序做：

1. 保留 GitHub 作为代码仓库
2. 保留 GitHub Actions 作为定时采集器
3. 把数据库切到 PostgreSQL
4. 把网站部署到 Vercel / Railway / Render
5. 把 Actions 的 `DATABASE_URL` 指向同一个生产库
6. 在 GitHub Actions 中使用 `npm run prisma:generate:prod` 和 `npm run db:push:prod`
7. 在 Vercel 等平台上将构建命令改成 `npm run build:prod`

## GitHub Actions 需要配置什么

### Secrets

- `DATABASE_URL`
- `GH_TOKEN`

### Variables

- `TOP_LANGUAGES`
- `COLLECT_PER_QUERY`
- `STAR_HISTORY_DAYS`
- `STAR_HISTORY_MAX_PAGES`

当前工作流会按以下顺序执行：

1. `npm ci`
2. `npm run env:check:prod`
3. `npm run prisma:generate:prod`
4. `npm run db:push:prod`
5. `npm run pipeline:run`
6. `npm run collections:sync`

## Vercel 需要配置什么

在 Vercel 项目中至少补这几个环境变量：

- `DATABASE_URL`
- `GH_TOKEN`
- `TOP_LANGUAGES`
- `COLLECT_PER_QUERY`
- `STAR_HISTORY_DAYS`
- `STAR_HISTORY_MAX_PAGES`

`SEARCH_QUERY` 是可选项，不创建时会自动退回到系统内置的 7 天动态查询条件。

如果你希望页面里明确记录运行来源，也可以加：

- `JOB_TRIGGERED_BY=vercel`

这是当前项目改动最小、维护成本最低、也最稳的一条路。

## 不推荐的方式

不推荐：

- 直接把当前项目原样丢到 GitHub Pages
- 继续用浏览器触发采集
- 生产环境继续依赖本地 SQLite 文件
- 让页面同时承担展示和采集职责

## 一句话建议

**GitHub 很适合托管代码和跑定时任务，但不适合直接承载你这个项目当前形态的线上运行时。**

最合理的组合是：

- GitHub + GitHub Actions
- Next.js 托管平台
- PostgreSQL

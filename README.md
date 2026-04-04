# Open Source Trend Intelligence Desk

[中文说明](./README.zh-CN.md)

Open Source Trend Intelligence Desk is a bilingual GitHub trend product for discovering rising repositories through ranked dashboards, curated collections, historical archives, subscriptions, and backend-operated data jobs.

## Overview

- Product routes: dashboard, collections, archive, jobs, subscriptions, and product manual
- Data flow: backend jobs collect and aggregate data, frontend pages only read from the database
- Local database: SQLite
- Production database: PostgreSQL

## Live Status

- Live URL: `https://github-weekly.onrender.com`
- Hosting: Render Free Web Service
- Production database: Neon PostgreSQL
- Scheduled refresh: GitHub Actions `Trend Pipeline`
- Latest verified successful run: 2026-04-04 23:47 to 23:49 CST via `workflow_dispatch`
- Scheduled run time: daily at `09:00` China Standard Time (`01:00 UTC`)

## Quick Start

1. Run `npm install`
2. Copy `.env.example` to `.env`
3. Optionally set `GH_TOKEN`
4. Run `npm run prisma:generate`
5. Run `npm run db:push`
6. Run `npm run collect:daily`
7. Run `npm run build:weekly`
8. Run `npm run collections:sync`
9. Run `npm run dev`

## Core Scripts

- `npm run collect:daily`: collect candidate repositories and store fresh snapshots
- `npm run sync:stars`: backfill stargazer history for tracked repositories
- `npm run build:weekly`: generate the latest weekly ranking snapshot
- `npm run collections:sync`: seed and refresh curated collections
- `npm run pipeline:run`: execute the backend ingestion pipeline
- `npm run ai:context`: print the product-manual JSON context
- `npm run ai:report`: print the latest Markdown weekly report
- `npm run ai:repo -- owner/name`: print one repository dossier
- `npm run env:check:prod`: validate production environment variables
- `npm run prisma:generate:prod`: generate Prisma client for PostgreSQL
- `npm run db:push:prod`: push the PostgreSQL schema
- `npm run build:prod`: build the production app
- `npm run gitnexus:analyze`: refresh the GitNexus graph

## Production Setup

- Web: Render
- Database: Neon PostgreSQL
- Scheduler: GitHub Actions
- Auto deploy: Render `On Commit`
- Auto refresh: `.github/workflows/trend-pipeline.yml`

Required production secrets:
- `DATABASE_URL`
- `GH_TOKEN` optional but recommended

Required production variables:
- `TOP_LANGUAGES`
- `COLLECT_PER_QUERY`
- `STAR_HISTORY_DAYS`
- `STAR_HISTORY_MAX_PAGES`

Optional production variable:
- `SEARCH_QUERY`

## Operations

- Code updates: push to `main`, Render redeploys automatically
- Data updates: GitHub Actions runs `Trend Pipeline` daily
- Schema updates: run `npm run prisma:generate:prod` and `npm run db:push:prod`
- Runtime verification: check `https://github-weekly.onrender.com` and `https://github-weekly.onrender.com/api/dashboard`

## Routes

- Dashboard: `/{locale}`
- Collections: `/{locale}/collections`
- Collection detail: `/{locale}/collections/{slug}`
- Archive: `/{locale}/archive`
- Jobs: `/{locale}/jobs`
- Subscriptions: `/{locale}/subscriptions`
- Product manual: `/{locale}/ai`

## API

- `GET /api/dashboard`
- `GET /api/collections`
- `GET /api/collections/{slug}`
- `GET /api/archive`
- `GET /api/jobs`
- `POST /api/subscriptions`
- `GET /api/ai/context`

## Docs

- Product: [English](./docs/product.md) | [中文](./docs/product.zh-CN.md)
- Architecture: [English](./docs/architecture.md) | [中文](./docs/architecture.zh-CN.md)
- Deployment: [中文](./docs/deployment.zh-CN.md)
- Database design: [中文](./docs/database-design.zh-CN.md)
- Backend ingestion layering: [中文](./docs/backend-ingestion-layered-architecture.zh-CN.md)
- Collections architecture record: [中文](./docs/collections-architecture-plan.zh-CN.md)
- Collections frontend gap record: [中文](./docs/frontend-collections-gap.zh-CN.md)
- Domestic subscription plan: [中文](./docs/subscription-domestic-platform.zh-CN.md)
- Product manual doc: [English](./docs/ai-onboarding.md) | [中文](./docs/ai-onboarding.zh-CN.md)

## Notes

- Browser-triggered collection has been removed from the UI
- Collections are first-class database entities
- Some runtime repository detail calls can still hit GitHub APIs, so `GH_TOKEN` improves stability

## GitNexus

After major code changes, refresh the graph:

```bash
npm run gitnexus:analyze
```

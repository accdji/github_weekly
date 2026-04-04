# Open Source Trend Intelligence Desk

[中文说明](./README.zh-CN.md)

Open Source Trend Intelligence Desk is a bilingual product for discovering rising GitHub repositories through ranked dashboards, curated collections, historical archives, subscriptions, and backend-operated data jobs.

## What Changed

- Browser-triggered collection has been removed from the UI.
- `Collections` is now a first-class product surface, replacing the old topic-board direction.
- Backend jobs are responsible for repository ingestion, ranking rebuilds, and collection synchronization.
- Repository discovery now writes ingestion job, task, batch, and raw repository records as an ODS foundation.
- `Collection` subscriptions now have a backend data model, detail-page entry point, and a subscription center page.
- The `/{locale}/ai` page is now positioned as a product manual instead of an AI-only toolbox.

## Product Scope

- Track repositories with snapshots, star history, rankings, and curated collections
- Present dashboards, collection detail pages, historical archive pages, jobs, subscriptions, and a product manual
- Keep ingestion and aggregation in backend jobs instead of browser-side triggers
- Prepare year-to-date collection metrics across stars, PRs, issues, and contributors

## Stack

- Next.js 15
- TypeScript
- Prisma
- SQLite for local MVP, PostgreSQL recommended for production

## Quick Start

1. Install dependencies with `npm install`
2. Copy `.env.example` to `.env`
3. Fill `GH_TOKEN` if you want authenticated GitHub requests
4. Run `npm run prisma:generate`
5. Run `npm run db:push`
6. Run `npm run collect:daily`
7. Run `npm run build:weekly`
8. Run `npm run collections:sync`
9. Run `npm run dev`

## Key Scripts

- `npm run collect:daily`: collect candidate repositories and store fresh snapshots
- `npm run sync:stars`: backfill stargazer history for tracked repositories
- `npm run build:weekly`: generate the latest weekly ranking snapshot
- `npm run collections:sync`: seed and refresh curated collections from backend data
- `npm run pipeline:run`: execute the backend ingestion pipeline with ingestion job and raw-batch tracking
- `npm run ai:context`: print product-manual JSON context
- `npm run ai:report`: print the latest Markdown weekly report
- `npm run ai:repo -- owner/name`: print a repository dossier for one repo
- `npm run env:check:prod`: validate production environment variables before deployment
- `npm run prisma:generate:prod`: generate the Prisma client against the production PostgreSQL schema
- `npm run db:push:prod`: push the production PostgreSQL schema
- `npm run build:prod`: build the app against the production PostgreSQL schema
- `npm run gitnexus:analyze`: refresh the GitNexus code graph after code changes

## Backend Jobs

- The UI no longer triggers collection directly.
- Use scripts, GitHub Actions, cron, or an internal job runner to execute ingestion.
- The workflow at [`.github/workflows/trend-pipeline.yml`](./.github/workflows/trend-pipeline.yml) runs pipeline ingestion and collection sync on the backend.
- Use [`.env.production.example`](./.env.production.example) as the production environment template.

## Collections

- Route: `/{locale}/collections`
- Detail route: `/{locale}/collections/{slug}`
- API: `GET /api/collections`
- Detail API: `GET /api/collections/{slug}`
- Subscription center: `/{locale}/subscriptions`
- Subscription API: `POST /api/subscriptions`

Collections are stored in the database as first-class entities and can be seeded via `npm run collections:sync`.

## Product Manual

- Route: `/{locale}/ai`
- Role: product manual
- Covers: CLI access, subscriptions, troubleshooting, export formats, and HTTP entry points
- JSON endpoint: `GET /api/ai/context`

## Docs

- Product: [English](./docs/product.md) | [中文](./docs/product.zh-CN.md)
- Architecture: [English](./docs/architecture.md) | [中文](./docs/architecture.zh-CN.md)
- Collections architecture record: [中文](./docs/collections-architecture-plan.zh-CN.md)
- Collections frontend gap record: [中文](./docs/frontend-collections-gap.zh-CN.md)
- Backend ingestion layered architecture: [中文](./docs/backend-ingestion-layered-architecture.zh-CN.md)
- Database design: [中文](./docs/database-design.zh-CN.md)
- Deployment guide: [中文](./docs/deployment.zh-CN.md)
- Domestic subscription implementation: [中文](./docs/subscription-domestic-platform.zh-CN.md)
- Product manual: [English](./docs/ai-onboarding.md) | [中文](./docs/ai-onboarding.zh-CN.md)

## GitNexus

After major code changes, refresh the code graph:

```bash
npm run gitnexus:analyze
```

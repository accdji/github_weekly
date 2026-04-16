# Product Manual

[中文版本](./ai-onboarding.zh-CN.md)

This document mirrors the `/{locale}/ai` page. The route is still `ai` for compatibility, but its role is now the product manual rather than an AI-only toolbox.

## What This Manual Covers

- CLI access for local operators
- Primary user roles and their use cases
- Data freshness, update rhythm, and operational expectations
- Subscription entry points, delivery jobs, and management actions
- Troubleshooting for the most common data and workflow issues
- Export formats supported by the dashboard and scripts
- Core HTTP endpoints and files to read first

## Who This Is For

- Developer or researcher
  Discover rising repositories, inspect momentum, and export ranked lists quickly.
- Content or community operator
  Track hot repositories, curate collections, and publish weekly summaries.
- Internal tool or AI agent
  Consume structured JSON, repository dossiers, and stable API payloads.

## Quick Start

1. Run `npm run ai:context`
2. Read `docs/architecture.md`
3. If data just changed, run `npm run collect:daily` and `npm run build:weekly`
4. If collection content changed, run `npm run collections:sync`
5. If code changed materially, run `npm run gitnexus:analyze`

## CLI Access

Environment preparation:

1. Run `npm install`
2. Run `npm run prisma:generate`
3. Run `npm run db:push`
4. Set `GH_TOKEN` in `.env` if authenticated GitHub requests are required

Key commands:

- `npm run collect:daily`
  Refresh repository candidates and write fresh snapshots.
- `npm run sync:stars`
  Backfill stargazer history when GitHub coverage allows it.
- `npm run build:weekly`
  Rebuild the weekly ranking from the latest snapshots.
- `npm run collections:sync`
  Rebuild database-backed collections and summary cards.
- `npm run pipeline:run`
  Run the backend ingestion pipeline end to end.
- `npm run worker:subscriptions`
  Generate and process subscription digest deliveries.
- `npm run ai:context`
  Print machine-readable product-manual JSON.
- `npm run ai:report`
  Print the latest weekly report in Markdown.
- `npm run ai:repo -- owner/name`
  Print one repository dossier in JSON.

## Freshness and Update Rhythm

- The frontend is read-only
  Dashboard, collections, and manual pages do not trigger collection by themselves.
- Snapshot freshness depends on backend jobs
  Use `npm run collect:daily` or the backend pipeline to refresh repository data.
- Collection freshness depends on a second step
  Run `npm run collections:sync` after repository ingestion if you want collection cards and summaries to catch up.
- Weekly-star coverage can be partial
  Until enough comparable snapshots exist, weekly-star values may show partial coverage such as `1d partial`.

## Subscriptions

The current product already supports end-to-end subscription handling:

- Collection follow from the UI
  Open a collection detail page and submit the subscribe form.
- Subscription center review
  Use `/{locale}/subscriptions` to inspect stored follows, repository subscriptions, delivery logs, and management actions.
- Programmatic create
  Send `POST /api/subscriptions` with `collectionId`, `repositoryId`, or `keywords`.
- Verification and management
  Use the verification link from `/api/subscriptions/verify` and manage frequency, pause, or unsubscribe from the subscription center.
- Worker-driven delivery
  Run `npm run worker:subscriptions` or `POST /api/workers/subscriptions` to create and process digest deliveries.

Example payload:

```json
{
  "email": "ops@example.com",
  "locale": "zh-CN",
  "channel": "email",
  "subscriptionType": "collection",
  "digestFrequency": "weekly",
  "collectionId": "{{collectionId}}"
}
```

Current delivery surface:

- Subscription intent is persisted in the database
- Delivery jobs and delivery logs are stored in the outbox
- Email and webhook-style channels can be processed by the subscription worker

## Troubleshooting

- Today stars and weekly stars look identical
  Run `npm run collect:daily` again and refresh the page. The product now calculates today from midnight and week with up to 7 days of best-effort history.
- Weekly stars show partial coverage
  This is expected when fewer than 7 days of comparable snapshots exist. The UI and context JSON label the coverage explicitly.
- Collections look stale after ingestion
  Run `npm run collections:sync` after repository ingestion.
- A subscription exists but nothing was delivered
  Run `npm run worker:subscriptions` or `POST /api/workers/subscriptions`, then inspect the delivery log in `/{locale}/subscriptions`.
- GitNexus reports a stale or locked graph
  Run `npm run gitnexus:analyze`. If the local graph lock persists, stop the conflicting process and rerun it.

## Export Formats

- CSV
  Export the currently filtered dashboard rows for spreadsheets.
- JSON
  Export structured dashboard rows, product-manual context, or repository dossiers.
- Markdown
  Export weekly summaries for reports, newsletters, or internal updates.

## Export Field Guide

- `fullName`
  Repository owner/name identifier used across dashboard rows, exports, and dossiers.
- `weeklyStars`
  Best-effort star growth in the latest weekly window, capped at 7 days.
- `todayStars`
  Star growth since local midnight based on comparable snapshots.
- `stars`
  Current total stargazer count from the latest repository snapshot.
- `historyCoverageDays`
  How many days of comparable history currently support weekly-star calculation.

## Current Product Boundaries

- Weekly stars can stay partial until enough comparable snapshots accumulate.
- External delivery quality still depends on the subscriber's configured email or webhook target.
- The route remains `/{locale}/ai` for compatibility even though the page is now the product manual.

## HTTP Entry Points

- `GET /api/ai/context`
  Product manual context JSON.
- `GET /api/report`
  Weekly Markdown report.
- `GET /api/dashboard`
  Dashboard data payload.
- `GET /api/collections`
  Collections gallery payload.
- `GET /api/collections/{slug}`
  Collection detail payload.
- `GET|POST|PATCH /api/subscriptions`
  Create, inspect, or manage collection, repository, and keyword subscriptions.
- `GET /api/subscriptions/verify`
  Verify a subscriber channel token.
- `GET|POST /api/collections/submissions`
  Create or inspect public collection submissions.
- `PATCH /api/collections/submissions/{id}`
  Approve, reject, or assign editors in the review workspace.
- `POST /api/workers/subscriptions`
  Trigger the subscription digest worker.

## Read First

- `lib/dashboard.ts`
- `lib/ranking.ts`
- `lib/collections.ts`
- `lib/subscriptions.ts`
- `lib/ai-toolkit.ts`
- `components/dashboard-app.tsx`
- `components/collection-subscribe-form.tsx`
- `components/repository-subscribe-form.tsx`
- `app/[locale]/ai/page.tsx`
- `app/[locale]/subscriptions/page.tsx`
- `app/[locale]/collections/submit/page.tsx`
- `app/[locale]/collections/review/page.tsx`
- `lib/collection-submissions.ts`
- `lib/workers.ts`
- `prisma/schema.prisma`

# Architecture

[中文文档](./architecture.zh-CN.md)

## Overview

The system is organized into six layers:

1. Repository ingestion
2. Persistence and metrics storage
3. Ranking and collection aggregation
4. Read-only service APIs
5. Frontend experience
6. AI and operations tooling

## Current Direction

The product is moving away from browser-triggered collection and toward backend-owned jobs.

Key architectural rules now are:

- The browser reads data but does not trigger ingestion jobs.
- Collections are first-class entities in the database.
- Backend jobs own ranking rebuilds and collection synchronization.
- Repository discovery has started moving to `ODS -> DWD`, with raw search payloads captured before normalization.
- Collection detail pages are prepared to show year-to-date stars, PR, issue, and contributor signals.
- Read-heavy pages and APIs use short TTL caching plus `stale-while-revalidate` headers to keep interaction latency predictable.

## Data Flow

1. `discoverRepositories()` uses the GitHub Search API to build a candidate pool.
2. The run is recorded in `IngestionJob`, `IngestionTask`, and `IngestionBatch`.
3. Raw repository payloads are stored in `RawGitHubRepository`.
4. Repository metadata is normalized into `Repository` and current metrics are written to `Snapshot`.
5. Recent stargazer history is backfilled into `StarDailyStat` when a token is available.
6. `buildWeeklyRanking()` computes weekly deltas and scores.
7. `syncSeedCollections()` builds curated collections and stores `Collection`, `CollectionItem`, `CollectionTrendSnapshot`, and `CollectionSummarySnapshot`.
8. Read APIs and pages consume stored results instead of triggering ingestion directly.

## Persistence

### Core Models

- `Repository`: current repository state
- `Snapshot`: point-in-time stars, forks, watchers, and issue totals
- `StarDailyStat`: daily star additions
- `WeeklyRanking`: ranked weekly output
- `Collection`: curated collection metadata
- `CollectionItem`: repository membership inside a collection
- `CollectionTag`: collection taxonomy
- `CollectionTrendSnapshot`: collection-level aggregate snapshot
- `CollectionSummarySnapshot`: collection index snapshot for gallery views
- `PullRequestDailyStat`: year-to-date PR trend storage
- `IssueDailyStat`: year-to-date issue trend storage
- `ContributorWeeklyStat`: week-grain contributor trend storage
- `JobRun`: observable backend jobs
- `IngestionJob / IngestionTask / IngestionBatch`: operational ingestion tracking
- `RawGitHubRepository`: raw repository payload retention for replay and audit
- `Subscription`: persisted keyword, repository, or collection subscriptions

## Runtime Modules

### Ingestion

- [`lib/github.ts`](../lib/github.ts): GitHub REST and GraphQL access
- [`lib/collector.ts`](../lib/collector.ts): compatibility wrapper over the new repository ingestion flow
- [`lib/ingestion/jobs.ts`](../lib/ingestion/jobs.ts): ingestion job, task, and batch tracking
- [`lib/ingestion/repositories.ts`](../lib/ingestion/repositories.ts): repository discovery with raw-store and normalization steps
- [`lib/star-history.ts`](../lib/star-history.ts): star-history sync and range sums

### Aggregation

- [`lib/ranking.ts`](../lib/ranking.ts): weekly ranking calculation
- [`lib/dashboard.ts`](../lib/dashboard.ts): dashboard payload and ranking views
- [`lib/archive.ts`](../lib/archive.ts): archive and repository history views
- [`lib/collections.ts`](../lib/collections.ts): collection sync, collection index, and detail aggregation
- [`lib/collection-seed.ts`](../lib/collection-seed.ts): initial collection definitions

### Operations

- [`lib/jobs.ts`](../lib/jobs.ts): job run tracking
- [`lib/subscriptions.ts`](../lib/subscriptions.ts): subscription persistence
- [`lib/runtime-cache.ts`](../lib/runtime-cache.ts): in-process TTL cache for expensive read paths
- [`lib/http-cache.ts`](../lib/http-cache.ts): cache-control response helpers
- [`scripts/run-pipeline.ts`](../scripts/run-pipeline.ts): backend ingestion pipeline
- [`scripts/sync-collections.ts`](../scripts/sync-collections.ts): curated collection sync
- [`.github/workflows/trend-pipeline.yml`](../.github/workflows/trend-pipeline.yml): scheduled backend workflow

### Frontend

- [`components/dashboard-app.tsx`](../components/dashboard-app.tsx): read-only dashboard UI
- [`app/[locale]/collections/page.tsx`](../app/[locale]/collections/page.tsx): collections index
- [`app/[locale]/collections/[slug]/page.tsx`](../app/[locale]/collections/[slug]/page.tsx): collection detail
- [`components/collection-subscribe-form.tsx`](../components/collection-subscribe-form.tsx): collection subscription entry point
- [`app/[locale]/subscriptions/page.tsx`](../app/[locale]/subscriptions/page.tsx): subscription center
- [`app/[locale]/jobs/page.tsx`](../app/[locale]/jobs/page.tsx): backend job center
- [`app/[locale]/ai/page.tsx`](../app/[locale]/ai/page.tsx): product manual

## Read Performance

- `lib/runtime-cache.ts` provides short-lived in-process caching for expensive read aggregations.
- APIs return `Cache-Control` headers with `stale-while-revalidate` so repeated reads avoid full recomputation.
- High-frequency routes such as dashboard, collections, jobs, reports, product-manual context, and repository details now use short TTL cache windows.

## Job Model

The intended execution model is:

- CLI or workflow starts jobs
- pipeline jobs write summary status to `JobRun`
- ingestion stages write detailed status to `IngestionJob`, `IngestionTask`, and `IngestionBatch`
- jobs refresh repository data, rankings, collections, and subscription-facing snapshots
- frontend pages read stored results

This keeps long-running work out of interactive page requests and prepares the project for a future worker-based execution model.

## Deployment Notes

### Local MVP

- SQLite
- manual scripts
- local collection sync via `npm run collections:sync`

### Production

- PostgreSQL
- GitHub Actions or cron for scheduling
- backend-only ingestion endpoints or internal runners
- persistent secrets for `DATABASE_URL` and `GITHUB_TOKEN`
- GitNexus refresh after major code changes

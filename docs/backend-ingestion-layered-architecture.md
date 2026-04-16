# Backend Ingestion Layered Architecture

[中文版本](./backend-ingestion-layered-architecture.zh-CN.md)

Updated: 2026-04-16

## Summary

The backend has moved toward a layered model:

- ingestion job tracking
- raw repository capture
- normalized repository and trend stats
- aggregate read models for dashboard and collections
- separate worker execution for subscription delivery

## Current State

Already in place:

- `IngestionJob`, `IngestionTask`, `IngestionBatch`
- `RawGitHubRepository`
- normalized repository and snapshot writes
- collection snapshot aggregation
- independent subscription worker execution

## Logical Layers

### ODS / Raw Capture

- `RawGitHubRepository`
- ingestion batches and cursors

### DWD / Normalized Detail

- `Repository`
- `Snapshot`
- `StarDailyStat`
- `PullRequestDailyStat`
- `IssueDailyStat`
- `ContributorWeeklyStat`

### ADS / Read Models

- `WeeklyRanking`
- `CollectionTrendSnapshot`
- `CollectionSummarySnapshot`

### Worker / Delivery

- `Subscription`
- `DeliveryJob`
- `DeliveryLog`
- `WorkerRun`

## Why This Matters

- page requests stay read-only
- long-running work stays in jobs or workers
- aggregate tables make collection pages faster and more predictable
- subscription delivery can evolve without coupling to page rendering

## Recommended Direction

Keep extending the layered approach by:

1. adding more raw capture only where replay or auditing is valuable
2. preserving normalized stats as the source for trend calculations
3. avoiding expensive per-request recomputation on user-facing pages

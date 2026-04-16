# Database Design

[中文版本](./database-design.zh-CN.md)

Updated: 2026-04-16

## Purpose

The schema supports three broad concerns:

1. repository collection and historical ranking
2. collections and collection snapshots
3. subscriptions, delivery, and worker execution

## Core Entities

### Repository And Ranking

- `Repository`
- `Snapshot`
- `WeeklyRanking`
- `StarDailyStat`
- `PullRequestDailyStat`
- `IssueDailyStat`
- `ContributorWeeklyStat`

### Collection Layer

- `Collection`
- `CollectionItem`
- `CollectionTag`
- `CollectionTagMap`
- `CollectionTrendSnapshot`
- `CollectionSummarySnapshot`
- `CollectionSubmission`
- `CollectionEditor`

### Subscription Layer

- `Subscriber`
- `Subscription`
- `DeliveryJob`
- `DeliveryLog`

### Operational Layer

- `JobRun`
- `IngestionJob`
- `IngestionTask`
- `IngestionBatch`
- `RawGitHubRepository`
- `WorkerRun`

## Design Notes

- repository history is stored separately from weekly ranking output
- collection snapshots pre-aggregate metrics for fast page reads
- submissions and editors are modeled as first-class database records
- subscriptions are separated into subscriber identity, rule, and delivery log layers
- worker runs are tracked independently from ingestion jobs

## Read Patterns

- dashboard reads ranking, repository, and snapshot-derived data
- collections index/detail read collection snapshot tables first
- subscription center reads subscription, subscriber, delivery job, and delivery log tables
- jobs page reads pipeline jobs, ingestion jobs, and worker runs

## Write Patterns

- collection and ranking jobs refresh aggregate tables
- collection review flow creates or updates `Collection`, `CollectionItem`, and `CollectionEditor`
- subscription actions update `Subscription` state and create delivery jobs
- worker execution processes pending deliveries and writes logs

## Local And Production

- local schema: SQLite
- production schema: PostgreSQL

Both schemas should stay aligned when fields or models change.

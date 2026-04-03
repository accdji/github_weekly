# Architecture

[中文版](./architecture.zh-CN.md)

## Overview

The system has five layers:

1. collector
2. storage
3. ranking
4. service API
5. frontend

## Data Flow

1. scheduled collector searches GitHub repositories
2. repository records are upserted into the database
3. snapshot records are created with current metrics
4. weekly builder computes 7-day deltas and ranks repositories
5. frontend and API read from the weekly ranking table

## Modules

### Collector

Responsibilities:

- search GitHub for candidate repositories
- fetch repository metadata
- normalize the response into local models

### Storage

Core tables:

- `Repository`
- `Snapshot`
- `WeeklyRanking`

### Ranking

Responsibilities:

- compare the latest snapshot with the snapshot from 7 days earlier
- compute star and fork deltas
- produce a sortable score

### API

Initial endpoints:

- `GET /api/weekly`
- `GET /api/repositories/[owner]/[name]`

### Frontend

The homepage reads the newest weekly ranking and renders a clear table view.

## Scheduling

### Daily Job

- run once per day
- update repository metadata
- insert fresh snapshots

### Weekly Job

- run once per week
- build ranking rows for a target week

## Deployment Path

### Local MVP

- SQLite
- manual or local scheduled execution

### Production

- PostgreSQL
- GitHub Actions or server cron
- hosted Next.js frontend

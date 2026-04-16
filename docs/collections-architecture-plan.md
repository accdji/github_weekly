# Collections Architecture Record

[中文版本](./collections-architecture-plan.zh-CN.md)

Updated: 2026-04-16

## What This Document Covers

This is the architecture record for the collections surface: how collections are modeled, how snapshots are generated, and how submission/review now fit into the system.

## Current Structure

- `Collection` is a first-class database entity
- `CollectionItem` stores repository membership and ordering
- `CollectionTrendSnapshot` and `CollectionSummarySnapshot` support fast reads
- `CollectionSubmission` supports public submission
- `CollectionEditor` supports editorial workflow

## Implemented Product Flow

1. seed sync or approved submission creates/updates a collection
2. collection items and tags are written to the database
3. snapshot aggregation refreshes collection summaries and trends
4. index and detail pages read those snapshots
5. subscriptions can follow the collection and create digest jobs

## Key Decisions

- backend jobs own collection freshness
- collection pages read aggregate tables instead of recomputing everything live
- submission and review are part of the same persistence model
- related collections are resolved from tag overlap
- archive and year browsing are driven by available snapshot years

## Operational Notes

- `npm run collections:sync` refreshes seeded collections
- approved submissions can publish community collections
- review workspace can assign editors without removing any existing collection features

## Remaining Architectural Discipline

- keep collection detail pages focused on read models
- keep editorial actions in routes/services, not page code
- keep historical snapshots append-friendly whenever possible

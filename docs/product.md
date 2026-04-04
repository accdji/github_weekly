# Product Design

[中文文档](./product.zh-CN.md)

## Positioning

Open Source Trend Intelligence Desk is a bilingual open-source intelligence product built on owned snapshots, weekly rankings, curated collections, archives, subscriptions, and backend job visibility.

It is not a mirror of GitHub Trending and it is not a browser-side crawler.

## Target Users

- Developers who want to discover rising open-source projects early
- Research and content teams tracking ecosystem momentum
- Product, DevRel, and investment teams watching AI, infra, and developer-tool categories

## Core Experience

1. Dashboard
   A read-only control room for filtering, comparing, exporting, and browsing rising repositories.
2. Collections
   A gallery-style collection index and detail experience inspired by collection-driven discovery products, now including subscribe and follow entry points.
3. Archive
   Historical weekly snapshots and repository history pages.
4. Methodology
   A transparent explanation of data coverage, scoring, and metric definitions.
5. Jobs
   A backend job center for pipeline visibility and operational trust.
6. Subscription Center
   A shared surface for keyword alerts and collection follows.
7. Product Manual
   A practical handbook that explains CLI access, exports, subscriptions, and troubleshooting.

## Collections Direction

The collections surface intentionally follows the OSS Insight Collections pattern at the information-architecture level:

- collection index page
- collection cards with repo previews
- featured gallery sections and tag browse
- collection detail hero
- trend section
- repository table
- collection subscription CTA
- related collections
- metric methodology

The first version does not attempt a pixel-perfect clone. It keeps the project visual language while matching the product structure and key interactions.

## What Is Explicitly Out of Scope For Now

- browser-triggered collection runs
- public new-collection submission flow
- multi-year continuous collection history
- full community editing or moderation system

## Feature Priorities

### P0

- Reliable backend ingestion and weekly ranking
- Database-backed collections
- Collection follow / subscription flow
- Collection index and collection detail pages
- Job center aligned with backend-only execution
- Updated docs and product manual

### P1

- Year-to-date PR, issue, and contributor collection metrics
- Richer collection curation workflows
- More browse modes such as featured, A-Z, and archive views

### P2

- Email or team notifications
- Multi-editor collection workflows
- Dedicated worker execution model

## Success Signals

- Returning visits to collections and dashboard surfaces
- Number of collections with healthy repository coverage
- Successful backend runs per week
- Freshness of collection snapshots
- Product manual usage and report export usage

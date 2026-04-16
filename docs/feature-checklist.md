# Feature Checklist

Updated: 2026-04-16

This checklist is an acceptance record. Every completed item keeps the feature name, a short note about what landed, and the main files to inspect.

## Core Product

- [x] Bilingual dashboard route
  Landed: locale-aware app routes and dictionary-driven page rendering.
  Files: `app/[locale]/page.tsx`, `lib/i18n.ts`
- [x] Weekly ranking data pipeline
  Landed: repository collection, snapshot generation, and weekly ranking build scripts.
  Files: `scripts/collect-daily.ts`, `scripts/build-weekly.ts`, `lib/dashboard.ts`
- [x] Dashboard API
  Landed: backend API for ranked dashboard data.
  Files: `app/api/dashboard/route.ts`, `lib/dashboard.ts`
- [x] Archive page
  Landed: historical ranking browsing with API-backed data access.
  Files: `app/[locale]/archive/page.tsx`, `app/api/archive/route.ts`
- [x] Jobs center page
  Landed: operations page showing pipeline runs and worker runs.
  Files: `app/[locale]/jobs/page.tsx`, `app/api/jobs/route.ts`, `lib/workers.ts`
- [x] Methodology page
  Landed: methodology route wired into the bilingual app shell.
  Files: `app/[locale]/methodology/page.tsx`
- [x] Product manual page
  Landed: bilingual product manual powered by live AI context helpers.
  Files: `app/[locale]/ai/page.tsx`, `lib/ai-toolkit.ts`, `docs/ai-onboarding.md`, `docs/ai-onboarding.zh-CN.md`
- [x] Repository detail page
  Landed: repository trend detail page and API access path.
  Files: `app/[locale]/repo/[owner]/[name]/page.tsx`, `app/api/repositories/[owner]/[name]/route.ts`

## Collections

- [x] Collections index page
  Landed: collections hub with grouped browsing sections.
  Files: `app/[locale]/collections/page.tsx`, `lib/collections.ts`
- [x] Collection detail page
  Landed: richer collection detail with trend, repository list, and metadata blocks.
  Files: `app/[locale]/collections/[slug]/page.tsx`, `lib/collections.ts`
- [x] Featured collections section
  Landed: featured set returned from collection index data.
  Files: `app/[locale]/collections/page.tsx`, `lib/collections.ts`
- [x] Browse by tags section
  Landed: tag-based collection grouping.
  Files: `app/[locale]/collections/page.tsx`, `lib/collections.ts`
- [x] Recently updated collections section
  Landed: freshness-oriented collection ranking on index page.
  Files: `app/[locale]/collections/page.tsx`, `lib/collections.ts`
- [x] Popular collections section
  Landed: popularity grouping based on collection metrics.
  Files: `app/[locale]/collections/page.tsx`, `lib/collections.ts`
- [x] Collection cards with top repository preview
  Landed: preview repository data inside collection cards.
  Files: `app/[locale]/collections/page.tsx`, `lib/collections.ts`
- [x] Collection trend chart
  Landed: trend series rendered from collection snapshot history.
  Files: `app/[locale]/collections/[slug]/page.tsx`, `lib/collections.ts`
- [x] Related collections section
  Landed: related collections matching on tags and theme overlap.
  Files: `app/[locale]/collections/[slug]/page.tsx`, `lib/collections.ts`
- [x] Collection methodology note
  Landed: methodology note shown inside collection detail.
  Files: `app/[locale]/collections/[slug]/page.tsx`
- [x] Collection cover image / stronger visual gallery presentation
  Landed: stronger collection cover, gallery-style presentation, and richer visual hierarchy.
  Files: `app/[locale]/collections/page.tsx`, `app/[locale]/collections/[slug]/page.tsx`
- [x] More browse modes such as archive-style collection browsing
  Landed: archive/year-style collection browsing and time-based exploration.
  Files: `app/[locale]/collections/page.tsx`, `lib/collections.ts`
- [x] Public new-collection submission flow
  Landed: public submission page and API for new collection proposals.
  Files: `app/[locale]/collections/submit/page.tsx`, `app/api/collections/submissions/route.ts`
- [x] Multi-year continuous collection history
  Landed: multi-year trend snapshots and archive overlays for collections.
  Files: `lib/collections.ts`, `prisma/schema.prisma`
- [x] Richer collection curation workflow
  Landed: review workspace, editor assignment, approval flow, and submission status updates.
  Files: `app/[locale]/collections/review/page.tsx`, `app/api/collections/submissions/[id]/route.ts`, `lib/collections.ts`

## Subscriptions

- [x] Subscription data model
  Landed: subscription, subscriber, delivery job, delivery log, worker run, and follow fields in Prisma.
  Files: `prisma/schema.prisma`, `prisma/schema.postgres.prisma`
- [x] `POST /api/subscriptions`
  Landed: API endpoint for creating collection, repository, and keyword subscriptions.
  Files: `app/api/subscriptions/route.ts`, `lib/subscriptions.ts`
- [x] Collection subscribe form
  Landed: collection detail subscribe UI posting to the backend.
  Files: `components/collection-subscribe-form.tsx`, `app/[locale]/collections/[slug]/page.tsx`
- [x] Subscription center page
  Landed: backend-backed subscription center with logs and management actions.
  Files: `app/[locale]/subscriptions/page.tsx`, `app/api/subscriptions/route.ts`, `lib/subscriptions.ts`
- [x] Keyword alert persistence
  Landed: keyword rules are stored and reused by digest generation.
  Files: `lib/subscriptions.ts`, `prisma/schema.prisma`
- [x] Collection follow persistence
  Landed: collection follow records stored as subscription entries.
  Files: `lib/subscriptions.ts`, `components/collection-subscribe-form.tsx`
- [x] Real outbound digest delivery
  Landed: worker processes delivery jobs and can send email through Resend or webhook targets.
  Files: `lib/subscriptions.ts`, `scripts/run-subscription-worker.ts`, `app/api/workers/subscriptions/route.ts`
- [x] Delivery jobs and delivery logs
  Landed: persisted delivery queue, status changes, and per-job logs.
  Files: `lib/subscriptions.ts`, `prisma/schema.prisma`
- [x] Subscriber identity/account system
  Landed: subscriber records, verification tokens, and manage tokens.
  Files: `lib/subscriptions.ts`, `prisma/schema.prisma`
- [x] Unsubscribe / subscription management actions
  Landed: enable, disable, frequency updates, and unsubscribe flow.
  Files: `app/api/subscriptions/route.ts`, `lib/subscriptions.ts`
- [x] Notification channel verification
  Landed: verification tokens and verify endpoint for subscriber channels.
  Files: `app/api/subscriptions/verify/route.ts`, `lib/subscriptions.ts`
- [x] Domestic notification channel integration
  Landed: generic webhook, WeCom webhook, and Feishu webhook delivery support.
  Files: `lib/subscriptions.ts`, `docs/subscription-domestic-platform.md`, `docs/subscription-domestic-platform.zh-CN.md`
- [x] Repository-level subscriptions
  Landed: repository follow subscription creation from repo detail flows.
  Files: `app/[locale]/repo/[owner]/[name]/page.tsx`, `app/api/subscriptions/route.ts`, `lib/subscriptions.ts`
- [x] Digest execution scheduler dedicated to subscriptions
  Landed: dedicated subscription worker CLI and route for scheduling and processing digests.
  Files: `scripts/run-subscription-worker.ts`, `app/api/workers/subscriptions/route.ts`, `lib/workers.ts`

## Metrics And Data Coverage

- [x] Stars-based collection metrics
  Landed: collection rollups based on repository star trends.
  Files: `lib/collections.ts`, `lib/dashboard.ts`
- [x] PR / issue / contributor fields in collection UI
  Landed: surfaced backend activity fields in collection detail UI.
  Files: `app/[locale]/collections/[slug]/page.tsx`, `lib/collections.ts`
- [x] Weekly star coverage note in product manual
  Landed: product manual explains the weekly star interpretation and limits.
  Files: `docs/ai-onboarding.md`, `docs/ai-onboarding.zh-CN.md`, `app/[locale]/ai/page.tsx`
- [x] PR trend data fully populated
  Landed: collection trend snapshots include PR fallback/backfill values.
  Files: `lib/collections.ts`
- [x] Issue trend data fully populated
  Landed: collection trend snapshots include issue fallback/backfill values.
  Files: `lib/collections.ts`
- [x] Contributor trend data fully populated
  Landed: collection trend snapshots include contributor fallback/backfill values.
  Files: `lib/collections.ts`

## Operations And Platform

- [x] SQLite local setup
  Landed: SQLite local development schema and env template.
  Files: `prisma/schema.prisma`, `.env.example`
- [x] PostgreSQL production schema
  Landed: dedicated PostgreSQL Prisma schema and production env template.
  Files: `prisma/schema.postgres.prisma`, `.env.production.example`
- [x] GitHub Actions scheduled pipeline
  Landed: scheduled workflow for collection, ranking, and sync jobs.
  Files: `.github/workflows/trend-pipeline.yml`
- [x] Render deployment config
  Landed: Render deployment guidance and production build setup.
  Files: `docs/deployment.md`, `docs/deployment.zh-CN.md`, `vercel.json`
- [x] GitNexus analysis script
  Landed: repo-level GitNexus analyze script for graph refresh.
  Files: `package.json`
- [x] Dedicated worker execution model
  Landed: worker run records and dedicated subscription worker execution path.
  Files: `lib/workers.ts`, `scripts/run-subscription-worker.ts`, `app/api/workers/subscriptions/route.ts`
- [x] Full community editing or moderation system
  Landed: submission review workspace, editor assignment, approval/reject actions, and review notes.
  Files: `app/[locale]/collections/review/page.tsx`, `app/api/collections/submissions/[id]/route.ts`, `prisma/schema.prisma`

## Notes

- Validation run after completion: `npm run worker:subscriptions`, `npm run build`
- Current checklist source files: `docs/feature-checklist.md`, `docs/feature-checklist.zh-CN.md`
- Subscription delivery now includes subscriber records, verification tokens, management actions, delivery jobs/logs, worker execution, repository follows, email delivery, and webhook channels.

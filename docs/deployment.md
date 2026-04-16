# Deployment Guide

[中文版本](./deployment.zh-CN.md)

Updated: 2026-04-16

## Overview

The project is deployed as a Render web service backed by Neon PostgreSQL, with GitHub Actions responsible for scheduled data refresh.

## Runtime Stack

- Web hosting: Render
- Production database: Neon PostgreSQL
- Scheduler: GitHub Actions
- ORM: Prisma
- Build target: Next.js production build

## Required Environment

Required:

- `DATABASE_URL`

Recommended:

- `GH_TOKEN`
- `RESEND_API_KEY` if you want live email delivery

Common runtime variables:

- `TOP_LANGUAGES`
- `COLLECT_PER_QUERY`
- `STAR_HISTORY_DAYS`
- `STAR_HISTORY_MAX_PAGES`
- `SEARCH_QUERY` optional
- `EMAIL_FROM` when `RESEND_API_KEY` is configured
- `EMAIL_REPLY_TO` optional

## Deployment Flow

1. Push code to `main`
2. Render auto-deploys the web service
3. Run schema updates with:
   - `npm run prisma:generate:prod`
   - `npm run db:push:prod`
4. Verify the runtime:
   - site homepage
   - `/api/dashboard`
   - `/api/jobs`
   - `/api/subscriptions`

## Scheduled Jobs

GitHub Actions should run:

- `npm run collect:daily`
- `npm run build:weekly`
- `npm run collections:sync`
- `npm run worker:subscriptions`

This keeps ranking, collections, and subscription delivery in sync.

If `RESEND_API_KEY` and `EMAIL_FROM` are configured, the subscription worker sends email digests through Resend. Without them, email jobs are still persisted in the delivery outbox and logs remain visible in the subscription center.

## Smoke Checks

After deployment, verify:

- dashboard loads
- collections index/detail load
- submission and review pages render
- subscription center renders existing logs
- jobs page shows pipeline and worker runs

## Notes

- The web app is read-only for collection and ranking generation; backend jobs own freshness.
- Subscription digests can be processed through the dedicated worker route or CLI script.
- Email delivery falls back to the internal outbox when no provider credentials are configured.

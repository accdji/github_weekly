# GitHub Weekly

[中文说明](./README.zh-CN.md)

A small product for collecting, ranking, and displaying weekly hot GitHub repositories.

## Goals

- Collect GitHub repository data on a schedule
- Persist daily snapshots for historical analysis
- Build a weekly ranking based on growth
- Expose the results through a web UI and API

## Stack

- Next.js
- TypeScript
- Prisma
- SQLite for local MVP

## Quick Start

1. Install dependencies
2. Copy `.env.example` to `.env`
3. Set `GITHUB_TOKEN` if you want authenticated GitHub requests and stargazer-based weekly star backfill
4. Run `npx prisma db push`
5. Run `npm run collect:daily`
6. Run `npm run build:weekly`
7. Run `npm run dev`

## Scripts

- `npm run dev`: start the web app
- `npm run collect:daily`: fetch candidate repositories and save snapshots
- `npm run build:weekly`: generate the latest weekly ranking
- `npm run prisma:generate`: generate Prisma client

## Project Structure

- `app/`: Next.js pages and API routes
- `components/`: shared UI pieces
- `docs/`: product and architecture docs
- `lib/`: database, GitHub, and ranking logic
- `prisma/`: schema
- `scripts/`: collection and ranking jobs

## Documentation

- Product design: [English](./docs/product.md) | [中文](./docs/product.zh-CN.md)
- Architecture: [English](./docs/architecture.md) | [中文](./docs/architecture.zh-CN.md)

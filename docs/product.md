# Product Design

[中文版](./product.zh-CN.md)

## Positioning

GitHub Weekly is not a mirror of GitHub Trending. It is a weekly ranking product built from our own snapshot history.

## MVP

The first version focuses on:

- collecting candidate repositories from GitHub
- storing repository and snapshot history
- generating a weekly hot ranking
- displaying the ranking on a website

## Target Users

- developers who want to discover rising open source projects
- content creators who need weekly GitHub topics
- teams tracking trends in AI and developer tooling

## Core Pages

### Home

- current weekly top list
- score, star delta, total stars
- language and update time

### Weekly Archive

- historical weekly rankings

### Repository Detail

- repository metadata
- latest score
- recent snapshot history

## Differentiators

- historical snapshot database instead of current-only display
- weekly growth ranking rather than total-star sorting
- room for Chinese summaries and category tags
- future support for language-specific and topic-specific boards

## Data Strategy

### Primary Source

GitHub REST API is the primary source for the MVP because it is structured and stable.

### Supplemental Source

GitHub Trending can be added later as a secondary signal, not as the only source.

## Ranking Strategy

The MVP score is based on:

- 7-day star delta
- 7-day fork delta
- recency bonus from last push time

This can evolve later with topic boosts, trending boosts, and freshness decay.

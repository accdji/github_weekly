# Domestic Subscription Channel Plan

[中文版本](./subscription-domestic-platform.zh-CN.md)

Updated: 2026-04-16

## Goal

Document how domestic-friendly delivery channels map onto the current subscription system.

## Current Support

The product already supports:

- in-app delivery
- email subscribers with optional Resend-backed delivery
- custom webhook channels
- WeCom webhook targets
- Feishu webhook targets
- worker-driven digest processing

## Practical Channel Strategy

### Low-Friction Baseline

- in-app outbox
- email with provider fallback to outbox

### Domestic Team Channels

- WeCom webhook
- Feishu webhook

### Custom Integrations

- generic webhook target for internal relays or gateways

## Operational Model

1. user creates a subscription rule
2. subscriber identity and management token are stored
3. worker creates delivery jobs
4. delivery logs record success or failure
5. subscription center exposes the current state

## Notes

- this document is now partly a deployment/reference guide because the core domestic channel routing is already implemented
- email delivery works immediately when `RESEND_API_KEY` and `EMAIL_FROM` are configured
- future work is more about channel quality and provider-specific polish than basic product support

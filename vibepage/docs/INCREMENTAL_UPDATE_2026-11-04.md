# VibePage incremental update — 2026-11-04

This change set compares the supplied `VibePage-v2(1).zip` with the current `feature/vibepage-responsive-refresh` candidate in `wll777z/project-IA`. It preserves the existing VibePage implementation and adds the ZIP's account, recovery and billing changes, plus the fixes and regression coverage described below.

## Password recovery

- The reset flow is wired through Better Auth and the reset form.
- In development without SMTP, the reset URL is logged locally for development; this does not deliver email.
- In production, SMTP must be configured as private environment variables on the host before reset emails can be delivered. Live delivery was not verifiable in this workspace.

## Payments

- The ZIP's Stripe checkout, customer portal and signed webhook flow are included.
- Billing remains disabled by default (`PAYMENTS_ENABLED=false`). Checkout only becomes available when that explicit gate and all Stripe secrets are present.
- Checkout validates that the configured Stripe price is active, BRL 9.90, and monthly. Pro access is activated only after the signed Stripe webhook confirms payment.
- No Stripe keys, customer data, live charges or production environment changes are included in this update. Enabling live payments requires an explicit decision and private host configuration for `PAYMENTS_ENABLED`, `STRIPE_SECRET_KEY`, `STRIPE_PRICE_PRO_MONTHLY` and `STRIPE_WEBHOOK_SECRET`.

## Other fixes

- Malformed webhook JSON now returns HTTP 400 instead of escaping as an unhandled exception.
- Migration regression coverage now verifies the release-operations migration and subsequent billing migration without assuming a fixed number of migrations.
- Internal account/reset navigation uses the router.

## Verification

- Full unit/integration suite: 233 tests passed across 34 files.
- HTTP smoke suite: 111 checks passed.
- Lint, TypeScript typecheck and production build passed.
- These checks use the local test database (PGlite). No live SMTP, Stripe or production database credentials were available, so external service delivery and real payment processing were not tested.

This is a review branch proposal. It has not been merged or deployed to production.

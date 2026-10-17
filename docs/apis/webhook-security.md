# Webhook security and idempotency

This repository provides generic primitives, not a substitute for each provider's signature contract.

## Required processing order

1. Read and retain the exact raw request body before JSON parsing.
2. Apply the provider-specific signature header format, key selection, timestamp/replay window and algorithm documented by that provider.
3. Verify authenticity. Invalid signatures must be rejected before event persistence or business side effects.
4. Atomically claim a provider-scoped event ID using a durable store with a uniqueness constraint.
5. Process the event idempotently. Persist processing state and outcome so a crash can be retried safely.
6. Reconcile payment status against the authenticated provider API when the event contract or risk level requires it.
7. Acknowledge only according to the provider's documented retry policy.

## Available primitives

- `verifyHmacSha256`: constant-time comparison for a 64-character hexadecimal HMAC-SHA256 digest. It does not parse provider-specific headers or establish that HMAC-SHA256 is the provider's algorithm.
- `claimWebhookEvent`: requires an injected store whose `claim(key, metadata)` operation is atomic and durable across restarts and replicas.
- `processVerifiedWebhook`: minimal orchestration helper. Production handlers should additionally persist a state machine (received, processing, processed, retryable failure) and define crash recovery.

## Release blockers

- Do not use a process-local Set/Map as the production idempotency store.
- Do not trust a browser redirect, client callback, or unsigned WhatsApp message as proof of payment.
- Do not log secrets, full signatures, access tokens, raw customer payloads, or payment credentials.
- Do not use the generic HMAC helper until the official provider contract confirms its algorithm and canonicalization rules.
- Signature freshness/replay-window validation and provider-specific signature parsing remain provider-adapter responsibilities.

import { createHmac, timingSafeEqual } from 'node:crypto';

function assert(condition, message) {
  if (!condition) throw new TypeError(message);
}

/**
 * Verify a raw-body HMAC signature.
 * The caller must pass the exact raw request bytes/string, before JSON parsing.
 * Header parsing is intentionally provider-specific and must happen before calling this helper.
 */
export function verifyHmacSha256({ rawBody, secret, signature, prefix = '' }) {
  assert(typeof rawBody === 'string' || Buffer.isBuffer(rawBody), 'rawBody must be a string or Buffer');
  assert(typeof secret === 'string' && secret.length > 0, 'secret is required');
  assert(typeof signature === 'string' && signature.length > 0, 'signature is required');

  const supplied = signature.startsWith(prefix) ? signature.slice(prefix.length) : signature;
  if (!/^[a-fA-F0-9]{64}$/.test(supplied)) return false;

  const expected = createHmac('sha256', secret).update(rawBody).digest();
  const received = Buffer.from(supplied, 'hex');
  return received.length === expected.length && timingSafeEqual(received, expected);
}

/**
 * Claim an event through a durable store that guarantees atomic uniqueness.
 * Store contract: claim(key, metadata) resolves true only for the first claimant.
 * This helper deliberately has no in-memory fallback: process-local deduplication is
 * not sufficient when workers restart or multiple replicas process the same webhook.
 */
export async function claimWebhookEvent({ store, provider, eventId, receivedAt = new Date().toISOString() }) {
  assert(store && typeof store.claim === 'function', 'A durable atomic idempotency store is required');
  assert(typeof provider === 'string' && provider.trim(), 'provider is required');
  assert(typeof eventId === 'string' && eventId.trim(), 'eventId is required');

  const key = `webhook:${provider.trim().toLowerCase()}:${eventId.trim()}`;
  const claimed = await store.claim(key, { provider, eventId, receivedAt });
  assert(typeof claimed === 'boolean', 'store.claim must return a boolean');
  return { key, claimed, duplicate: !claimed };
}

/**
 * Safe processing skeleton: verify authenticity before claiming, then delegate
 * side effects only to the first claimant. Failed processing should be retried
 * through a durable store state machine rather than marking an event completed.
 */
export async function processVerifiedWebhook({ verify, store, provider, eventId, payload, handler }) {
  assert(typeof verify === 'function', 'verify callback is required');
  assert(typeof handler === 'function', 'handler callback is required');
  const verified = await verify();
  if (verified !== true) return { accepted: false, reason: 'invalid_signature' };

  const claim = await claimWebhookEvent({ store, provider, eventId });
  if (claim.duplicate) return { accepted: true, duplicate: true, processed: false };

  await handler(payload);
  return { accepted: true, duplicate: false, processed: true };
}

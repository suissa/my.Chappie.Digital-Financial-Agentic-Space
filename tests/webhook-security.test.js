import test from 'node:test';
import assert from 'node:assert/strict';
import { createHmac } from 'node:crypto';
import { verifyHmacSha256, claimWebhookEvent, processVerifiedWebhook } from '../doc2mcpFactory/webhook-security.js';

test('HMAC verifier accepts a valid signature over the exact raw body', () => {
  const rawBody = Buffer.from('{"event":"payment.confirmed"}');
  const secret = 'test-secret';
  const signature = createHmac('sha256', secret).update(rawBody).digest('hex');
  assert.equal(verifyHmacSha256({ rawBody, secret, signature }), true);
});

test('HMAC verifier rejects malformed, altered and missing signatures', () => {
  const rawBody = '{"event":"payment.confirmed"}';
  assert.equal(verifyHmacSha256({ rawBody, secret: 's', signature: 'not-a-signature' }), false);
  assert.equal(verifyHmacSha256({ rawBody, secret: 's', signature: '0'.repeat(64) }), false);
  assert.throws(() => verifyHmacSha256({ rawBody, secret: '', signature: '0'.repeat(64) }), /secret is required/);
});

test('event claim requires a durable atomic store and scopes keys by provider', async () => {
  const seen = new Set();
  const store = { async claim(key) { if (seen.has(key)) return false; seen.add(key); return true; } };
  const first = await claimWebhookEvent({ store, provider: 'Asaas', eventId: 'evt-1' });
  const duplicate = await claimWebhookEvent({ store, provider: 'asaas', eventId: 'evt-1' });
  const otherProvider = await claimWebhookEvent({ store, provider: 'efi', eventId: 'evt-1' });
  assert.equal(first.claimed, true);
  assert.equal(duplicate.duplicate, true);
  assert.equal(otherProvider.claimed, true);
  await assert.rejects(() => claimWebhookEvent({ store: {}, provider: 'asaas', eventId: 'evt-2' }), /durable atomic/);
});

test('webhook processing verifies before side effects and skips duplicate events', async () => {
  const seen = new Set();
  const store = { async claim(key) { if (seen.has(key)) return false; seen.add(key); return true; } };
  let effects = 0;
  const base = { store, provider: 'provider', eventId: 'evt-1', payload: { status: 'paid' }, handler: async () => { effects++; } };
  const invalid = await processVerifiedWebhook({ ...base, verify: async () => false });
  assert.equal(invalid.reason, 'invalid_signature');
  assert.equal(effects, 0);
  const first = await processVerifiedWebhook({ ...base, verify: async () => true });
  const duplicate = await processVerifiedWebhook({ ...base, verify: async () => true });
  assert.equal(first.processed, true);
  assert.equal(duplicate.duplicate, true);
  assert.equal(effects, 1);
});

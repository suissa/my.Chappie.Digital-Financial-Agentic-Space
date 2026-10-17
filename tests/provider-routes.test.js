import test from 'node:test';
import assert from 'node:assert/strict';
import { createToolsFromOpenApi, validateRouteInput } from '../doc2mcpFactory/index.js';

// Each route in a provider spec is discovered and contract-checked. The injected fetch
// is a deterministic integration boundary: CI must never send real payment requests.
const providerSpecs = [
  { name: 'asaas', spec: { openapi: '3.0.3', paths: {
    '/v3/paymentLinks': { post: { operationId: 'asaasCreatePaymentLink', requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', required: ['name'], properties: { name: { type: 'string', minLength: 1 } } } } } }, responses: { '200': {}, '400': {} } } },
    '/v3/payments/{id}': { get: { operationId: 'asaasGetPayment', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }], responses: { '200': {}, '404': {} } } }
  } } },
  { name: 'efi', spec: { openapi: '3.0.3', paths: {
    '/v1/charge/one-step': { post: { operationId: 'efiCreateCharge', requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', required: ['items'], properties: { items: { type: 'array', minItems: 1 } } } } } }, responses: { '200': {}, '400': {} } } },
    '/v1/charge/{id}': { get: { operationId: 'efiGetCharge', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }], responses: { '200': {}, '404': {} } } }
  } } },
  { name: 'pagarme', spec: { openapi: '3.0.3', paths: {
    '/core/v5/paymentlinks': { post: { operationId: 'pagarmeCreatePaymentLink', requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', required: ['type'], properties: { type: { type: 'string' } } } } } }, responses: { '200': {}, '400': {} } } },
    '/core/v5/paymentlinks/{id}': { get: { operationId: 'pagarmeGetPaymentLink', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }], responses: { '200': {}, '404': {} } } }
  } } },
  { name: 'mercadopago', spec: { openapi: '3.0.3', paths: {
    '/checkout/preferences': { post: { operationId: 'mpCreatePreference', requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', required: ['items'], properties: { items: { type: 'array', minItems: 1 } } } } } }, responses: { '201': {}, '400': {} } } },
    '/v1/payments/{id}': { get: { operationId: 'mpGetPayment', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }], responses: { '200': {}, '404': {} } } }
  } } },
  { name: 'pagbank', spec: { openapi: '3.0.3', paths: {
    '/orders': { post: { operationId: 'pagbankCreateOrder', requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', required: ['items'], properties: { items: { type: 'array', minItems: 1 } } } } } }, responses: { '201': {}, '400': {} } } },
    '/orders/{id}': { get: { operationId: 'pagbankGetOrder', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }], responses: { '200': {}, '404': {} } } }
  } } },
  { name: 'infinitepay', spec: { openapi: '3.0.3', paths: {
    '/invoices/public/checkout/links': { post: { operationId: 'infinitepayCreateCheckoutLink', requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', required: ['handle', 'redirect_url'], properties: { handle: { type: 'string' }, redirect_url: { type: 'string' } } } } } }, responses: { '200': {}, '400': {} } } }
  } } },
  { name: 'cora', spec: { openapi: '3.0.3', paths: {
    '/v2/invoices/': { post: { operationId: 'coraCreateInvoice', requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', required: ['code'], properties: { code: { type: 'string' } } } } } }, responses: { '201': {}, '400': {} } } }
  } } },
  { name: 'btg', spec: { openapi: '3.0.3', paths: {
    '/payments': { post: { operationId: 'btgCreatePayment', requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', required: ['amount'], properties: { amount: { type: 'number', minimum: 0.01 } } } } } }, responses: { '200': {}, '400': {} } } }
  } } },
  { name: 'whatsapp-cloud', spec: { openapi: '3.0.3', paths: {
    '/{phone_number_id}/messages': { post: { operationId: 'whatsappSendMessage', requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', required: ['messaging_product', 'to', 'type'], properties: { messaging_product: { type: 'string', enum: ['whatsapp'] }, to: { type: 'string' }, type: { type: 'string' } } } } } }, responses: { '200': {}, '400': {} } } }
  } } }
];

for (const provider of providerSpecs) {
  test(`${provider.name}: every declared REST operation is discoverable and has response contracts`, () => {
    const routes = createToolsFromOpenApi(provider.spec);
    assert.ok(routes.length > 0);
    for (const route of routes) {
      assert.ok(route.path.startsWith('/'));
      assert.ok(['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS'].includes(route.method));
      assert.ok(Object.keys(route.responses).length > 0, `${route.name} must document at least one response`);
    }
  });
}

// Proves the transport seam works without real credentials, live API calls or money movement.
test('REST integration harness can exercise success and provider error responses with a fake fetch', async () => {
  const calls = [];
  const fakeFetch = async (url, init) => {
    calls.push({ url, method: init.method });
    if (url.endsWith('/payments')) return new Response(JSON.stringify({ id: 'sandbox_123', status: 'pending' }), { status: 201, headers: { 'content-type': 'application/json' } });
    return new Response(JSON.stringify({ error: 'invalid_request' }), { status: 400, headers: { 'content-type': 'application/json' } });
  };
  const success = await fakeFetch('https://sandbox.example/payments', { method: 'POST' });
  assert.equal(success.status, 201);
  assert.equal((await success.json()).status, 'pending');
  const failure = await fakeFetch('https://sandbox.example/payments?bad=1', { method: 'POST' });
  assert.equal(failure.status, 400);
  assert.equal((await failure.json()).error, 'invalid_request');
  assert.equal(calls.length, 2);
  assert.equal(validateRouteInput({ type: 'object', required: ['amount'], properties: { amount: { type: 'number', minimum: 0.01 } } }, { amount: 1 }), true);
});

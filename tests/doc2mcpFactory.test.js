import test from 'node:test';
import assert from 'node:assert/strict';
import { createToolsFromOpenApi, createRouteManifest, validateRouteInput, executeRestOperation } from '../doc2mcpFactory/index.js';

const spec = {
  openapi: '3.0.3',
  info: { title: 'Payment test API', version: '1.0.0' },
  paths: {
    '/payments': {
      post: {
        operationId: 'createPayment',
        summary: 'Create a payment',
        requestBody: { required: true, content: { 'application/json': { schema: {
          type: 'object', required: ['amount', 'currency'], additionalProperties: false,
          properties: { amount: { type: 'number', minimum: 0.01 }, currency: { type: 'string', enum: ['BRL'] } }
        } } } },
        responses: { '201': { description: 'Created' }, '400': { description: 'Invalid input' } }
      },
      get: { operationId: 'listPayments', responses: { '200': { description: 'OK' } }
      }
    }
  }
};

test('generates one stable tool for each HTTP operation', () => {
  const tools = createToolsFromOpenApi(spec);
  assert.deepEqual(tools.map(t => t.name), ['createpayment', 'listpayments']);
  assert.equal(tools[0].method, 'POST');
  assert.equal(tools[0].path, '/payments');
});

test('rejects non-OpenAPI 3 and missing paths', () => {
  assert.throws(() => createToolsFromOpenApi({ openapi: '2.0', paths: {} }), /OpenAPI 3/);
  assert.throws(() => createToolsFromOpenApi({ openapi: '3.0.0' }), /define paths/);
});

test('rejects duplicate operation IDs after normalization', () => {
  const duplicate = structuredClone(spec);
  duplicate.paths['/other'] = { get: { operationId: 'create-payment' } };
  duplicate.paths['/third'] = { get: { operationId: 'create_payment' } };
  assert.throws(() => createToolsFromOpenApi(duplicate), /Duplicate MCP tool name/);
});

test('validates required fields, types, bounds, enums and unknown keys', () => {
  const schema = spec.paths['/payments'].post.requestBody.content['application/json'].schema;
  assert.equal(validateRouteInput(schema, { amount: 12.5, currency: 'BRL' }), true);
  assert.throws(() => validateRouteInput(schema, { amount: 12.5 }), /Missing required/);
  assert.throws(() => validateRouteInput(schema, { amount: '12.5', currency: 'BRL' }), /Expected number/);
  assert.throws(() => validateRouteInput(schema, { amount: 0, currency: 'BRL' }), /below minimum/);
  assert.throws(() => validateRouteInput(schema, { amount: 1, currency: 'USD' }), /not in enum/);
  assert.throws(() => validateRouteInput(schema, { amount: 1, currency: 'BRL', token: 'secret' }), /Unknown property/);
});

test('fails explicitly on unresolved schema references', () => {
  assert.throws(() => validateRouteInput({ $ref: '#/components/schemas/Payment' }, {}), /Unresolved schema reference/);
});

test('exports route manifest including documented response codes', () => {
  const manifest = createRouteManifest(spec);
  assert.equal(manifest.length, 2);
  assert.deepEqual(manifest[0].documentedResponses, ['201', '400']);
});

test('executes a documented REST operation using an injected fake transport', async () => {
  const operation = createToolsFromOpenApi(spec)[0];
  const seen = [];
  const fakeFetch = async (url, init) => {
    seen.push({ url: String(url), method: init.method, body: JSON.parse(init.body) });
    return new Response(JSON.stringify({ id: 'sandbox_123', status: 'pending' }), {
      status: 201, headers: { 'content-type': 'application/json' }
    });
  };
  const result = await executeRestOperation({
    baseUrl: 'https://sandbox.example/api',
    operation,
    body: { amount: 10, currency: 'BRL' },
    headers: { authorization: 'Bearer test-only-token' },
    fetchImpl: fakeFetch
  });
  assert.equal(result.status, 201);
  assert.equal(result.body.status, 'pending');
  assert.equal(seen[0].method, 'POST');
  assert.equal(seen[0].url, 'https://sandbox.example/api/payments');
  assert.deepEqual(seen[0].body, { amount: 10, currency: 'BRL' });
});

test('does not dispatch invalid requests and reports provider HTTP errors without treating them as success', async () => {
  const operation = createToolsFromOpenApi(spec)[0];
  let calls = 0;
  const fakeFetch = async () => {
    calls++;
    return new Response(JSON.stringify({ error: 'invalid_request' }), { status: 400 });
  };
  await assert.rejects(() => executeRestOperation({
    baseUrl: 'https://sandbox.example',
    operation,
    body: { amount: 'bad', currency: 'BRL' },
    fetchImpl: fakeFetch
  }), /Expected number/);
  assert.equal(calls, 0);
  const result = await executeRestOperation({
    baseUrl: 'https://sandbox.example',
    operation,
    body: { amount: 10, currency: 'BRL' },
    fetchImpl: fakeFetch
  });
  assert.equal(result.status, 400);
  assert.equal(result.ok, false);
  assert.equal(result.body.error, 'invalid_request');
  assert.equal(calls, 1);
});

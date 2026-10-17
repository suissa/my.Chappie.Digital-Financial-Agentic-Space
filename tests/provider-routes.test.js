import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createToolsFromOpenApi,
  createRouteManifest,
  executeRestOperation,
  validateRouteInput
} from '../doc2mcpFactory/index.js';

const fixture = {
  openapi: '3.0.3',
  servers: [{ url: 'https://sandbox.example/v1' }],
  paths: {
    '/payments/{paymentId}': {
      get: {
        operationId: 'getPayment',
        parameters: [
          { name: 'paymentId', in: 'path', required: true, schema: { type: 'string', minLength: 1 } },
          { name: 'expand', in: 'query', required: false, schema: { type: 'string' } }
        ],
        responses: { '200': { description: 'Found' }, '404': { description: 'Not found' } }
      }
    },
    '/payments': {
      post: {
        operationId: 'createPayment',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object', required: ['amount', 'currency'], additionalProperties: false,
                properties: { amount: { type: 'number', minimum: 0.01 }, currency: { type: 'string', enum: ['BRL'] }, description: { type: 'string', maxLength: 140 } }
              }
            }
          }
        },
        responses: { '201': { description: 'Created' }, '400': { description: 'Invalid input' } }
      }
    }
  }
};

test('factory discovers every supported HTTP operation and response contract', () => {
  const tools = createToolsFromOpenApi(fixture);
  assert.equal(tools.length, 2);
  assert.deepEqual(tools.map(({ method, path }) => [method, path]), [['GET', '/payments/{paymentId}'], ['POST', '/payments']]);
  assert.ok(tools.every(tool => Object.keys(tool.responses).length > 0));
  assert.deepEqual(createRouteManifest(fixture).map(route => route.documentedResponses), [['200', '404'], ['201', '400']]);
});

test('input validation rejects missing, out-of-range, enum and unknown properties', () => {
  const schema = fixture.paths['/payments'].post.requestBody.content['application/json'].schema;
  assert.equal(validateRouteInput(schema, { amount: 10, currency: 'BRL' }), true);
  assert.throws(() => validateRouteInput(schema, { amount: 10 }), /Missing required property/);
  assert.throws(() => validateRouteInput(schema, { amount: 0, currency: 'BRL' }), /below minimum/);
  assert.throws(() => validateRouteInput(schema, { amount: 10, currency: 'USD' }), /not in enum/);
  assert.throws(() => validateRouteInput(schema, { amount: 10, currency: 'BRL', admin: true }), /Unknown property/);
});

test('REST executor substitutes and encodes path parameters and query values', async () => {
  let captured;
  const operation = createToolsFromOpenApi(fixture).find(item => item.method === 'GET');
  const result = await executeRestOperation({
    baseUrl: 'https://sandbox.example/v1', operation, pathParams: { paymentId: 'id/with space' }, query: { expand: 'customer details' }, headers: { authorization: 'Bearer sandbox-token' },
    fetchImpl: async (url, init) => { captured = { url: String(url), init }; return new Response(JSON.stringify({ id: 'id/with space', status: 'pending' }), { status: 200, headers: { 'content-type': 'application/json' } }); }
  });
  assert.equal(captured.url, 'https://sandbox.example/v1/payments/id%2Fwith%20space?expand=customer+details');
  assert.equal(captured.init.method, 'GET');
  assert.equal(captured.init.headers.get('authorization'), 'Bearer sandbox-token');
  assert.equal(result.status, 200); assert.equal(result.ok, true); assert.equal(result.body.status, 'pending');
});

test('REST executor validates JSON body before transport and serializes valid body', async () => {
  const operation = createToolsFromOpenApi(fixture).find(item => item.method === 'POST'); let calls = 0;
  const fetchImpl = async (_url, init) => { calls += 1; assert.equal(init.headers.get('content-type'), 'application/json'); assert.deepEqual(JSON.parse(init.body), { amount: 25.5, currency: 'BRL' }); return new Response(JSON.stringify({ id: 'sandbox_payment', status: 'pending' }), { status: 201, headers: { 'content-type': 'application/json' } }); };
  await assert.rejects(executeRestOperation({ baseUrl: 'https://sandbox.example/v1', operation, body: { amount: 0, currency: 'BRL' }, fetchImpl }), /below minimum/);
  assert.equal(calls, 0);
  const result = await executeRestOperation({ baseUrl: 'https://sandbox.example/v1', operation, body: { amount: 25.5, currency: 'BRL' }, fetchImpl });
  assert.equal(result.status, 201); assert.equal(result.body.id, 'sandbox_payment'); assert.equal(calls, 1);
});

test('REST executor preserves non-JSON error bodies and reports provider status', async () => {
  const operation = createToolsFromOpenApi(fixture).find(item => item.method === 'GET');
  const result = await executeRestOperation({ baseUrl: 'https://sandbox.example/v1', operation, pathParams: { paymentId: 'missing' }, fetchImpl: async () => new Response('upstream unavailable', { status: 502 }) });
  assert.equal(result.status, 502); assert.equal(result.ok, false); assert.equal(result.body, 'upstream unavailable');
});

test('REST executor fails closed for missing path parameters, required body and unresolved references', async () => {
  const [getOperation, postOperation] = createToolsFromOpenApi(fixture);
  await assert.rejects(executeRestOperation({ baseUrl: 'https://sandbox.example/v1', operation: getOperation }), /Missing (?:required )?path parameter/);
  await assert.rejects(executeRestOperation({ baseUrl: 'https://sandbox.example/v1', operation: postOperation }), /Request body is required/);
  assert.throws(() => validateRouteInput({ $ref: '#/components/schemas/Payment' }, {}), /Unresolved schema reference/);
});

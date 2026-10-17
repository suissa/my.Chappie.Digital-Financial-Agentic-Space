import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createToolsFromOpenApi, createRouteManifest, executeRestOperation, validateRouteInput } from '../doc2mcpFactory/index.js';

const CONTRACTS = [
  ['asaas', 'docs/apis/contracts/asaas-payment-links.json', ['POST /v3/paymentLinks', 'GET /v3/paymentLinks/{id}', 'PUT /v3/paymentLinks/{id}', 'POST /v3/paymentLinks/{id}/restore', 'GET /v3/paymentLinks/{id}/images']],
  ['efi', 'docs/apis/contracts/efi-payment-links.json', ['POST /v1/charge/one-step/link', 'POST /v1/charge/{id}/link']],
  ['pagarme', 'docs/apis/contracts/pagarme-payment-links.json', ['POST /paymentlinks', 'GET /paymentlinks/{payment_link_id}', 'GET /paymentlinks/search']],
  ['pagbank', 'docs/apis/contracts/pagbank-checkout.json', ['POST /checkouts', 'GET /checkouts/{checkout_id}']],
  ['mercadopago', 'docs/apis/contracts/mercadopago-preferences.json', ['POST /checkout/preferences', 'GET /checkout/preferences/{id}', 'PUT /checkout/preferences/{id}', 'GET /checkout/preferences/search']],
  ['cora', 'docs/apis/contracts/cora-invoices.json', ['POST /v2/invoices/', 'POST /v2/invoices/installments']],
  ['whatsapp', 'docs/apis/contracts/whatsapp-cloud-api.json', ['POST /{phone_number_id}/messages']]
];

async function load(path) { return JSON.parse(await readFile(new URL(`../${path}`, import.meta.url), 'utf8')); }

function exampleForSchema(schema) {
  if (!schema || schema.$ref) return {};
  if (schema.example !== undefined) return schema.example;
  if (schema.default !== undefined) return schema.default;
  if (schema.enum?.length) return schema.enum[0];
  if (schema.type === 'string') return 'test-value';
  if (schema.type === 'number') return Math.max(schema.minimum ?? 1, 1);
  if (schema.type === 'integer') return Math.max(schema.minimum ?? 1, 1);
  if (schema.type === 'boolean') return true;
  if (schema.type === 'array') return [exampleForSchema(schema.items || { type: 'string' })];
  if (schema.type === 'object' || schema.properties) {
    const value = {};
    for (const key of schema.required || Object.keys(schema.properties || {})) value[key] = exampleForSchema(schema.properties?.[key] || { type: 'string' });
    return value;
  }
  return {};
}

for (const [provider, file, expectedRoutes] of CONTRACTS) {
  test(`${provider}: every documented route is generated and executable through REST transport`, async () => {
    const document = await load(file);
    const tools = createToolsFromOpenApi(document);
    const actualRoutes = tools.map(operation => `${operation.method} ${operation.path}`);
    assert.deepEqual(actualRoutes.sort(), [...expectedRoutes].sort());
    assert.equal(createRouteManifest(document).length, expectedRoutes.length);

    for (const operation of tools) {
      const pathParams = Object.fromEntries((operation.parameters || []).filter(p => p.in === 'path').map(p => [p.name, 'test-id']));
      const query = Object.fromEntries((operation.parameters || []).filter(p => p.in === 'query').filter(p => p.required).map(p => [p.name, exampleForSchema(p.schema)]));
      const headers = Object.fromEntries((operation.parameters || []).filter(p => p.in === 'header').filter(p => p.required).map(p => [p.name, p.name.toLowerCase() === 'authorization' ? 'Bearer test-token' : p.name.toLowerCase() === 'idempotency-key' ? '00000000-0000-4000-8000-000000000001' : 'test-value']));
      const bodySchema = operation.requestBody?.content?.['application/json']?.schema;
      const body = bodySchema ? exampleForSchema(bodySchema) : undefined;
      if (bodySchema) assert.doesNotThrow(() => validateRouteInput(bodySchema, body));

      const result = await executeRestOperation({
        baseUrl: document.servers?.[0]?.url || 'https://sandbox.example',
        operation, pathParams, query, headers, body,
        fetchImpl: async (_url, init) => new Response(JSON.stringify({ ok: true, method: init.method }), { status: 200, headers: { 'content-type': 'application/json' } })
      });
      assert.equal(result.ok, true);
      assert.equal(result.status, 200);
    }
  });
}

test('provider contract suite rejects invalid required payloads before transport', async () => {
  for (const [, file] of CONTRACTS) {
    const document = await load(file);
    for (const operation of createToolsFromOpenApi(document)) {
      const schema = operation.requestBody?.content?.['application/json']?.schema;
      if (!schema?.required?.length) continue;
      const invalid = { ...exampleForSchema(schema) };
      delete invalid[schema.required[0]];
      let calls = 0;
      await assert.rejects(() => executeRestOperation({
        baseUrl: document.servers?.[0]?.url || 'https://sandbox.example', operation,
        pathParams: Object.fromEntries((operation.parameters || []).filter(p => p.in === 'path').map(p => [p.name, 'test-id'])),
        headers: Object.fromEntries((operation.parameters || []).filter(p => p.in === 'header').filter(p => p.required).map(p => [p.name, p.name.toLowerCase() === 'authorization' ? 'Bearer test-token' : p.name.toLowerCase() === 'idempotency-key' ? '00000000-0000-4000-8000-000000000002' : 'test-value'])),
        body: invalid,
        fetchImpl: async () => { calls++; return new Response('{}', { status: 200 }); }
      }), /Missing required property/);
      assert.equal(calls, 0, `invalid ${operation.operationId} reached transport`);
    }
  }
});

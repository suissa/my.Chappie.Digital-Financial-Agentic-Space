const HTTP_METHODS = new Set(['get', 'post', 'put', 'patch', 'delete', 'head', 'options']);
const TYPE_CHECKS = {
  string: value => typeof value === 'string',
  number: value => typeof value === 'number' && Number.isFinite(value),
  integer: value => Number.isInteger(value),
  boolean: value => typeof value === 'boolean',
  object: value => value !== null && typeof value === 'object' && !Array.isArray(value),
  array: Array.isArray
};

function assert(condition, message) {
  if (!condition) throw new TypeError(message);
}

function safeToolName(value) {
  return String(value).replace(/[^a-zA-Z0-9_]/g, '_').replace(/_+/g, '_').replace(/^_|_$/g, '').toLowerCase();
}

/** Create deterministic descriptors for documented OpenAPI path operations. */
export function createToolsFromOpenApi(document) {
  assert(document && typeof document === 'object', 'OpenAPI document must be an object');
  assert(String(document.openapi ?? '').startsWith('3.'), 'Only OpenAPI 3.x is supported');
  assert(document.paths && typeof document.paths === 'object', 'OpenAPI document must define paths');

  const tools = [];
  const names = new Set();
  for (const [path, pathItem] of Object.entries(document.paths)) {
    assert(path.startsWith('/'), `Invalid OpenAPI path: ${path}`);
    assert(pathItem && typeof pathItem === 'object', `Invalid path item: ${path}`);
    for (const [method, operation] of Object.entries(pathItem)) {
      if (!HTTP_METHODS.has(method.toLowerCase())) continue;
      assert(operation && typeof operation === 'object', `Invalid operation: ${method.toUpperCase()} ${path}`);
      const proposedName = safeToolName(operation.operationId || `${method}_${path}`);
      assert(proposedName.length > 0, `Cannot derive tool name for ${method.toUpperCase()} ${path}`);
      assert(!names.has(proposedName), `Duplicate MCP tool name: ${proposedName}`);
      names.add(proposedName);
      tools.push({
        name: proposedName,
        title: operation.summary || operation.operationId || `${method.toUpperCase()} ${path}`,
        description: operation.description || operation.summary || `REST ${method.toUpperCase()} ${path}`,
        method: method.toUpperCase(),
        path,
        operationId: operation.operationId || null,
        parameters: [...(pathItem.parameters || []), ...(operation.parameters || [])],
        requestBody: operation.requestBody || null,
        responses: operation.responses || {},
        security: operation.security ?? document.security ?? []
      });
    }
  }
  return tools;
}

/** Basic fail-closed validation for required fields and primitive JSON Schema types.
 * Full JSON Schema composition/refs must be handled by a standards-compliant validator.
 */
export function validateRouteInput(schema, value, path = '$') {
  assert(schema && typeof schema === 'object', 'Schema must be an object');
  if (schema.$ref) throw new TypeError(`Unresolved schema reference at ${path}: ${schema.$ref}`);

  if (schema.type) {
    const check = TYPE_CHECKS[schema.type];
    assert(check, `Unsupported schema type at ${path}: ${schema.type}`);
    assert(check(value), `Expected ${schema.type} at ${path}`);
  }
  if (schema.enum) assert(schema.enum.some(item => Object.is(item, value)), `Value not in enum at ${path}`);
  if (typeof value === 'string') {
    if (schema.minLength !== undefined) assert(value.length >= schema.minLength, `String too short at ${path}`);
    if (schema.maxLength !== undefined) assert(value.length <= schema.maxLength, `String too long at ${path}`);
    if (schema.pattern !== undefined) assert(new RegExp(schema.pattern).test(value), `String does not match pattern at ${path}`);
  }
  if (typeof value === 'number') {
    if (schema.minimum !== undefined) assert(value >= schema.minimum, `Number below minimum at ${path}`);
    if (schema.maximum !== undefined) assert(value <= schema.maximum, `Number above maximum at ${path}`);
  }
  if (Array.isArray(value) && schema.items) value.forEach((item, i) => validateRouteInput(schema.items, item, `${path}[${i}]`));
  if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
    for (const key of schema.required || []) assert(Object.hasOwn(value, key), `Missing required property ${path}.${key}`);
    for (const [key, child] of Object.entries(schema.properties || {})) {
      if (Object.hasOwn(value, key)) validateRouteInput(child, value[key], `${path}.${key}`);
    }
    if (schema.additionalProperties === false) {
      for (const key of Object.keys(value)) assert(Object.hasOwn(schema.properties || {}, key), `Unknown property ${path}.${key}`);
    }
  }
  return true;
}

/** Create a route manifest for tests and review. */
export function createRouteManifest(document) {
  return createToolsFromOpenApi(document).map(({name, method, path, operationId, responses}) => ({
    name, method, path, operationId,
    documentedResponses: Object.keys(responses).sort()
  }));
}

/** Execute one generated REST operation. Credentials are supplied by the caller in headers.
 * This function is intentionally transport-injected so tests cannot accidentally charge real accounts.
 */
export async function executeRestOperation({ baseUrl, operation, pathParams = {}, query = {}, headers = {}, body, fetchImpl = fetch }) {
  assert(typeof baseUrl === 'string' && /^https?:\/\//.test(baseUrl), 'baseUrl must be an absolute HTTP(S) URL');
  assert(operation && operation.path && operation.method, 'operation descriptor is required');
  let path = operation.path;
  for (const match of path.matchAll(/\{([^}]+)\}/g)) {
    const key = match[1];
    assert(Object.hasOwn(pathParams, key), `Missing path parameter: ${key}`);
    path = path.replace(`{${key}}`, encodeURIComponent(String(pathParams[key])));
  }
  assert(!/[{}]/.test(path), `Unresolved path parameter in ${path}`);
  const url = new URL(path, baseUrl.endsWith('/') ? baseUrl : baseUrl + '/');
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined && value !== null) url.searchParams.set(key, String(value));
  }

  const requestHeaders = new Headers(headers);
  const init = { method: operation.method.toUpperCase(), headers: requestHeaders };
  if (body !== undefined) {
    const content = operation.requestBody?.content || {};
    const mediaType = Object.keys(content).find(type => type.toLowerCase() === 'application/json');
    assert(mediaType, 'JSON body supplied but operation has no application/json request schema');
    const bodySchema = content[mediaType]?.schema;
    if (bodySchema) validateRouteInput(bodySchema, body);
    if (operation.requestBody.required) assert(body !== undefined, 'Request body is required');
    requestHeaders.set('content-type', 'application/json');
    init.body = JSON.stringify(body);
  } else {
    assert(!operation.requestBody?.required, 'Request body is required');
  }

  const response = await fetchImpl(url, init);
  const raw = await response.text();
  let parsed = raw;
  if (raw) {
    try { parsed = JSON.parse(raw); } catch { /* preserve non-JSON provider error body */ }
  }
  return { status: response.status, ok: response.ok, body: parsed };
}

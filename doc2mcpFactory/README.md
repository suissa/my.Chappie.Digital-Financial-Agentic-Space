# doc2mcpFactory

Factory for deriving MCP tool descriptors from documented REST/OpenAPI operations and validating inputs against route contracts.

## Design

1. Load OpenAPI 3.x JSON (YAML parsing and remote fetching are not implemented).
2. Discover HTTP operations and preserve operationId, parameters, requestBody, responses and security metadata.
3. Generate deterministic tool descriptors with unique names.
4. Validate supported schema primitives and required fields before dispatch.
5. Dispatch through an injected HTTP client so tests use deterministic fakes and never charge real accounts.
6. Emit a route coverage manifest. Unsupported schema constructs such as unresolved `$ref` fail explicitly.

## API

```js
import { createToolsFromOpenApi, validateRouteInput, executeRestOperation, createRouteManifest } from './index.js';
const tools = createToolsFromOpenApi(openApiDocument);
const manifest = createRouteManifest(openApiDocument);
```

Generate JSON output from a local official OpenAPI document:

```sh
node doc2mcpFactory/cli.js ./openapi.json --manifest
node doc2mcpFactory/cli.js ./openapi.json --tools
```

## Limitations

The validator is not a complete JSON Schema implementation: it does not support allOf/oneOf/anyOf, discriminator, nullable semantics, format validation or full reference resolution. The factory is not a substitute for authorization, provider-specific auth, webhook signature verification, idempotency or secret redaction. It currently creates descriptors and provides REST execution; it does not yet expose an MCP stdio server or load provider contracts automatically.

Provider route fixtures are synthetic and must not be counted as verified API coverage. See [route coverage](../docs/apis/route-coverage.md).
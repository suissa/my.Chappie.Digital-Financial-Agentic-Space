# doc2mcpFactory

Factory for deriving MCP tool descriptors from documented REST/OpenAPI operations and validating them against route contracts.

## Design

1. Load OpenAPI 3.x JSON/YAML (YAML support is an adapter to add; the first implementation accepts parsed JS objects or JSON).
2. Resolve paths and HTTP methods, preserve operationId, summary, parameters, requestBody and response schemas.
3. Generate a deterministic tool descriptor per eligible operation. Tool names must be unique and stable.
4. Validate input against the documented schema before dispatch. Reject unknown paths/methods and malformed payloads.
5. Dispatch through an injected HTTP client so tests can use deterministic fakes. Never log secrets or payment payloads.
6. Emit a route coverage manifest and contract test cases. Unsupported OpenAPI constructs must fail explicitly instead of silently weakening validation.

## Initial API

```js
import { createToolsFromOpenApi, validateRouteInput } from './index.js';
const tools = createToolsFromOpenApi(openApiDocument);
```

This first version produces descriptors and validates required fields/basic JSON Schema types; it is not a complete JSON Schema validator and must not be treated as production authorization. Use vendor schemas and provider-specific auth adapters for actual execution.

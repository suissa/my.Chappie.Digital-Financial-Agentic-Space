# my.Chappie.Digital-Financial-MCPs

WhatsApp-first payment integrations for My.Chappie.Digital. The customer receives a hosted checkout/payment link or Pix instructions over WhatsApp; physical POS control is out of scope.

## Repository layout

- `mcps/`: upstream MCP launch instructions and source/license status. The upstream packages are referenced, not silently represented as locally vendored code.
- `docs/apis/`: official provider documentation, research notes and explicit route-coverage status.
- `doc2mcpFactory/`: OpenAPI 3.x route descriptor factory, basic fail-closed input validation, injected REST transport and manifest CLI.
- `tests/`: deterministic unit and transport-integration tests. Synthetic fixtures are not provider-verified contracts.

## Provider inventory

See [API inventory](docs/apis/README.md), [route coverage](docs/apis/route-coverage.md), [webhook security](docs/apis/webhook-security.md) and [MCP upstream setup](mcps/UPSTREAMS.md).

## Safety and correctness

- Use sandbox credentials and deterministic mocks in CI; never create real charges in tests.
- Never commit credentials, certificates, private keys, access tokens or customer/payment data.
- Verify webhook signatures using the exact provider-specific contract and process events idempotently through a durable, atomic store.
- A redirect/client response is not proof of payment; confirm via authenticated provider API/webhook.
- Do not claim route coverage until each route has a documented contract and test.
- A found MCP is not automatically safe, license-compatible, or complete for payment operations.
- Generic webhook security helpers are primitives, not proof of provider compatibility. Signature format, freshness windows and replay rules must be implemented per provider.

## Development

Requires Node.js 20+.

```sh
npm test
npm run test:coverage
```

Generate a manifest from an official OpenAPI JSON document:

```sh
node doc2mcpFactory/cli.js ./path/to/openapi.json --manifest
node doc2mcpFactory/cli.js ./path/to/openapi.json --tools
```

The CLI currently accepts parsed OpenAPI 3.x JSON only; it does not download provider specs or parse YAML. Route coverage remains limited to the captured contracts listed in [route coverage](docs/apis/route-coverage.md); these are distilled from official documentation and are not vendor-published OpenAPI files. Live sandbox verification has not been performed by CI.

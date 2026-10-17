# my.Chappie.Digital-Financial-MCPs

WhatsApp-first payment integrations for My.Chappie.Digital. The customer receives a hosted checkout/payment link or Pix instructions over WhatsApp; physical POS control is out of scope.

## Repository layout

- `mcps/`: MCP implementations or upstream references for providers that already have one. Keep upstream license and attribution; do not silently relicense copied code.
- `docs/apis/`: official provider API documentation, coverage status, auth and webhook notes.
- `doc2mcpFactory/`: REST/OpenAPI contract loader and MCP-tool descriptor factory.
- `tests/`: deterministic route-contract and integration tests.

## Provider inventory

See [API inventory](docs/apis/README.md). Current targets from the project brief: Asaas, Efí, Pagar.me, Mercado Pago, PagBank, InfinitePay, Cora, BTG Pactual, and Meta WhatsApp Cloud API.

## Safety and correctness

- Use sandbox credentials and deterministic mocks in CI; never create real charges in tests.
- Never commit credentials, certificates, private keys, access tokens or customer/payment data.
- Verify webhook signatures when the provider supports them and process events idempotently.
- A redirect/client response is not proof of payment; confirm via authenticated provider API/webhook.
- Do not claim route coverage until each route has a documented contract and test.
- MCP availability means a server was found; it does not automatically mean its code is safe to vendor or that it covers the required payment operations.

## Development

Requires Node.js 20+.

```sh
npm test
npm run test:coverage
```

The initial implementation focuses on REST contracts. Live provider tests are opt-in and must use sandbox credentials.

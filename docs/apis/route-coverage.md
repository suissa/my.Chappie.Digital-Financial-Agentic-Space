# Provider route coverage

Last reviewed: 2026-10-17.

## Status semantics

- **Documented**: exact method, path, auth and request/response contract have been captured from an official provider specification.
- **Tested**: the exact documented contract has automated request/response tests, using provider sandbox or deterministic fixtures.
- **Live sandbox-tested**: a credentialed test against the provider's sandbox completed without creating a real charge.
- **Fixture-only**: a synthetic contract exercises the generic factory; it is not evidence that a provider route exists.

## Current state

| Provider | Official source | Exact route contracts in this repo | Automated provider-contract tests |
|---|---|---:|---|
| Asaas | https://docs.asaas.com/reference/criar-um-link-de-pagamentos | 0 verified | Not yet |
| Efí | https://dev.efipay.com.br/docs/api-cobrancas/link-de-pagamento/ | 0 verified | Not yet |
| Pagar.me | https://docs.pagar.me/reference/criar-link | 0 verified | Not yet |
| Mercado Pago | https://www.mercadopago.com.br/developers/pt/docs/getting-started | 0 verified | Not yet |
| PagBank | https://developer.pagbank.com.br/v1/reference/introducao | 0 verified | Not yet |
| InfinitePay | https://www.infinitepay.io/desenvolvedores | 0 verified | Not yet |
| Cora | https://developers.cora.com.br/ | 0 verified | Not yet |
| BTG Pactual | https://empresas.btgpactual.com/developers/ | 0 verified | Not yet |
| Meta WhatsApp Cloud API | https://developers.facebook.com/docs/whatsapp/cloud-api/ | 0 verified | Not yet |

The test suite currently verifies generic OpenAPI descriptor generation, fail-closed input validation and the injected HTTP transport using a synthetic fixture. It intentionally does **not** claim that invented/sample routes are verified provider endpoints. The next step is to capture the official OpenAPI/schema for each provider, or manually transcribe each operation from the official reference with source links and a review date, then generate route-specific tests from those contracts.

## Release gate

Do not mark a provider operation supported until:
1. The method and path are grounded in an official source.
2. Required path/query/header/body fields and response status codes are represented.
3. Invalid payloads are rejected before transport.
4. Success and representative provider error responses are tested.
5. Authentication secrets are redacted from logs and never committed.
6. Webhook signature and idempotency behavior are covered when applicable.
7. Any sandbox test is explicitly distinguished from deterministic mock coverage.

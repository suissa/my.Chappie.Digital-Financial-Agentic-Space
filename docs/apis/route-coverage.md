# Provider route coverage

Last reviewed: 2026-10-17.

## Status semantics

- **Documented**: exact method/path and the captured request/response contract are grounded in an official provider reference.
- **Contract-tested**: the captured contract is loaded by automated tests and executed against a deterministic injected REST transport.
- **Live sandbox-tested**: a credentialed request against the provider sandbox completed without creating a real charge. This has NOT been performed by CI.
- **Gated**: the provider documentation was found, but the indexed source did not expose enough exact route/schema information to safely invent a contract.

## Current state

| Provider | Official source | Captured routes | Contract tests | Live sandbox |
|---|---|---:|---|---|
| Asaas | https://docs.asaas.com/reference/criar-um-link-de-pagamentos | 5 | Yes | No |
| Efí | https://dev.efipay.com.br/docs/api-cobrancas/link-de-pagamento/ | 2 | Yes | No |
| Pagar.me V5 | https://docs.pagar.me/reference/criar-link | 3 | Yes | No |
| Mercado Pago Preferences | https://www.mercadopago.com.br/developers/pt/reference/online-payments/checkout-pro-preferences/overview | 4 | Yes | No |
| PagBank Checkout | https://developer.pagbank.com.br/reference/criar-checkout | 2 | Yes | No |
| Cora Invoices | https://developers.cora.com.br/reference/emiss%C3%A3o-de-boleto-registrado-v2 | 2 | Yes | No |
| BTG Pactual | https://developers.empresas.btgpactual.com/docs/starting-doc/Produtos%20de%20API/Conta%20PJ/Cobran%C3%A7as/link-de-pagamento-1 | 0 | Gated | No |
| Meta WhatsApp Cloud API | https://developers.facebook.com/docs/whatsapp/cloud-api/ | 1 | Yes | No |
| InfinitePay | https://www.infinitepay.io/desenvolvedores | 0 | Gated | No |

## Important distinction

The captured JSON files are **contracts distilled from the official documentation**, not downloaded vendor OpenAPI files. Each file contains an `externalDocs` source URL. Where the official page did not expose enough information to determine an exact route safely (BTG and InfinitePay in this snapshot), no route was fabricated.

The automated provider suite uses those captured contracts with an injected fake HTTP transport. It validates that every captured method/path can be generated and dispatched, and that invalid required bodies are rejected before network transport. It does not prove provider availability or successful authentication.

## Release gate

Before production support for an operation:
1. The method and path are grounded in an official source.
2. Required path/query/header/body fields and documented response status codes are represented.
3. Invalid payloads are rejected before transport.
4. Success and representative provider errors are tested.
5. Credentials are external to the repository and never appear in fixtures/logs.
6. Webhook signature and idempotency behavior are covered where applicable.
7. A sandbox run is separately recorded when credentials are available.

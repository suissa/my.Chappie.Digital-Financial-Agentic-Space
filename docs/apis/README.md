# API documentation and MCP inventory

Scope: payment links/Pix checkout sent to customers through WhatsApp, plus the WhatsApp Cloud API. Official provider references remain authoritative; this repository must not invent routes or infer support from an MCP's existence.

| Provider | Official documentation | MCP candidate | Local contract status |
|---|---|---|---|
| Asaas | https://docs.asaas.com/reference/criar-um-link-de-pagamentos | https://github.com/theYahia/asaas-mcp | No provider-verified OpenAPI contract yet |
| Efí Bank | https://dev.efipay.com.br/docs/api-cobrancas/link-de-pagamento/ | https://github.com/efipay/mcp-server-efi (official) | No provider-verified OpenAPI contract yet |
| Pagar.me | https://docs.pagar.me/reference/criar-link | https://github.com/mcp-dir/pagarme-mcp (candidate) | No provider-verified OpenAPI contract yet |
| Mercado Pago | https://www.mercadopago.com.br/developers/pt/docs/getting-started | https://github.com/mercadolibre/mercadopago-mcp-server (official remote MCP) | No provider-verified payment-execution contract yet |
| PagBank | https://developer.pagbank.com.br/v1/reference/introducao | No suitable MCP confirmed | No provider-verified OpenAPI contract yet |
| InfinitePay | https://www.infinitepay.io/desenvolvedores | https://github.com/mcp-dir/infinitepay-mcp (Open Finance candidate) | Candidate is not evidence of checkout support |
| Cora | https://developers.cora.com.br/ | No suitable MCP confirmed | No provider-verified OpenAPI contract yet |
| BTG Pactual | https://empresas.btgpactual.com/developers/ | No suitable MCP confirmed | No provider-verified OpenAPI contract yet |
| Meta WhatsApp Cloud API | https://developers.facebook.com/docs/whatsapp/cloud-api/ | https://github.com/FredShred7/whatsapp-mcp-server (community) | No provider-verified OpenAPI contract yet |

## Documentation workflow

For every provider, capture exact method/path, auth, request/response schema, error codes, pagination, rate limits, idempotency, webhook signature validation and sandbox instructions. Keep source links and review dates next to each contract. See [provider research](provider-research.md), [route coverage](route-coverage.md) and [MCP upstream setup](../../mcps/UPSTREAMS.md).

## Required route groups

For payment providers, enable only operations actually documented and available to the account:
- create/retrieve/list payment or payment link;
- retrieve payment status;
- refund/cancel where supported;
- verify webhooks and process events idempotently;
- customer operations only when required by checkout.

For WhatsApp Cloud API, test sending text/templates/media as needed, inbound webhook challenge validation, signature verification, and delivery/read/status events.

A synthetic test fixture proves only that the generic factory works. It must never be counted as provider route coverage.

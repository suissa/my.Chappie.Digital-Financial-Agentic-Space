# API documentation and MCP inventory

Scope is payment-link/Pix checkout sent to the customer through WhatsApp, not physical POS control. API contracts change; treat vendor documentation as authoritative.

| Provider | Official REST documentation | MCP found in initial research | Repository/endpoint | Status |
|---|---|---|---|---|
| Asaas | https://docs.asaas.com/reference/criar-um-link-de-pagamentos | Community MCP | https://github.com/theYahia/asaas-mcp | Found; review license, coverage and security before vendoring |
| Efí Bank | https://dev.efipay.com.br/docs/api-cobrancas/link-de-pagamento/ | Official MCP | https://github.com/efipay/mcp-server-efi | Found; official, stdio; inspect API coverage before selecting tools |
| Pagar.me | https://docs.pagar.me/reference/criar-link | Community/hosted MCP project | https://github.com/mcp-dir/pagarme-mcp | Found; repository describes hosted service/wrapper; verify licensing and endpoint coverage |
| Mercado Pago | https://www.mercadopago.com.br/developers/pt/docs/getting-started | Official remote MCP + demo | https://github.com/mercadolibre/mercadopago-mcp-server and https://github.com/mercadolibre/demo-mercadopago-mcp-server | Found; official remote endpoint https://mcp.mercadopago.com/mcp |
| PagBank | https://developer.pagbank.com.br/v1/reference/introducao | No first-party MCP confirmed in initial search | — | MCP absence not established; further verification required |
| InfinitePay | https://www.infinitepay.io/desenvolvedores | A community InfinitePay MCP was found for Open Finance read-only data, not payment-link creation | https://github.com/mcp-dir/infinitepay-mcp | Not equivalent to payment API MCP; REST adapter may be needed |
| Cora | https://developers.cora.com.br/ | No first-party payment MCP confirmed in initial search | — | MCP absence not established; further verification required |
| BTG Pactual | https://empresas.btgpactual.com/developers/ | No first-party payment MCP confirmed in initial search | — | MCP absence not established; further verification required |
| Meta WhatsApp Cloud API | https://developers.facebook.com/docs/whatsapp/cloud-api/ | Community implementations found; not an official Meta MCP confirmed | https://github.com/FredShred7/whatsapp-mcp-server | Inspect license, maintained status and exact Cloud API coverage |

## Documentation policy

This index records official documentation URLs and research findings; it does not reproduce vendor documentation wholesale. For each provider, store a concise local integration guide with source URLs, retrieval date, auth method, relevant endpoints, request/response schema references, rate limits, webhook signature verification, idempotency behavior and sandbox instructions. Preserve vendor copyright and licenses.

## Required route groups

For payment providers, implement only operations actually documented and enabled by credentials:
- create/retrieve/list payment or payment link;
- retrieve payment status;
- refund/cancel where API supports it;
- webhook verification and event processing;
- customer creation/retrieval only where required by checkout flow.

For Meta WhatsApp Cloud API:
- send text/template messages and media as needed;
- validate inbound webhook challenge and verify webhook signature;
- parse delivery/read/status events.

Never fabricate an endpoint or normalize provider-specific request fields without a documented mapping. Unknown or unsupported routes must be marked unsupported, not treated as passing tests.

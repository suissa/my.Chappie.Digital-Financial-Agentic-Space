# Provider integration notes

This document is a navigation layer, not a replacement for vendor API references. Confirm exact route paths, required fields, auth, pagination, limits, idempotency and webhook signatures from the linked current vendor docs before implementation.

## Asaas
- Payment link reference: https://docs.asaas.com/reference/criar-um-link-de-pagamentos
- Overview: https://docs.asaas.com/docs/visao-geral
- Payment links guide: https://docs.asaas.com/docs/link-de-pagamentos
- MCP candidate: https://github.com/theYahia/asaas-mcp
- Validate API key handling, sandbox base URL, payment status transitions and webhook authentication.

## Efí
- Payment link: https://dev.efipay.com.br/docs/api-cobrancas/link-de-pagamento/
- Developer portal: https://dev.efipay.com.br/
- Official MCP: https://github.com/efipay/mcp-server-efi
- The MCP repository states it catalogs multiple Efí APIs and uses the Node SDK contracts. Check the exact operation and permission before use. Treat certificates/private keys as secrets.

## Pagar.me
- Create link: https://docs.pagar.me/reference/criar-link
- MCP candidate: https://github.com/mcp-dir/pagarme-mcp
- Confirm API version and key type; the V5 API differs from legacy V1–V4. Never infer that a hosted MCP wrapper means the underlying service is open source.

## Mercado Pago
- Getting started: https://www.mercadopago.com.br/developers/pt/docs/getting-started
- Official MCP overview: https://www.mercadopago.com.br/developers/pt/docs/mcp-server/overview
- Official MCP connection: https://www.mercadopago.com.br/developers/pt/docs/mcp-server/connection
- Official MCP repository: https://github.com/mercadolibre/mercadopago-mcp-server
- Official remote endpoint documented by vendor: https://mcp.mercadopago.com/mcp
- MCP discovery coverage includes documentation lookup, app management and webhook/test-user workflows; do not assume it exposes all payment execution endpoints.

## PagBank
- API introduction: https://developer.pagbank.com.br/v1/reference/introducao
- Integration process: https://developer.pagbank.com.br/v1/docs/comecando-processo-de-integracao
- Confirm payment-link and Pix flows, OAuth/token requirements, sandbox behavior and webhook validation from the official reference.

## InfinitePay
- Developer portal: https://www.infinitepay.io/desenvolvedores
- Public integration context: https://www.infinitepay.io/blog/integracao-infinitepay
- The MCP found in initial research is focused on Open Finance read-only account data, and is not evidence of a payment-link MCP. Confirm supported checkout API operations with InfinitePay.

## Cora
- Developer portal: https://developers.cora.com.br/
- Verify the currently documented Pix/billing resources, OAuth/client certificate requirements, idempotency and webhook behavior.

## BTG Pactual
- Developer portal: https://empresas.btgpactual.com/developers/
- Verify product access and current API specifications with BTG; the public developer landing page alone does not prove payment-link availability for every account.

## Meta WhatsApp Cloud API
- Official docs: https://developers.facebook.com/docs/whatsapp/cloud-api/
- Community MCP candidate: https://github.com/FredShred7/whatsapp-mcp-server
- Sending messages requires an authorized business phone number and access token. Webhook challenge validation and signature verification must be separate tests. Use template messages where required by WhatsApp policy.

## Sources from initial project research
The original task brief also lists these references:
- https://docs.asaas.com/reference/criar-um-link-de-pagamentos
- https://dev.efipay.com.br/docs/api-cobrancas/link-de-pagamento/
- https://docs.pagar.me/reference/criar-link
- https://www.mercadopago.com.br/developers/pt/docs/getting-started
- https://developer.pagbank.com.br/v1/reference/introducao
- https://www.infinitepay.io/desenvolvedores
- https://developers.cora.com.br/
- https://empresas.btgpactual.com/developers/

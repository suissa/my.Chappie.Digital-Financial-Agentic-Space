# MCP integrations

This directory tracks MCP upstreams and local adapter status. The initial inventory is in [docs/apis/README.md](../docs/apis/README.md).

## Upstreams discovered

- Efí (official): https://github.com/efipay/mcp-server-efi
- Mercado Pago (official): https://github.com/mercadolibre/mercadopago-mcp-server
- Mercado Pago demo: https://github.com/mercadolibre/demo-mercadopago-mcp-server
- Asaas (community): https://github.com/theYahia/asaas-mcp
- Pagar.me (community/hosted wrapper project): https://github.com/mcp-dir/pagarme-mcp
- InfinitePay Open Finance read-only (not payment-link MCP): https://github.com/mcp-dir/infinitepay-mcp
- WhatsApp Cloud API community candidate: https://github.com/FredShred7/whatsapp-mcp-server

## Vendoring requirements

Do not paste code from an upstream repository until its current license, provenance, dependencies, maintenance and security posture have been inspected. Preserve its LICENSE/NOTICE and attribution. For projects not safely vendorable, use a pinned git submodule or a thin adapter that points to the upstream server. This repository currently records upstream candidates; it does not claim that their source code has been copied or audited.

Each vendored integration should have its own directory, upstream URL, pinned commit, license file, version, supported tools, credential requirements and integration tests. Keep credentials outside the repository.

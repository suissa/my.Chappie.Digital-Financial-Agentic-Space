# MCP integrations

See [UPSTREAMS.md](UPSTREAMS.md) for runnable configurations, package versions, licenses and security caveats.

## Discovered upstreams

- Efí official stdio MCP: https://github.com/efipay/mcp-server-efi
- Mercado Pago official remote MCP: https://github.com/mercadolibre/mercadopago-mcp-server
- Asaas community stdio MCP: https://github.com/theYahia/asaas-mcp
- WhatsApp Cloud API community stdio MCP: https://github.com/FredShred7/whatsapp-mcp-server
- Pagar.me candidate: https://github.com/mcp-dir/pagarme-mcp
- InfinitePay Open Finance read-only candidate: https://github.com/mcp-dir/infinitepay-mcp

## Vendoring status

This repository does **not** yet contain complete source trees for the upstream MCP servers. The launch configs use published packages or vendor-operated remote endpoints. This is deliberate: each source tree must be pinned, copied with its license/attribution, reviewed and tested before it is called vendored. Do not treat launch configuration as source vendoring.

## Credentials

Use environment variables in the MCP host's local configuration or a secret manager. Never commit actual tokens, certificates, private keys, customer data or payment payloads. JSON strings such as `"REPLACE_LOCALLY"` are placeholders and are not shell-style environment interpolation.
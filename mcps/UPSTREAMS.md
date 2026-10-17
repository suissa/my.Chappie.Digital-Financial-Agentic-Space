# MCP upstreams and executable setup

Research snapshot: 2026-10-17. These are upstream integrations, not vendored source trees. Do not describe a package as copied into this repository unless its source files, license and pinned revision are actually present here.

## Installable stdio servers

### Asaas — community project, MIT
Source: https://github.com/theYahia/asaas-mcp  
Package: `@theyahia/asaas-mcp@1.0.1`  
Tools advertised upstream: payment create/read/list, Pix QR/status, customer create/list, subscriptions and refunds. Confirm current package/version and review tool implementation before production use.

Example MCP client configuration (replace the placeholder in your local client config; do not commit credentials):
```json
{
  "mcpServers": {
    "asaas": {
      "command": "npx",
      "args": ["--yes", "@theyahia/asaas-mcp"],
      "env": { "ASAAS_API_KEY": "REPLACE_LOCALLY" }
    }
  }
}
```

License source: https://github.com/theYahia/asaas-mcp/blob/main/LICENSE

### Efí — official project, MIT
Source: https://github.com/efipay/mcp-server-efi  
Package: `mcp-server-efi@1.0.2`  
Runtime: Node.js 22+. The upstream README describes 173 catalogued operations across six API domains. Sensitive-output operations are disabled by default upstream. This is broader than payment links; enable only the API domains and tools the product needs.

```json
{
  "mcpServers": {
    "efi": {
      "command": "npx",
      "args": ["--yes", "mcp-server-efi", "--apis=cobrancas,pix"],
      "env": {
        "EFI_CLIENT_ID": "REPLACE_LOCALLY",
        "EFI_CLIENT_SECRET": "REPLACE_LOCALLY",
        "EFI_SANDBOX": "true"
      }
    }
  }
}
```

For certificate/mTLS operations, configure the certificate using the upstream's documented environment variables. Do not put certificates or keys in this repository.

License source: https://github.com/efipay/mcp-server-efi/blob/main/LICENSE

### WhatsApp Cloud API — community project, MIT
Source: https://github.com/FredShred7/whatsapp-mcp-server  
Package: `@fredshred7/whatsapp-mcp-server@1.1.0`  
Runtime: Node.js 18+. Upstream README warns that webhook signature verification is skipped when `WHATSAPP_APP_SECRET` is unset; set it in production if receiving webhooks.

```json
{
  "mcpServers": {
    "whatsapp": {
      "command": "npx",
      "args": ["--yes", "@fredshred7/whatsapp-mcp-server"],
      "env": {
        "WHATSAPP_PHONE_NUMBER_ID": "REPLACE_LOCALLY",
        "WHATSAPP_ACCESS_TOKEN": "REPLACE_LOCALLY",
        "WHATSAPP_APP_SECRET": "REPLACE_LOCALLY"
      }
    }
  }
}
```

License source: https://github.com/FredShred7/whatsapp-mcp-server/blob/main/LICENSE

## Remote MCP

### Mercado Pago — official remote endpoint
Endpoint documented by Mercado Pago: https://mcp.mercadopago.com/mcp  
Overview: https://www.mercadopago.com.br/developers/pt/docs/mcp-server/overview  
Connection instructions: https://www.mercadopago.com.br/developers/pt/docs/mcp-server/connection

Use the vendor's current connection instructions for authorization and supported clients. Do not copy code from the repository until a compatible license is verified. Discovery/documentation tools do not imply that payment execution is supported.

## Not treated as equivalent payment MCPs

- Pagar.me candidate: https://github.com/mcp-dir/pagarme-mcp — research candidate; verify hosting, source license and operations before use.
- InfinitePay candidate: https://github.com/mcp-dir/infinitepay-mcp — describes read-only Open Finance data; not proof of payment-link creation support.
- PagBank, Cora and BTG Pactual: no suitable MCP source confirmed in this research snapshot. Use documented REST contracts via `doc2mcpFactory` only after their official route schemas are captured and reviewed.

## Important status

The packages above are referenced as upstream dependencies and run independently via `npx`; their full source trees are **not vendored** into this repository by this commit. This distinction preserves provenance and avoids presenting a remote package as locally audited. Before production use, pin exact versions, review dependencies and licenses, test sandbox behavior, and configure credentials outside version control.

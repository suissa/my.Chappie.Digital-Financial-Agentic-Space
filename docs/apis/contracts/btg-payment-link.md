# BTG Pactual Empresas — Payment Link

Source: official BTG Pactual Empresas developer documentation, reviewed 2026-10-17.

The official documentation confirms that the Payment Link API supports creation and management of payment links. A link is a charge-bound URL that can be sent through WhatsApp, SMS or email and lets the payer choose an enabled payment method.

Source: https://developers.empresas.btgpactual.com/docs/starting-doc/Produtos%20de%20API/Conta%20PJ/Cobran%C3%A7as/link-de-pagamento-1

The public page available to the research client did not expose the exact HTTP method/path and complete request schema in its indexed content. Therefore this repository deliberately does **not** invent an OpenAPI route for BTG. The provider remains documented as a supported candidate, but its route contract is gated until the official reference exposes the exact operation details.

Required before enabling:

- exact production and sandbox base URLs;
- exact create/list/get/update/cancel routes and methods;
- OAuth/client credential requirements and scopes;
- complete request and response schemas;
- idempotency behavior;
- webhook/event verification;
- sandbox test procedure.

# Configuration Shopify

Cette application est une application a distribution personnalisee pour votre propre boutique. Elle ne contient pas de facturation Shopify, pas de systeme multi-marchands et pas de preparation App Store.

## Fichiers

- `shopify.app.toml` : developpement, URL mises a jour automatiquement par le tunnel.
- `shopify.app.production.toml` : production, URL fixes.
- `shopify.web.toml` : serveur web React Router lance par Shopify CLI.

## Scopes

```text
read_products,read_inventory,write_inventory,read_locations
```

## Association au Dev Dashboard

```bash
shopify app config link
```

Selectionnez l'application de developpement pour `shopify.app.toml`, puis utilisez une configuration production separee pour les URL fixes.

## Authentification

Les routes integrees utilisent l'authentification officielle :

```ts
const { admin, session } = await authenticate.admin(request);
```

Les appels Admin API Shopify passent toujours par le client GraphQL authentifie de la session Shopify.

## Webhooks

`APP_UNINSTALLED` est declare dans `shopify.app.toml` et recu par `/api/webhooks`.

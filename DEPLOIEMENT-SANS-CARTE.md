# Deploiement sans carte bancaire

Render demande une methode de paiement pour creer PostgreSQL et un cron. Cette variante evite ces deux ressources Render.

## Architecture sans carte

- Render : uniquement le service web Node.js.
- Base PostgreSQL : externe gratuite, par exemple Supabase ou Neon.
- Cron : GitHub Actions, via `.github/workflows/sumup-sync-cron.yml`.

## Variables Render

Dans le service Render, remplir :

```env
SHOPIFY_API_KEY=
SHOPIFY_API_SECRET=
SHOPIFY_APP_URL=https://VOTRE-SERVICE.onrender.com
DATABASE_URL=postgresql://...
SUMUP_API_KEY=
SUMUP_MERCHANT_CODE=
CRON_SECRET=
ENCRYPTION_KEY=
DRY_RUN=true
```

`DATABASE_URL` vient de la base PostgreSQL externe.

## Secrets GitHub Actions

Dans GitHub > Settings > Secrets and variables > Actions, ajouter :

```env
SHOPIFY_APP_URL=https://VOTRE-SERVICE.onrender.com
CRON_SECRET=le-meme-secret-que-render
```

Le workflow appelle ensuite :

```text
/api/cron/sumup-sync
```

avec :

```http
Authorization: Bearer CRON_SECRET
```

## Limite importante

Sans carte, il faut accepter les limites des offres gratuites : pause possible, quotas, latence au reveil, et disponibilite moins solide. Garder `DRY_RUN=true` jusqu'a validation complete.

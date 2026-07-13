# Synchronisation SumUp pour Shopify

Application Shopify integree destinee a une seule boutique, construite sur l'architecture officielle Shopify CLI avec React Router, TypeScript, App Bridge, Polaris, Admin GraphQL, Prisma et un backend Node.js permanent.

## Demarrage local

```bash
npm install
cp .env.example .env
npx prisma generate
shopify app dev
```

`shopify app dev` connecte le projet au Shopify Dev Dashboard, selectionne une boutique de developpement, installe temporairement l'application, cree le tunnel HTTPS, met a jour les URL de developpement et lance le serveur React Router declare dans `shopify.web.toml`.

## Fonctionnalites

- App Home integree dans l'administration Shopify.
- Navigation : Tableau de bord, Correspondances, Produits Shopify, Transactions SumUp, Interventions, Historique, Parametres, Diagnostic.
- Synchronisation SumUp vers Shopify via API REST SumUp et Admin GraphQL Shopify.
- Mode simulation actif par defaut.
- Verrou contre les executions simultanees.
- Idempotence par transaction, ligne et delta de stock.
- Detection des remboursements.
- Transactions sans detail produit envoyees en intervention.
- Route CRON protegee par `Authorization: Bearer CRON_SECRET`.

## Scripts

```bash
npm run dev          # Lance Shopify CLI
npm run build        # Compile React Router
npm run start        # Lance le serveur de production
npm run setup        # Prisma generate + migrate deploy
npm run test         # Vitest
npm run sync:sumup   # Synchronisation manuelle hors iframe avec SHOPIFY_SHOP
```

## Production

`shopify app deploy` deploie la configuration Shopify, les extensions et les webhooks, mais n'heberge pas le backend. Le backend doit etre deploye sur un hebergement Node.js administre comme Render, Google Cloud Run ou Fly.io.

Consultez les guides :

- `INSTALLATION-SHOPIFY-CLI.md`
- `CONFIGURATION-SHOPIFY.md`
- `CONFIGURATION-SUMUP.md`
- `DEPLOIEMENT-SANS-VPS.md`
- `CONFIGURATION-CRON.md`
- `TESTS-AVANT-MISE-EN-PRODUCTION.md`

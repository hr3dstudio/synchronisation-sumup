# Deploiement sans VPS

Ne louez pas de VPS pour cette application si vous ne voulez pas administrer de serveur. Utilisez une plateforme Node.js administree avec HTTPS automatique.

## Option recommandee : Render

Le fichier `render.yaml` fournit :

- un service web Docker pour le backend React Router ;
- un service CRON appele toutes les 15 minutes ;
- une base PostgreSQL Render reliee par `DATABASE_URL` ;
- des variables d'environnement securisees ;
- une URL publique permanente.

Commandes executees par l'image :

```bash
npm ci
npx prisma generate
npm run build
npx prisma migrate deploy
npm run start
```

## Base de donnees

La configuration Render utilise PostgreSQL car Render sait le provisionner directement via `render.yaml`. Si vous voulez absolument MySQL/MariaDB, gardez le schema Prisma en `mysql` et utilisez une base externe compatible en renseignant `DATABASE_URL` manuellement dans Render.

## Alternatives

- Google Cloud Run avec Cloud Scheduler.
- Fly.io avec Machines et cron externe.
- Toute plateforme Node.js HTTPS capable d'executer durablement un processus Node.

## IONOS

Votre hebergement IONOS peut rester le site principal. Ne l'utilisez pour le backend Shopify que si votre offre fournit explicitement un runtime Node.js permanent avec variables d'environnement, processus long-running, HTTPS et acces base de donnees. Un hebergement mutualise PHP classique ne suffit pas pour le template React Router Shopify.

## Important

`shopify app deploy` ne deploie pas le backend. Il deploie la configuration Shopify, les extensions, les declarations de webhooks et les versions Shopify.

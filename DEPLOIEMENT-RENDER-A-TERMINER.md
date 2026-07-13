# Deploiement Render a terminer

Le projet est pret pour Render, mais le deploiement ne peut pas etre cree depuis cette session sans authentification Render/GitHub.

## Etat pret

- Commit local : `9a10ccb`
- Archive prete : `outputs/synchronisation-sumup-render-ready.zip`
- Backend Docker : `Dockerfile`
- Blueprint Render : `render.yaml`
- Base Render : PostgreSQL via `DATABASE_URL`
- Migration Prisma : `prisma/migrations/20260713170000_init_postgresql/migration.sql`
- Route sante : `/health`
- Route CRON protegee : `/api/cron/sumup-sync`

Validations executees :

```bash
npx prisma generate
npm run test
npm run typecheck
npm run build
```

## Etat authentification

Render CLI est connecte :

```text
Aurelien's workspace
```

GitHub CLI n'est pas encore connecte. `gh auth login` a ete lance, mais aucune session GitHub n'a ete enregistree.

Render ne peut pas creer le service depuis ce poste tant qu'il n'a pas un repo GitHub/GitLab/Bitbucket accessible ou une image Docker deja publiee.

## Chemin le plus simple

1. Creer un repo GitHub avec le contenu de `outputs/synchronisation-sumup`.
2. Aller sur Render.
3. New + Blueprint.
4. Selectionner le repo GitHub.
5. Render lit `render.yaml` et cree :
   - le service web `sumup-shopify-sync` ;
   - la base PostgreSQL `sumup-shopify-sync-db` ;
   - le cron `sumup-shopify-sync-cron`.
6. Remplir les variables `sync: false` dans Render :
   - `SHOPIFY_API_KEY`
   - `SHOPIFY_API_SECRET`
   - `SHOPIFY_APP_URL`
   - `SUMUP_API_KEY`
   - `SUMUP_MERCHANT_CODE`

Quand Render fournit l'URL publique, par exemple :

```text
https://sumup-shopify-sync.onrender.com
```

mettre cette URL dans :

```text
SHOPIFY_APP_URL
shopify.app.production.toml
```

puis deployer la configuration Shopify :

```bash
shopify app deploy --client-id bc595165ca79ed5d8bc150dfec245857
```

## Commandes a relancer apres connexion GitHub

```bash
gh auth login --hostname github.com --web --git-protocol https
gh repo create synchronisation-sumup --private --source . --remote origin --push
```

Ensuite, dans Render :

```bash
render services create --name sumup-shopify-sync --type web_service --repo https://github.com/VOTRE-COMPTE/synchronisation-sumup --runtime docker --plan free --health-check-path /health -o json
```

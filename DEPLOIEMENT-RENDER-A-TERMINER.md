# Deploiement Render a terminer

Le projet est pret pour Render. Le repo GitHub est cree et Render est connecte. Comme aucune carte bancaire ne doit etre ajoutee, la configuration Render ne cree plus ni PostgreSQL Render ni cron Render.

## Etat pret

- Commit local : `4a5469b`
- Archive prete : `outputs/synchronisation-sumup-render-ready.zip`
- Backend Docker : `Dockerfile`
- Blueprint Render : `render.yaml`
- Base : PostgreSQL externe via `DATABASE_URL`
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

GitHub est maintenant connecte et le repo prive a ete cree :

```text
https://github.com/hr3dstudio/synchronisation-sumup
```

Le code a ete pousse sur la branche `main`.

Render CLI est connecte au workspace :

```text
Aurelien's workspace
```

Le Blueprint Render a ete teste avec :

```bash
render blueprints validate render.yaml -o json
```

Render refusait la base PostgreSQL et le cron car le workspace n'a pas d'information de paiement :

```json
{
  "errors": [
    { "error": "need_payment_info", "path": "databases[0]" },
    { "error": "need_payment_info", "path": "services[1]" }
  ],
  "valid": false
}
```

Decision : ne pas ajouter de methode de paiement. Le projet utilise maintenant :

- Render pour le backend web uniquement ;
- une base PostgreSQL externe gratuite ;
- GitHub Actions pour le cron SumUp.

## Chemin sans carte bancaire

1. Aller sur Render.
2. New + Blueprint.
3. Selectionner le repo GitHub `https://github.com/hr3dstudio/synchronisation-sumup`.
4. Render lit `render.yaml` et cree uniquement :
   - le service web `sumup-shopify-sync` ;
5. Remplir les variables `sync: false` dans Render :
   - `SHOPIFY_API_KEY`
   - `SHOPIFY_API_SECRET`
   - `SHOPIFY_APP_URL`
   - `DATABASE_URL`
   - `SUMUP_API_KEY`
   - `SUMUP_MERCHANT_CODE`
   - `CRON_SECRET`
   - `ENCRYPTION_KEY`

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

## Commandes a relancer

```bash
render blueprints validate render.yaml -o json
```

Puis creer le Blueprint depuis le Dashboard Render en selectionnant le repo :

```text
https://github.com/hr3dstudio/synchronisation-sumup
```

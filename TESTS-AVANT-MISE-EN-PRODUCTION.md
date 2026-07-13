# Tests avant mise en production

Executez :

```bash
npm install
npx prisma generate
npm run test
npm run build
```

Verifications obligatoires :

- empreintes produit stables ;
- correspondances SumUp vers Shopify correctes ;
- aucune double deduction de stock ;
- mode simulation actif par defaut ;
- remboursements sans restock automatique sauf option explicite ;
- erreurs GraphQL remontees dans les journaux ;
- route CRON refusee sans `Authorization: Bearer CRON_SECRET` ;
- tests avec API Shopify simulee ;
- tests avec API SumUp simulee ;
- installation dans une boutique de developpement via `shopify app dev`.

Avant `DRY_RUN=false`, comparez les transactions SumUp recentes avec les ajustements simules dans l'interface Historique.

# Configuration SumUp

Renseignez les variables suivantes dans l'hebergeur et en local dans `.env` :

```env
SUMUP_API_KEY=
SUMUP_MERCHANT_CODE=
SUMUP_SYNC_PAYMENT_TYPES=POS,CASH
```

Le client SumUp utilise l'API REST publique et interroge l'historique des transactions sur une fenetre glissante controlee par :

```env
SYNC_LOOKBACK_MINUTES=15
```

Les transactions sans lignes produit exploitables sont stockees dans `ManualIntervention`. Les produits doivent etre associes manuellement a une variante Shopify avant application reelle des stocks.

Gardez `DRY_RUN=true` jusqu'a validation complete sur boutique de developpement.

# Configuration CRON

La route planifiee est :

```text
/api/cron/sumup-sync
```

Elle exige l'en-tete :

```http
Authorization: Bearer CRON_SECRET
```

Le secret ne doit jamais etre mis dans l'URL.

## Exemple curl

```bash
curl -fsS \
  -H "Authorization: Bearer $CRON_SECRET" \
  "$SHOPIFY_APP_URL/api/cron/sumup-sync"
```

## Frequence conseillee

Commencez par toutes les 15 minutes avec :

```env
SYNC_LOOKBACK_MINUTES=15
DRY_RUN=true
```

Quand les journaux, interventions et ajustements simules sont corrects, passez a :

```env
DRY_RUN=false
```

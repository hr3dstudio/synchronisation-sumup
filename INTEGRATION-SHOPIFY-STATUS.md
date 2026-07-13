# Statut integration Shopify

Date : 2026-07-13

## Organisation liee

- Organisation : La Boutique De Minipouce
- Organisation ID : `140738508`
- Dashboard : `https://dev.shopify.com/dashboard/140738508`

## Application liee

- Nom : `synchronisation-sumup`
- Client ID : `bc595165ca79ed5d8bc150dfec245857`
- Version non publiee creee : `synchronisation-sumup-2`
- URL version : `https://dev.shopify.com/dashboard/140738508/apps/396957974529/versions/1049363251201`

## Boutique detectee

- Domaine public : `https://www.laboutiquedeminipouce.fr/`
- Domaine Shopify interne detecte dans le storefront : `9faizs-9a.myshopify.com`
- Store ID CLI : `gid://shopify/Shop/86658285902`

## Commandes executees

```bash
shopify app config link --client-id bc595165ca79ed5d8bc150dfec245857
shopify app deploy --client-id bc595165ca79ed5d8bc150dfec245857 --no-build --no-release --message "Configuration SumUp non publiee"
shopify store list --organization-id 140738508 --json
shopify app dev --client-id bc595165ca79ed5d8bc150dfec245857 --store 9faizs-9a.myshopify.com
```

## Blocage Shopify CLI

`shopify app dev` refuse `9faizs-9a.myshopify.com` :

```text
Could not find store for domain 9faizs-9a.myshopify.com in organization La Boutique De Minipouce.
Ensure you have provided the correct store domain, that the store is a dev store, and that you have access to the store.
```

La boutique publique existe bien dans l'organisation, mais Shopify CLI ne l'expose pas comme boutique de developpement compatible avec `shopify app dev`.

## Boutique preview creee

- Nom : `Minipouce SumUp Dev`
- Domaine : `1jvbgc-1h.myshopify.com`

Cette boutique preview est authentifiee avec `shopify store auth`, mais elle n'est pas rattachee a l'organisation `140738508`; `shopify app dev` la refuse donc aussi pour cette app.

## Prochaine action requise

Dans le Shopify Dev Dashboard ou l'admin Shopify, il faut disposer d'une vraie boutique de developpement rattachee a l'organisation `La Boutique De Minipouce`, puis relancer :

```bash
shopify app dev --client-id bc595165ca79ed5d8bc150dfec245857 --store VOTRE-BOUTIQUE-DEV.myshopify.com
```

Pour la production, ne pas utiliser `https://www.laboutiquedeminipouce.fr/` comme backend d'application : c'est le storefront Shopify. Il faut d'abord deployer le backend Node.js sur Render, Cloud Run, Fly.io ou equivalent, puis mettre cette URL HTTPS dans `shopify.app.production.toml` et publier une version Shopify.

# Installation Shopify CLI

Commandes verifiees avec la documentation Shopify actuelle et l'aide locale de Shopify CLI :

```bash
npm install -g @shopify/cli@latest
shopify version
shopify auth login
shopify app init --name sumup-shopify-sync --template=https://github.com/Shopify/shopify-app-template-react-router --package-manager=npm
cd sumup-shopify-sync
shopify app dev
shopify app config link
shopify app deploy
```

La documentation Shopify indique que `shopify app init` puis le choix `Build a React Router app` est le chemin recommande pour la plupart des applications integrees. Elle indique aussi que la commande directe suivante est valide :

```bash
shopify app init --template=https://github.com/Shopify/shopify-app-template-react-router
```

Sur cette machine, Shopify CLI a pu se lancer mais s'est arretee parce que `git` n'est pas installe. Installez Git for Windows avant de relancer l'initialisation officielle si vous voulez regenerer le template depuis zero.

## Developpement

```bash
npm install
shopify app dev
```

La commande `shopify app dev` ne doit pas etre utilisee en production. Elle cree un tunnel HTTPS temporaire et met a jour les URL de developpement.

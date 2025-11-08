# dofus-lfgThis is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
# Lancer le serveur de dev
npm run dev

# Build de production
npm run build

# Démarrer en production (après build)
npm run start

# Lint
npm run lint
```

## Déploiement
- Vercel recommandé (Next.js).
- Configure les variables d’environnement (DATABASE_URL, NEXTAUTH_URL, NEXTAUTH_SECRET, GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET) dans le tableau de bord.
- Exécute les migrations Prisma avant le premier démarrage.

## Dépannage rapide
- Auth Google: assure-toi d’ajouter `http://localhost:3000` (dev) aux URI de redirection autorisées.
- Import quêtes: vérifie la validité JSON et le chemin du fichier (`DOFUS_QUESTS_FILE`).
- Prisma: si erreurs de connexion, revalide `DATABASE_URL` et que la DB est joignable.

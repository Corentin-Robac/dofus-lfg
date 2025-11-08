# Dofus LFG

Application Next.js pour organiser des groupes (LFG) autour des quêtes Dofus, avec authentification Google (NextAuth) et base PostgreSQL via Prisma.

## Aperçu
- **Framework**: Next.js (App Router)
- **Auth**: NextAuth avec Google + Prisma Adapter (sessions en base)
- **DB**: PostgreSQL (Prisma)
- **Scripts utiles**: seed des serveurs, import de quêtes depuis JSON

## Prérequis
- Node.js 18+
- PostgreSQL accessible (local ou cloud)
- Un projet Google OAuth (client ID/secret)

## Installation
```bash
npm install
```

## Configuration
Crée un fichier `.env` à la racine avec les variables suivantes:

```bash
# Base de données (PostgreSQL)
DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DBNAME?schema=public"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="une_chaine_aleatoire_longue"
GOOGLE_CLIENT_ID="..."
GOOGLE_CLIENT_SECRET="..."

# Import des quêtes (optionnel)
# DOFUS_QUESTS_FILE="/chemin/vers/quests.fr.json"
```

- Le fichier par défaut d’import des quêtes est `data/quests.fr.json` (fourni).
- Ne commite jamais `.env` (déjà ignoré par `.gitignore`).

## Base de données
Initialise le schéma Prisma puis insère les données initiales (serveurs) et les quêtes.

```bash
# Génère/migre le schéma (en dev)
npx prisma migrate dev

# Seed serveurs
npm run db:seed

# Import des quêtes à partir du JSON
npm run quests:import
# ou avec un fichier custom
# DOFUS_QUESTS_FILE="/chemin/vers/mon.json" npm run quests:import
```

## Développement
Scripts principaux:

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

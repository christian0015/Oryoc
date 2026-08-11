# ORYOC

Plateforme de confiance pour la location longue duree au Maroc — annonces
verifiees, reputation a trois facettes (fiabilite / respect / sociabilite),
visites 360°, evenements communautaires moderes, et un reseau de
compensation pour le transport entre le Maroc et l'etranger.

## Stack

- **Next.js 16** (App Router, Server Components, Server Actions)
- **MongoDB via Mongoose** — un seul fichier de schemas consolide (`lib/models.ts`)
- **NextAuth (Auth.js v5)** — Google en priorite, email/mot de passe en secours
- **Cloudinary** — upload signe cote serveur, jamais de fichier qui transite par notre serveur
- **Tailwind v4** (config CSS-first) + **Framer Motion** + **GSAP** (ScrollTrigger)
- **three.js / @react-three/fiber / @react-three/drei** — visionneuse 360°
- **Leaflet / react-leaflet** — cartes (tuiles CARTO dark, sans cle API)
- **Zod** — validation de tous les inputs cote serveur

Chaque fichier commence par un commentaire indiquant son chemin.

## Demarrage

```bash
npm install
cp .env.local.example .env.local   # puis remplir les valeurs (voir ci-dessous)
npm run seed                        # optionnel — jeu de donnees de demo
npm run dev
```

## Variables d'environnement

Voir `.env.local.example` pour la liste complete. Resume :

| Variable | Ou l'obtenir |
|---|---|
| `MONGODB_URI` | MongoDB Atlas (cluster gratuit suffit pour demarrer) |
| `NEXTAUTH_SECRET` | `npx auth secret` |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | Google Cloud Console > Identifiants OAuth 2.0 |
| `CLOUDINARY_CLOUD_NAME` / `CLOUDINARY_API_KEY` / `CLOUDINARY_API_SECRET` | Dashboard Cloudinary |
| `CRON_SECRET` | Une valeur aleatoire — protege la route `/api/cron/listing-lifecycle` |

## Comptes de demonstration

Apres `npm run seed`, mot de passe commun `password123` :

- `admin@oryoc.ma` — administrateur (`/admin/moderation`)
- `yasmine@example.com` — proprietaire certifiee (annonce avec visite 360°)
- `karim@example.com` — locataire
- `contact@atlas-immobilier.ma` — agence certifiee
- `sofiane@example.com` — demarcheur (certification en attente, pour tester la moderation)

## Architecture

```
app/                     — routes (App Router)
  (auth)/login, register
  listings/               — recherche, fiche, creation, gestion proprietaire
  events/                 — recherche, fiche, creation, gestion organisateur
  compensation/           — recherche, creation, gestion
  profile/[id], profile/me
  admin/moderation/       — certifications, evenements, signalements
  api/upload, api/upload/delete, api/auth/[...nextauth], api/cron/listing-lifecycle

lib/
  models.ts               — tous les schemas Mongoose
  db.ts                    — singleton de connexion Mongoose
  auth.ts                  — config NextAuth + helpers de session
  serializers.ts           — fonctions document -> DTO (hors fichiers "use server", requis par Next.js)
  cloudinary.ts             — SDK cote serveur uniquement
  cloudinary-folders.ts     — constantes partagees cote client (pas de SDK)
  validation.ts             — schemas Zod
  geo.ts                    — distance Haversine + geocodage (Nominatim/OSM)
  trust-score.ts            — recalcul des scores de confiance + badges
  listing-lifecycle.ts       — regles de relance / corbeille / archivage
  cascade-delete.ts          — suppression en cascade (Cloudinary inclus)
  hooks.ts                   — hooks client consolides (autosave, debounce, orientation, auth-gate)
  i18n.ts                    — dictionnaire FR/EN
  actions/                   — Server Actions, un fichier par domaine

components/                — composants partages (design system + composants riches)
scripts/seed.ts             — jeu de donnees de demonstration
```

## Notes d'implementation

- **Autosave** : les champs texte (titre, description, telephone...) s'enregistrent
  automatiquement apres 400ms d'inactivite (`useAutosaveField`). Les selects/toggles
  s'appliquent immediatement.
- **Porte d'authentification** : chaque action sensible retourne une erreur typee
  `AUTH_REQUIRED` plutot que de rediriger brutalement — le client ouvre une modale
  de connexion via `useAuthGatedAction` / `useAuthModal`.
- **Moderation** : les documents de certification et les evenements ne sont jamais
  auto-approuves ; ils passent par `/admin/moderation`. L'acces admin est un champ
  `isAdmin` sur `User`, distinct du role marketplace (locataire/proprietaire/...).
- **Cycle de vie des annonces** : `lib/listing-lifecycle.ts` fait tomber une annonce
  non confirmee hors des resultats de recherche apres 10 jours, la met a la corbeille
  apres 15, puis l'archive (jamais de suppression automatique irreversible) apres 30
  jours en corbeille. A brancher sur un cron (voir `vercel.json`).
- **Visite 360°** : `panorama-capture.tsx` guide la couverture a 360° via le capteur
  d'orientation du telephone, puis l'utilisateur importe sa photo equirectangulaire
  deja assemblee par l'appareil. `panorama-viewer.tsx` affiche des scenes liees par
  des hotspots qu'on place en cliquant directement sur la sphere.
- **Recherche floue** : les filtres pieces/prix acceptent une marge (±1 piece, ±10%
  de prix) plutot qu'une correspondance exacte.

## Build

```bash
npm run build
```

Verifie avec succes dans cet environnement (toutes les routes compilent et se
generent) — seule l'etape de recuperation des polices Google Fonts necessite un
acces reseau sortant vers fonts.googleapis.com, indisponible dans le bac a sable
utilise pour construire ce projet mais qui fonctionnera normalement en deploiement
(Vercel ou tout environnement avec acces internet standard).

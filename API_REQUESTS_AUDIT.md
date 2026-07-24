# Audit des requetes API Kisinet

## 1. Resume

Les requetes observees sont majoritairement fonctionnelles et renvoient `200 OK`, mais plusieurs appels etaient redondants en developpement et pendant certains chargements de page.

Les causes principales etaient :

- `components/sales/sales-choices-bootstrap.tsx` etait monte dans `app/layout.tsx`, donc les trois listes de reference ventes etaient chargees globalement, meme sur les pages qui ne les utilisent pas.
- `components/layout/app-layout.tsx` charge les permissions de pharmacie pour la navbar, tandis que plusieurs pages chargent les memes permissions pour leur contenu. Ces appels peuvent partir en parallele au montage.
- `getPharmacyDashboard(pharmacyId)` regroupe trois appels backend : dashboard, alertes stock et factures en attente. Il est appele sur la page dashboard, mais aussi sur la page creation de vente pour recuperer le nom de pharmacie et la devise.
- Le projet n'utilisait ni SWR, ni TanStack Query, ni Zustand, ni cache Next pour ces appels client. Les helpers utilisaient `fetch(..., { cache: "no-store" })`.
- Plusieurs `useEffect` n'avaient pas de garde contre les reponses obsoletes apres demontage ou changement rapide de pharmacie.

Les corrections appliquees sont volontairement limitees :

- ajout d'une deduplication en memoire des promesses en cours ;
- cache TTL de 24 h seulement pour les listes de reference ventes ;
- invalidation du cache en memoire a la deconnexion ;
- gardes `isCurrent` / `isMounted` sur les effets les plus exposes.

## 2. Cartographie des requetes

| Endpoint | Fichier appelant | Composant ou hook | Declencheur | Nombre probable d'appels | Necessaire | Probleme |
| -------- | ---------------- | ----------------- | ----------- | -----------------------: | ---------- | -------- |
| `GET /api/sales/payment-methods/` | `components/sales/sales-choices-bootstrap.tsx`, `lib/api/sales-choices.ts` | `SalesChoicesBootstrap` | Montage du layout racine | 1 en prod, jusqu'a 2 en dev Strict Mode avant correction | Partiellement | Global, charge meme hors pages de vente. Corrige par TTL + dedupe. |
| `GET /api/sales/statuses/` | `components/sales/sales-choices-bootstrap.tsx`, `lib/api/sales-choices.ts` | `SalesChoicesBootstrap` | Montage du layout racine | 1 en prod, jusqu'a 2 en dev Strict Mode avant correction | Partiellement | Meme cause que ci-dessus. |
| `GET /api/sales/payment-statuses/` | `components/sales/sales-choices-bootstrap.tsx`, `lib/api/sales-choices.ts` | `SalesChoicesBootstrap` | Montage du layout racine | 1 en prod, jusqu'a 2 en dev Strict Mode avant correction | Partiellement | Meme cause que ci-dessus. |
| `GET /api/pharmacies/` | `components/layout/public-layout.tsx` | `PublicNavbar` | Montage d'un layout public avec utilisateur connecte | 1 par montage public | Oui pour menu connecte | Peut etre repete par `MainLayout` et pages publiques. Dedupe appliquee. |
| `GET /api/pharmacies/` | `app/app/select-pharmacy/page.tsx` | `SelectPharmacyPage` | Chargement page selection pharmacie | 1 par montage | Oui | Peut coexister avec la navbar publique. Dedupe appliquee. |
| `GET /api/pharmacies/` | `app/app/settings/page.tsx` | `AccountSettingsPage` | Chargement parametres compte | 1 par montage | Oui | Peut coexister avec `PublicNavbar`. Dedupe appliquee. |
| `GET /api/pharmacies/` | `app/tarifs/[name]/page.tsx` | `PlanDetailPage` | Chargement detail tarif connecte | 1 par montage | Oui | Normal, dedupe appliquee. |
| `GET /api/pharmacies/{pharmacyId}/permissions/` | `components/layout/app-layout.tsx` | `AppNavbar` | Montage/changement pharmacie | 1 par espace pharmacie | Oui | Double avec plusieurs pages. Dedupe appliquee. |
| `GET /api/pharmacies/{pharmacyId}/permissions/` | `app/app/pharmacies/[pharmacyId]/dashboard/page.tsx` | `PharmacyDashboardPage` | Chargement dashboard | 1 par montage | Oui | Double avec navbar. Dedupe appliquee. |
| `GET /api/pharmacies/{pharmacyId}/permissions/` | `app/app/pharmacies/[pharmacyId]/products/page.tsx` | `PharmacyProductsPage` | Chargement produits, filtres, reload | 1 par filtre/reload | Oui | Double avec navbar. Dedupe appliquee. |
| `GET /api/pharmacies/{pharmacyId}/permissions/` | `app/app/pharmacies/[pharmacyId]/stock/page.tsx` | `PharmacyStockPage` | Chargement stock, pagination, reload | 1 par page/reload | Oui | Double avec navbar. Dedupe appliquee. |
| `GET /api/pharmacies/{pharmacyId}/permissions/` | `app/app/pharmacies/[pharmacyId]/invoices/page.tsx` | `PharmacyInvoicesPage` | Chargement factures, filtres, reload | 1 par filtre/reload | Oui | Double avec navbar. Dedupe appliquee. |
| `GET /api/pharmacies/{pharmacyId}/dashboard/` | `app/app/pharmacies/[pharmacyId]/dashboard/page.tsx`, `lib/dashboard-api.ts` | `PharmacyDashboardPage` | Chargement dashboard | 1 par montage | Oui | Normal. Dedupe appliquee. |
| `GET /api/pharmacies/{pharmacyId}/dashboard/` | `app/app/pharmacies/[pharmacyId]/sales/create/page.tsx`, `lib/dashboard-api.ts` | `CreateSalePage` | Chargement page vente | 1 par montage | Partiellement | Charge tout le dashboard pour nom/devise. Optimisation future recommandee. |
| `GET /api/pharmacies/{pharmacyId}/stock/alerts/` | `lib/dashboard-api.ts` | `getPharmacyDashboard` | Appel dashboard ou creation vente | 1 par appel `getPharmacyDashboard` | Oui sur dashboard | Redondant sur creation vente si seul nom/devise est necessaire. Dedupe appliquee. |
| `GET /api/pharmacies/{pharmacyId}/invoices/pending/` | `lib/dashboard-api.ts` | `getPharmacyDashboard` | Appel dashboard ou creation vente | 1 par appel `getPharmacyDashboard` | Oui sur dashboard | Redondant sur creation vente. Dedupe appliquee. |
| `GET /api/accounts/me/` | `app/app/profile/page.tsx` | `AccountProfilePage` | Chargement profil | 1 par montage | Oui | Normal. Dedupe appliquee via helper. |
| `GET /api/accounts/me/` | `lib/api/sales.ts` | `getCurrentCashierName` | Chargement creation vente | 1 par montage | Oui | Normal, dedupe appliquee. |
| `GET /api/paiements/pharmacy-plans/` | `app/tarifs/page.tsx`, `lib/api.ts` | `TarifsPage` | Chargement tarifs | 1 par montage | Oui | Donnee publique stable. Dedupe des promesses en cours appliquee. |

## 3. Causes identifiees

### Cause 1 : listes ventes chargees globalement

- Fichier : `app/layout.tsx`, ligne approximative 21.
- Fonction : `RootLayout`.
- Fichier : `components/sales/sales-choices-bootstrap.tsx`, ligne approximative 7.
- Fonction : `SalesChoicesBootstrap`.
- Explication : le bootstrap etait monte pour toute l'application et appelait `refreshSalesChoices()` des le montage client.
- Consequence : `/api/sales/payment-methods/`, `/api/sales/payment-statuses/` et `/api/sales/statuses/` partaient meme sur l'accueil, les tarifs ou une page publique.
- Correction recommandee : garder les listes en donnees de reference avec cache TTL et deduplication, ou deplacer le chargement vers les pages qui en ont besoin. Correction appliquee : TTL 24 h + promesse dedupee dans `lib/api/sales-choices.ts`.

### Cause 2 : permissions appelees par le layout et les pages

- Fichier : `components/layout/app-layout.tsx`, ligne approximative 57.
- Fonction : `AppNavbar`.
- Fichiers : `dashboard/page.tsx`, `products/page.tsx`, `stock/page.tsx`, `invoices/page.tsx`, `notifications/page.tsx`, `settings/*`.
- Fonction : effets de chargement des pages.
- Explication : la navbar a besoin des permissions pour activer/desactiver les onglets, et les pages les rechargent pour securiser leur contenu.
- Consequence : deux appels simultanes au meme endpoint `/permissions/` lors de certains chargements.
- Correction recommandee : dedupe en memoire par cle `token + path`, puis eventuellement contexte pharmacie/permissions si l'architecture grandit. Correction appliquee dans `lib/api.ts`.

### Cause 3 : dashboard compose de trois endpoints

- Fichier : `lib/dashboard-api.ts`, ligne approximative 129.
- Fonction : `getPharmacyDashboard`.
- Explication : un seul appel frontend lance trois requetes backend en parallele : `/dashboard/`, `/stock/alerts/`, `/invoices/pending/`.
- Consequence : c'est normal sur le dashboard, mais lourd sur `sales/create` qui utilise surtout nom de pharmacie et devise.
- Correction recommandee : garder le dashboard compose pour la page dashboard, mais remplacer plus tard l'appel de `sales/create` par un endpoint plus leger comme `getPharmacyDetail(pharmacyId)` si les donnees suffisent.

### Cause 4 : Strict Mode en developpement

- Fichier : `next.config.mjs`, ligne approximative 1.
- Fonction : configuration Next.
- Explication : `reactStrictMode` n'est pas configure explicitement. Avec Next.js App Router en developpement, React peut monter/demonter/remonter des composants pour detecter les effets non idempotents.
- Consequence : les `useEffect([])` peuvent paraitre lances deux fois en dev, mais pas en production.
- Correction recommandee : ne pas desactiver Strict Mode pour cacher le symptome. Rendre les effets idempotents avec dedupe, cache adapte et gardes d'obsolescence. Correction appliquee.

### Cause 5 : absence de garde sur certains effets

- Fichiers : `dashboard/page.tsx`, `products/page.tsx`, `stock/page.tsx`, `invoices/page.tsx`, `sales/create/page.tsx`, `components/layout/public-layout.tsx`.
- Fonction : effets de chargement asynchrones.
- Explication : les effets pouvaient appeler `setState` apres demontage ou apres changement rapide de route/pharmacie.
- Consequence : risque d'afficher des donnees obsoletes ou d'ecraser l'etat courant.
- Correction recommandee : ajouter un garde local `isCurrent` / `isMounted`. Correction appliquee.

## 4. Requetes normales

Les requetes suivantes sont normales lorsqu'elles correspondent a la page affichee :

- `/api/pharmacies/` sur selection pharmacie, parametres compte, detail tarif connecte ou navbar publique connectee.
- `/api/pharmacies/{pharmacyId}/permissions/` sur les pages d'espace pharmacie et dans la navbar.
- `/api/pharmacies/{pharmacyId}/dashboard/`, `/stock/alerts/`, `/invoices/pending/` sur le dashboard.
- `/api/accounts/me/` sur le profil et pour identifier le caissier sur la creation de vente.
- `/api/paiements/pharmacy-plans/` sur les tarifs.

Les requetes `OPTIONS /api/... 200` peuvent etre des preflights CORS normaux. Le frontend utilise par defaut `http://127.0.0.1:3000` ou `http://localhost:3000` selon le serveur Next, et le backend est sur `http://127.0.0.1:8002`. Ce sont deux origines differentes. Les appels authentifies envoient `Authorization: Bearer ...`, et les POST/PATCH avec corps envoient `Content-Type: application/json`; ces headers rendent souvent le preflight necessaire. Le backend contient `corsheaders`, `CorsMiddleware`, `CORS_URLS_REGEX = r"^/api/.*$"` et `CORS_ALLOWED_ORIGINS` par defaut a `["http://localhost:3000"]`.

Point a verifier en local : si le frontend tourne sur `http://127.0.0.1:3000`, ajouter aussi cette origine dans `CORS_ALLOWED_ORIGINS`. Cela ne supprime pas forcement les `OPTIONS`, mais evite les erreurs CORS.

## 5. Plan de correction

Critique :

- dedupliquer les requetes identiques simultanees pour eviter les doublons Strict Mode et layout/page. Fait dans `lib/api-request-cache.ts`, `lib/api.ts`, `lib/dashboard-api.ts`.
- proteger les effets contre les reponses obsoletes. Fait sur les pages principales.

Importante :

- garder un cache TTL pour les listes de reference ventes. Fait dans `lib/api/sales-choices.ts`.
- invalider le cache authentifie a la deconnexion. Fait dans `lib/auth.ts`.

Optimisation :

- deplacer `SalesChoicesBootstrap` hors du layout racine ou le convertir en chargement a la demande si les pages hors vente n'ont jamais besoin de ces listes.
- remplacer `getPharmacyDashboard()` dans `sales/create` par une requete plus legere pour nom/devise.
- envisager un `PharmacyContext` pour exposer permissions + contexte pharmacie a toutes les pages d'un espace, si le besoin devient transversal.

## 6. Risques

- Donnees obsoletes : le cache persistant n'est utilise que pour les choix ventes avec TTL 24 h. Les donnees sensibles ou liees a une pharmacie ne sont pas conservees apres resolution, sauf promesses en cours.
- Cache incorrect : les cles authentifiees incluent le token et le chemin. Les donnees pharmacie incluent la reference dans le chemin, par exemple `permissions:PH...` via `/api/pharmacies/PH.../permissions/`.
- Perte de permissions actualisees : pas de TTL applique aux permissions ; seule une requete simultanee identique est partagee.
- Donnees d'une pharmacie affichees dans une autre : les chemins contiennent `pharmacyId`, donc les promesses ne sont pas partagees entre pharmacies.
- Probleme apres deconnexion : `logout()` vide maintenant le cache en memoire.
- Changement de pharmacie : les effets corriges ignorent les anciennes reponses si la page est demontee ou si le parametre change.

## Corrections appliquees

- Ajout de `lib/api-request-cache.ts`.
- Deduplication des GET authentifies dans `lib/api.ts`.
- Deduplication des trois endpoints dashboard dans `lib/dashboard-api.ts`.
- Cache TTL + lecture du cache local non sensible pour les choix de vente dans `lib/api/sales-choices.ts`.
- Invalidation du cache en memoire dans `lib/auth.ts`.
- Gardes d'obsolescence dans `components/layout/public-layout.tsx`, `dashboard/page.tsx`, `products/page.tsx`, `stock/page.tsx`, `invoices/page.tsx` et `sales/create/page.tsx`.

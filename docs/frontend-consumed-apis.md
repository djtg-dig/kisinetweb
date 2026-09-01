# APIs consommées par le frontend Kisinet

Ce fichier liste les endpoints backend déjà consommés par l'interface frontend.

## Authentification

- `GET /api/carri-account/login/`
- `POST /api/accounts/token/refresh/`
- `POST /api/accounts/logout/`
- `GET /api/accounts/session/`

Les boutons frontend de connexion doivent pointer vers `/auth/carri`. Cette page
est l'unique point frontend de démarrage et de retour d'authentification :

- sans fragment, elle redirige vers la Route Handler Next `GET /api/auth/carri`,
  qui redirige le navigateur vers `GET /api/carri-account/login/` côté backend
  Kisinet afin que les cookies de session Django portent le `code_verifier`
  PKCE jusqu'au callback OAuth ;
- avec un fragment `#access=...&refresh=...`, elle stocke les tokens JWT Kisinet
  en `localStorage`, nettoie immédiatement le fragment de l'URL, puis redirige
  vers le paramètre `next` interne s'il existe, sinon `/app/select-pharmacy`.

PKCE, OpenID Connect Discovery, scopes, `id_token`, JWKS, `state`, callback
OAuth et échange du code restent entièrement gérés par le backend Kisinet. Le
frontend ne consomme ni ne stocke le `id_token` Kari Accounts.

Gestion des erreurs d'authentification utilisateur :

- `401 Unauthorized` signifie session invalide ou expirée : le frontend tente
  `POST /api/accounts/token/refresh/`, rejoue la requête si le refresh réussit,
  et ferme la session locale si le refresh échoue ;
- `403 Forbidden` signifie utilisateur authentifié mais non autorisé : le
  frontend affiche une erreur d'autorisation et ne tente pas de reconnexion
  automatique.

La déconnexion utilisateur est best-effort côté serveur : le frontend tente
`POST /api/accounts/logout/` avec `Authorization: Bearer <access_token>` et le
`refresh` dans le corps JSON, mais supprime toujours les tokens locaux et le
contexte pharmacie, même si le backend est indisponible.

## Comptes

- `GET /api/accounts/me/`

### GET /api/accounts/me/

- **Objectif** : consulter le profil de l'utilisateur connecté.
- **Méthode HTTP** : `GET`
- **URL** : `/api/accounts/me/`
- **Pages frontend** : `/app/profile`
- **Service frontend** : `getAccountProfile()` dans `lib/api`
- **Authentification** : requise avec `Authorization: Bearer <access_token>`.
- **Réponse attendue (200)** : profil utilisateur avec `reference`, `email`,
  `first_name`, `last_name`, `phone_number`, `date_joined` et `updated_at`.
- **Comportement frontend** : le menu `Compte > Mon profil` mène vers la page
  profil global de l'utilisateur. Cette page ne dépend pas d'une pharmacie active.

## Administration interne

L'espace d'administration interne est séparé de l'espace pharmacie et n'utilise
pas Carri Account pour cette première version.

Route de connexion frontend:

- `/lapatatedoucue/admin/` par défaut;
- le segment `lapatatedoucue` est centralisé dans `lib/admin/config.ts`;
- il peut être remplacé par `NEXT_PUBLIC_ADMIN_ENTRY_PATH`;
- cette valeur n'est pas un secret.

La route demandée `/api/lapatatedoucue/admin/` n'est pas utilisée côté frontend
Next.js, car le préfixe `/api` est réservé aux Route Handlers/API Routes et peut
entrer en collision avec un reverse proxy qui route `/api/*` vers Django.

Routes frontend protégées:

- `/admin`
- `/admin/dashboard`
- `/admin/dashboard/ai`
- `/admin/dashboard/ai/analyses`
- `/admin/dashboard/ai/analyses/[id]`
- `/admin/dashboard/ai/statistiques`
- `/admin/dashboard/ai/erreurs`
- `/admin/dashboard/ai/logs`
- `/admin/dashboard/ai/consommation`
- `/admin/dashboard/ai/couts`
- `/admin/users`
- `/admin/pharmacies`
- `/admin/subscriptions`
- `/admin/payments`
- `/admin/settings`

Ces pages déclarent `noindex, nofollow` et ne sont liées depuis aucune navigation
publique, aucun menu utilisateur et aucun menu pharmacie.

Endpoints consommés:

| Usage frontend | Méthode et URL | Auth |
| --- | --- | --- |
| Connexion admin | `POST /api/admin/auth/login/` | Non |
| Session admin | `GET /api/admin/auth/me/` | Oui, admin `is_staff` |
| Déconnexion admin | `POST /api/admin/auth/logout/` | Oui, admin `is_staff` |
| Refresh admin | `POST /api/admin/auth/refresh/` | Non, refresh token admin |
| Liste utilisateurs admin | `GET /api/admin/users/?search=...&page=...` | Oui, admin `is_staff` |
| Liste pharmacies admin | `GET /api/admin/pharmacies/?search=...&devise=...&country=...&city_or_province=...&neighborhood=...&archived=...&has_email=...&has_phone=...&page=...` | Oui, admin `is_staff` |
| Liste abonnements admin | `GET /api/admin/subscriptions/?search=...&reference=...&plan_code=...&status=...&page=...` | Oui, admin `is_staff` |
| Liste retraits parrainage admin | `GET /api/admin/referral-withdrawals/?search=...&status=...&currency=...&page=...` | Oui, admin `is_staff` |
| Liste fournisseurs paiement admin | `GET /api/admin/payment-providers/` | Oui, admin `is_staff` |
| Création fournisseur paiement admin | `POST /api/admin/payment-providers/` | Oui, admin `is_staff` |
| Détail fournisseur paiement admin | `GET /api/admin/payment-providers/{id}/` | Oui, admin `is_staff` |
| Mise à jour fournisseur paiement admin | `PUT /api/admin/payment-providers/{id}/` | Oui, admin `is_staff` |
| Mise à jour partielle fournisseur paiement admin | `PATCH /api/admin/payment-providers/{id}/` | Oui, admin `is_staff` |
| Suppression fournisseur paiement admin | `DELETE /api/admin/payment-providers/{id}/` | Oui, admin `is_staff` |
| Liste devises | `GET /api/paiements/currencies/` | Non (public) |
| Liste pays | `GET /api/pharmacies/countries/` | Oui, authentifié |
| Liste comptes de paiement utilisateurs admin | `GET /api/admin/user-payment-accounts/?search=...&is_active=...` | Oui, admin `is_staff` |
| Détail compte de paiement utilisateur admin | `GET /api/admin/user-payment-accounts/{id}/` | Oui, admin `is_staff` |
| Liste gestion comptes de paiement admin | `GET /api/admin/user-payment-accounts-management/` | Oui, admin `is_staff` |
| Création compte de paiement admin | `POST /api/admin/user-payment-accounts-management/` | Oui, admin `is_staff` |
| Détail gestion compte de paiement admin | `GET /api/admin/user-payment-accounts-management/{id}/` | Oui, admin `is_staff` |
| Mise à jour compte de paiement admin | `PUT /api/admin/user-payment-accounts-management/{id}/` | Oui, admin `is_staff` |
| Mise à jour partielle compte de paiement admin | `PATCH /api/admin/user-payment-accounts-management/{id}/` | Oui, admin `is_staff` |
| Suppression compte de paiement admin | `DELETE /api/admin/user-payment-accounts-management/{id}/` | Oui, admin `is_staff` |
| Activation compte de paiement admin | `POST /api/admin/user-payment-accounts-management/{id}/activate/` | Oui, admin `is_staff` |
| Désactivation compte de paiement admin | `POST /api/admin/user-payment-accounts-management/{id}/deactivate/` | Oui, admin `is_staff` |
| Liste catégories paiement admin | `GET /api/paiements/admin/payment-categories/` | Oui, admin `is_staff` |
| Création catégorie paiement admin | `POST /api/paiements/admin/payment-categories/` | Oui, admin `is_staff` |
| Détail catégorie paiement admin | `GET /api/paiements/admin/payment-categories/{id}/` | Oui, admin `is_staff` |
| Mise à jour catégorie paiement admin | `PUT /api/paiements/admin/payment-categories/{id}/` | Oui, admin `is_staff` |
| Mise à jour partielle catégorie paiement admin | `PATCH /api/paiements/admin/payment-categories/{id}/` | Oui, admin `is_staff` |
| Suppression catégorie paiement admin | `DELETE /api/paiements/admin/payment-categories/{id}/` | Oui, admin `is_staff` |
| Dashboard IA global | `GET /api/admin/ai/dashboard/` | Oui, admin `is_staff` |
| Journal analyses IA | `GET /api/admin/ai/analyses/?pharmacy=...&user=...&date=...&status=...&category=...&error_id=...&business_code=...&min_cost=...&min_time=...&min_ocr=...&min_vision_score=...&min_medications=...&page=...&page_size=...` | Oui, admin `is_staff` |
| Détail analyse IA | `GET /api/admin/ai/analyses/{analysis_id}/` | Oui, admin `is_staff` |
| Statistiques IA | `GET /api/admin/ai/statistics/` | Oui, admin `is_staff` |
| Alertes IA | `GET /api/admin/ai/alerts/` | Oui, admin `is_staff` |
| Logs IA | `GET /api/admin/ai/logs/?search=...&level=...&date=...&error_id=...&event=...&page=...&page_size=...` | Oui, admin `is_staff` |
| Action retrait parrainage admin | `POST /api/admin/referral-withdrawals/{reference}/{action}/` | Oui, admin `is_staff` |

Le frontend utilise des clés de stockage séparées pour les tokens admin. La
protection réelle reste côté backend: chaque endpoint admin vérifie que
l'utilisateur est actif et `is_staff`.

Gestion centralisée des erreurs d'authentification admin (implémentée une seule
fois dans `fetchAdminJson`, `lib/api/admin.ts`, sans duplication par page) :
`401 Unauthorized` déclenche une tentative de rafraîchissement via
`POST /api/admin/auth/refresh/` avec le refresh token stocké. Si le refresh
réussit, la requête initiale est relancée avec le nouveau token ; sinon les
tokens admin sont supprimés et l'utilisateur est redirigé vers
`{adminLoginPath}?session_expired=1`. `403 Forbidden` signifie que l'admin
connecté n'est pas autorisé à effectuer l'action demandée : le frontend affiche
une erreur d'autorisation et ne tente pas de refresh. Les endpoints sans
authentification (ex. `POST /api/admin/auth/login/`) ne déclenchent pas cette
logique.

La page `/admin/users` consomme `GET /api/admin/users/` et affiche les
utilisateurs dans un tableau paginé à 20 lignes maximum. Les sections Swagger des
APIs admin doivent garder un préfixe `Admin-`, par exemple
`Admin-Authentication`, `Admin-Dashboard`, `Admin-User`, `Admin-Pharmacy` et
`Admin-Referral`.

La page `/admin/pharmacies` consomme `GET /api/admin/pharmacies/` et affiche les
pharmacies dans un tableau paginé à 10 lignes maximum. Les filtres frontend sont
envoyés au backend après debounce: recherche globale, devise, pays,
ville/province, quartier, archivage, présence d'email et présence de téléphone.
La réponse backend est paginée (`count`, `next`, `previous`, `results`) et chaque
pharmacie expose les champs administrateur: `id`, `reference`, `name`, `devise`,
`slug`, `email`, `phone_number`, `owner_id`, `owner_reference`, `owner_email`,
`owner_first_name`, `owner_last_name`, `invited_by_id`,
`invited_by_reference`, `invited_by_email`, `address_id`, `country`,
`country_phone_code`, `city_or_province`, `neighborhood`, `street`,
`complement_adresse`, `postal_code`, `proximite_transports`,
`formatted_address`, `latitude`, `longitude`, `members_count`,
`active_members_count`, `is_archived_at`, `created_at` et `updated_at`.

La page `/admin/subscriptions` consomme `GET /api/admin/subscriptions/` et affiche
les abonnements pharmacies dans un tableau paginé à 10 lignes maximum. Chaque
abonnement possède une référence publique auto-générée `reference` au format
`SUBXXXXXXXX`. Les filtres frontend sont envoyés au backend après debounce:
recherche globale, référence abonnement, plan, statut d'abonnement. La référence
de pharmacie n'est plus un filtre séparé car elle est déjà couverte par la
recherche globale. La réponse backend est paginée (`count`, `next`, `previous`,
`results`) et chaque abonnement expose les champs administrateur: `reference`,
`id`, `pharmacy_id`, `pharmacy_reference`, `pharmacy_name`, `pharmacy_email`,
`pharmacy_phone_number`, `owner_id`, `owner_reference`, `owner_email`,
`owner_first_name`, `owner_last_name`, `plan_code`, `plan_name`,
`plan_monthly_price`, `plan_currency`, `status`, `duration_months`,
`discount_percentage`, `total_amount`, `starts_at`, `trial_starts_at`,
`trial_ends_at`, `expires_at`, `auto_renew`, `is_trial_active`, `is_active`,
`payments_count`, `last_payment_reference`, `last_payment_status`,
`last_payment_amount`, `last_payment_currency`, `last_payment_paid_at`,
`created_at` et `updated_at`.

La page `/admin/settings/payment-categories` consomme les endpoints
`GET /api/paiements/admin/payment-categories/` (liste),
`POST /api/paiements/admin/payment-categories/` (création),
`PATCH /api/paiements/admin/payment-categories/{id}/` (mise à jour partielle) et
`DELETE /api/paiements/admin/payment-categories/{id}/` (suppression). Le frontend
n'appelle jamais les URLs en dur : il utilise les fonctions `getAdminPaymentCategories`,
`createAdminPaymentCategory`, `updateAdminPaymentCategory` et `deleteAdminPaymentCategory`
définies dans `lib/api/admin.ts`. Le tableau affiche les colonnes Nom, Code,
Description, Statut, Ordre d'affichage et Actions. La création et l'édition
s'effectuent dans une fenêtre modale avec validation frontend (nom et code
obligatoires, ordre d'affichage entier positif). La suppression n'a lieu qu'après
confirmation explicite de l'utilisateur et ne supprime que la catégorie concernée,
sans toucher aux données associées. Les retours succès/erreur sont affichés via un
 toast automatique.

La page `/admin/settings/payment-providers` consomme `GET /api/admin/payment-providers/`
(liste), `POST /api/admin/payment-providers/` (création), `PATCH /api/admin/payment-providers/{id}/`
(mise à jour partielle) et `DELETE /api/admin/payment-providers/{id}/` (suppression). Les
fonctions utilisées sont `getAdminPaymentProviders`, `createAdminPaymentProvider`,
`updateAdminPaymentProvider` et `deleteAdminPaymentProvider` dans `lib/api/admin.ts`. Le
tableau affiche les colonnes Pays, Devise, Catégorie, Nom fournisseur, Actif, Ordre et
Actions. Les listes Pays (`GET /api/pharmacies/countries/`), Devise
(`GET /api/paiements/currencies/`, public) et Catégorie (`GET /api/paiements/admin/payment-categories/`)
peuplent les menus déroulants du formulaire : aucune valeur n'est codée en dur. Le champ
Pays utilise `getAdminCountries` qui consomme `GET /api/pharmacies/countries/`
(qu'elle renvoie un tableau simple ou un objet paginé `{ count, next, previous, results }`) ;
les pages successives sont chargées en suivant le lien `next` afin d'afficher la liste
complète. Le formulaire
modal valide les champs obligatoires (pays, devise, catégorie, nom, code) et l'ordre
(entier positif). La suppression nécessite une confirmation explicite. Les retours
succès/erreur utilisent un toast automatique. Hypothèse de schéma d'écriture (backend non
présent dans le dépôt) : `country` = code ISO2, `currency` = code devise, `category` = id
de catégorie ; à confirmer contre le sérialiseur Django si le comportement diffère.

La page `/admin/settings/user-payment-accounts` consomme uniquement
`GET /api/admin/user-payment-accounts/` (liste) et la page détail
`/admin/settings/user-payment-accounts/{id}` consomme uniquement
`GET /api/admin/user-payment-accounts/{id}/`. Cette section est en **lecture seule** :
`lib/api/admin.ts` n'expose volontairement que `getAdminUserPaymentAccounts` et
`getAdminUserPaymentAccount`. Les routes d'écriture du backend
(`/api/admin/user-payment-accounts-management/`, `POST`, `PUT`, `PATCH`, `DELETE`,
`activate`, `deactivate`) ne sont pas appelées par le frontend et aucun bouton de
modification n'est affiché.

Paramètres de requête envoyés à la liste :

- `search` : recherche backend sur `account_identifier` (numéro) et `account_name`
  (titulaire), envoyée après un debounce de 450 ms ;
- `is_active` : `true` ou `false` pour le filtre Actif/Inactif, omis pour « Tous les
  comptes ».

Champs utilisés dans la réponse (sérialiseur admin) : `id`, `user` (UUID du
propriétaire), `provider` (id du fournisseur), `currency`, `currency_code`,
`currency_name`, `account_identifier`, `account_name`, `is_default`, `is_verified`,
`is_active`, `created_at` et `updated_at`. L'endpoint renvoie actuellement un tableau
simple (pas de pagination backend) ; le format `{ results: [...] }` est également
accepté par le service frontend. La pagination du tableau (10 lignes par page) est donc
réalisée côté frontend sur les résultats déjà filtrés par l'API.

Comme l'API des comptes ne renvoie que des identifiants, les libellés affichés
(utilisateur, fournisseur, pays) sont résolus à partir d'appels existants :
`GET /api/admin/users/` via `getAdminUsersDirectory` (annuaire chargé page par page en
suivant le lien `next`, 25 pages maximum), `GET /api/admin/payment-providers/` via
`getAdminPaymentProviders` et `GET /api/pharmacies/countries/` via `getAdminCountries`.
Le pays provient du fournisseur associé au compte (le sérialiseur admin renvoie l'id du
pays ; un code ISO2 est aussi accepté), et la devise provient de `currency_code`. Ces
trois appels sont isolés (`Promise.allSettled`) : leur échec n'empêche pas l'affichage du
tableau, seuls les libellés retombent sur les identifiants bruts. La page détail affiche
les informations utilisateur, les informations de paiement et un bloc « Historique »
limité à `created_at` et `updated_at`, l'API ne fournissant aucun journal d'événements
pour un compte de paiement.

La page `/admin/settings/user-payment-accounts` (tableau de gestion) consomme
`GET /api/admin/user-payment-accounts-management/` (liste), `POST /api/admin/user-payment-accounts-management/`
(création), `PUT /api/admin/user-payment-accounts-management/{id}/` (mise à jour
intégrale), `PATCH /api/admin/user-payment-accounts-management/{id}/` (mise à jour
partielle), `DELETE /api/admin/user-payment-accounts-management/{id}/` (suppression),
`POST /api/admin/user-payment-accounts-management/{id}/activate/` (activation) et
`POST /api/admin/user-payment-accounts-management/{id}/deactivate/` (désactivation). Les
fonctions utilisées sont `getAdminUserPaymentAccountsManagement`,
`createAdminUserPaymentAccount`, `updateAdminUserPaymentAccount`,
`patchAdminUserPaymentAccount`, `deleteAdminUserPaymentAccount`,
`activateAdminUserPaymentAccount` et `deactivateAdminUserPaymentAccount` dans
`lib/api/admin.ts`. Le corps d'écriture (`AdminUserPaymentAccountInput`) contient : `user`
(UUID de l'utilisateur, obligatoire), `provider` (id du fournisseur, obligatoire),
`account_identifier` (numéro, obligatoire), `account_name` (titulaire, obligatoire),
`is_active` et `is_default`. La validation frontend refuse un compte inactif défini comme
principal (`is_default=true` avec `is_active=false`), règle déjà imposée par le backend. La
liste utilisateurs (`getAdminUsersDirectory`), fournisseurs (`getAdminPaymentProviders`) et
pays (`getAdminCountries`) peuple les menus et les libellés : aucune valeur n'est codée en
dur. La création et l'édition s'effectuent dans une fenêtre modale ; l'activation/désactivation
et la suppression nécessitent une confirmation explicite (`ConfirmDialog`). Les protections
suivantes sont en place : le bouton d'envoi est désactivé et un état `saving`/`toggling`/
`deleting` empêche le double clic pendant la requête, un indicateur de chargement est affiché,
et les erreurs API (y compris le refus backend de désactiver un compte principal) sont
affichées dans un toast automatique sans jamais afficher de donnée technique brute.


La page `/admin/payments` consomme `GET /api/admin/referral-withdrawals/` pour
traiter manuellement les demandes de retrait de commission: passage en
traitement, paiement manuel avec référence, rejet ou échec. Aucune API de retrait
agrégateur n'est appelée pour le moment.

## Pharmacies

- `GET /api/pharmacies/public/`
- `GET /api/pharmacies/public/filter-options/`
- `POST /api/pharmacies/join-requests/`
- `GET /api/pharmacies/{pharmacy_pk}/join-requests/`
- `POST /api/pharmacies/{pharmacy_pk}/join-requests/{join_request_id}/accept/`
- `POST /api/pharmacies/{pharmacy_pk}/join-requests/{join_request_id}/reject/`
- `POST /api/pharmacies/{pharmacy_pk}/join-requests/{join_request_id}/archive/`
- `GET /api/pharmacies/`
- `POST /api/pharmacies/`
- `GET /api/pharmacies/{pharmacy_id}/`
- `PUT /api/pharmacies/{pharmacy_id}/`
- `GET /api/pharmacies/countries/`
- `GET /api/pharmacies/cities-or-provinces/` (paramètre `country` requis : indicatif, ISO2 ou id)
- `GET /api/pharmacies/{pharmacy_id}/permissions/`
- `GET /api/pharmacies/{pharmacy_id}/activity/`
- `GET /api/pharmacies/{pharmacy_id}/members/`
- `POST /api/pharmacies/{pharmacy_id}/members/{member_id}/`
- `DELETE /api/pharmacies/{pharmacy_id}/members/{member_id}/`
- `PUT /api/pharmacies/{pharmacy_id}/members/{member_id}/permissions/`
- `GET /api/pharmacies/{pharmacy_id}/dashboard/`
- `GET /api/pharmacies/{pharmacy_id}/stock/alerts/`
- `GET /api/pharmacies/{pharmacy_id}/invoices/pending/`

### GET /api/pharmacies/public/

- **Objectif** : afficher l'annuaire public des pharmacies non archivées.
- **Méthode HTTP** : `GET`
- **URL** : `/api/pharmacies/public/`
- **Pages frontend** : `/pharmacies`, `/pharmacies/[reference]`
- **Service frontend** : `getPublicPharmacies(filters)` dans `lib/api`
- **Authentification** : non requise.
- **Pagination** : 10 pharmacies par page avec le paramètre `page`.
- **Query params** : `search`, `reference`, `name`, `country`, `city_or_province`,
  `neighborhood`, `has_email`, `has_phone`, `ordering`, `page`.
- **Réponse attendue (200)** : objet paginé `{ count, next, previous, results }`.
  Chaque élément de `results` contient `id`, `reference`, `name`, `slug`, `email`,
  `phone_number`, `adresse` et `created_at`.
- **Usage détail public** : la page `/pharmacies/[reference]` utilise
  `getPublicPharmacyByReference(reference)` dans `lib/api`, qui interroge cet endpoint
  avec le filtre `reference` puis sélectionne la pharmacie exacte.
- **Navigation frontend** : sur `/pharmacies`, le bouton `Plus` des cartes mène vers
  `/pharmacies/{reference}`. La demande d'intégration n'est plus envoyée depuis la liste,
  mais depuis cette page détail.

#### Exemple de requête

```http
GET /api/pharmacies/public/?search=gombe&country=1&ordering=name&page=1
Accept: application/json
```

#### Exemple de requête pour la page détail publique

```http
GET /api/pharmacies/public/?reference=PH0UKUI3NQ&page=1
Accept: application/json
```

### GET /api/pharmacies/public/filter-options/

- **Objectif** : récupérer les options de filtres de l'annuaire public.
- **Méthode HTTP** : `GET`
- **URL** : `/api/pharmacies/public/filter-options/`
- **Page frontend** : `/pharmacies`
- **Service frontend** : `getPublicPharmacyFilterOptions()` dans `lib/api`
- **Authentification** : non requise.
- **Réponse attendue (200)** : `countries`, `cities_or_provinces`,
  `neighborhoods`, `orderings`.

### GET /api/pharmacies/

- **Objectif** : lister les pharmacies associées au compte connecté.
- **Méthode HTTP** : `GET`
- **URL** : `/api/pharmacies/`
- **Pages frontend** : `/app/select-pharmacy`, `/app/settings`, `/tarifs/[name]`
- **Service frontend** : `getUserPharmacies()` dans `lib/api`
- **Authentification** : requise avec `Authorization: Bearer <access_token>`.
- **Moment d'appel sur les paramètres généraux** : la page `/app/settings`
  appelle cette API pour retrouver la pharmacie active stockée côté navigateur
  et proposer un lien direct vers ses paramètres métier.
- **Moment d'appel sur la souscription** : la page `/tarifs/[name]` appelle cette
  API uniquement après avoir confirmé qu'un token d'accès est présent. Si
  l'utilisateur n'est pas connecté, les pharmacies ne sont pas chargées.
- **Pourquoi elle est utilisée** : permettre à l'utilisateur de choisir la
  pharmacie qui recevra l'abonnement du plan sélectionné.
- **Informations récupérées** : pharmacies possédées ou accessibles comme membre
  actif, avec notamment `id`, `reference`, `name`, `role`, `status`,
  `planName`, `subscriptionStatus` et `trialEndsAt`.
- **Comportement frontend** : la page de souscription filtre les pharmacies selon
  le rôle disponible côté frontend afin de ne proposer que celles qui peuvent
  gérer un abonnement, puis présélectionne la dernière pharmacie utilisée quand
  elle est encore disponible.

### POST /api/pharmacies/

- **Objectif** : créer une pharmacie et l'adhésion de son propriétaire.
- **Méthode HTTP** : `POST`
- **URL** : `/api/pharmacies/`
- **Page frontend** : `/app/pharmacies/create`
- **Service frontend** : `createPharmacy(input)` dans `lib/api`
- **Authentification** : requise avec `Authorization: Bearer <access_token>`.
- **Après succès** : la pharmacie créée devient la pharmacie active, puis le
  frontend redirige vers son tableau de bord ou vers le `return_to` de
  souscription (`/tarifs/...`) lorsqu'il est présent.

#### Payload envoyé (JSON)

| Champ          | Type   | Obligatoire | Remarque |
| -------------- | ------ | ----------- | -------- |
| `name`         | string | oui         | Nom de la pharmacie. |
| `email`        | string | non         | Omis lorsqu'il est vide. |
| `phone_number` | string | non         | Omis lorsqu'il est vide. |
| `devise`       | string | non         | Code ISO 4217 (`USD` ou `CDF`). Défaut frontend : `USD`. |
| `invited_by`   | string | non         | Code de parrainage : référence publique `USXXXXXXXX` du parrain. Omis lorsqu'il est vide. |
| `adresse`      | objet  | oui         | `country` (indicatif téléphonique), `city_or_province` (id), `street`, `neighborhood`. |

> Remarque importante : `invited_by` attend la **référence publique de
> l'utilisateur parrain** (`USXXXXXXXX`, soit `US` suivi de 8 caractères
> alphanumériques majuscules), et non un identifiant ni un UUID. Le backend
> résout lui-même ce code vers le compte correspondant. Le champ est
> `write_only` : il n'est pas renvoyé dans la réponse, qui expose
> `invited_by_reference` à la place. Il est également immuable : il ne peut plus
> être modifié après la création de la pharmacie.

#### Comportement frontend

- Le champ « Code de parrainage » est facultatif et limité à 10 caractères ; la
  saisie est automatiquement passée en majuscules.
- Le format `USXXXXXXXX` est vérifié côté client avant l'envoi afin d'éviter un
  aller-retour inutile vers le backend.
- Lorsqu'aucun code n'est saisi, la clé `invited_by` n'est pas envoyée.

#### Réponse attendue (201 Created)

Pharmacie créée, avec notamment `id`, `reference`, `name`, `slug`, `email`,
`phone_number`, `devise`, `adresse` et `created_at`.

#### Erreurs possibles

- `400 Bad Request` : données invalides, code de parrainage au mauvais format,
  code de parrainage ne correspondant à aucun utilisateur, ou propriétaire
  utilisant son propre code de parrainage.
- `401 Unauthorized` : token d'accès absent ou invalide.

#### Exemple de requête

```http
POST /api/pharmacies/
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "name": "Pharmacie Centrale",
  "email": "contact@pharmacie.cd",
  "phone_number": "+243900000000",
  "devise": "USD",
  "invited_by": "USA7K9M2Q1",
  "adresse": {
    "country": "+243",
    "city_or_province": "3",
    "street": "Avenue du Commerce 12",
    "neighborhood": "Gombe"
  }
}
```

### POST /api/pharmacies/join-requests/

- **Objectif** : créer une demande d'adhésion/d'intégration à une pharmacie.
- **Méthode HTTP** : `POST`
- **URL** : `/api/pharmacies/join-requests/`
- **Page frontend** : `/pharmacies/[reference]` (bouton `Devenir employé`)
- **Service frontend** : `createPharmacyJoinRequest(input)` dans `lib/api`
- **Authentification** : requise avec `Authorization: Bearer <access_token>`.
- **Déclenchement UI** : la page détail publique ouvre un modal de demande
  (`components/pharmacies/join-request-modal.tsx`).

#### Payload envoyé (JSON)

| Champ            | Type   | Obligatoire | Remarque |
| ---------------- | ------ | ----------- | -------- |
| `pharmacy`       | string | oui         | Identifiant interne de la pharmacie (`id` renvoyé par l'annuaire public). |
| `requested_role` | string | non         | `EMPLOYEE`, `PHARMACIST` ou `MANAGER`. Défaut frontend : `EMPLOYEE`. |
| `message`        | string | non         | Message facultatif, 1000 caractères maximum. |

> Remarque importante : pour cette API, le backend attend l'identifiant interne
> de la pharmacie dans `pharmacy`, pas la référence publique `PHXXXXXXXX`.
> C'est pourquoi `GET /api/pharmacies/public/` expose aussi `id`.

#### Réponse attendue (201 Created)

Demande créée avec les informations de suivi disponibles côté backend, notamment
`id`, `pharmacy`, `pharmacy_name`, `requested_role`, `message` et `status`.

#### Erreurs possibles

- `400 Bad Request` : données invalides, utilisateur déjà membre de la pharmacie,
  ou demande déjà en attente pour cette pharmacie.
- `401 Unauthorized` : token d'accès absent ou invalide.

#### Exemple de requête

```http
POST /api/pharmacies/join-requests/
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "pharmacy": "12",
  "requested_role": "EMPLOYEE",
  "message": "Je souhaite rejoindre cette pharmacie."
}
```

### GET /api/pharmacies/{pharmacy_pk}/join-requests/

- **Objectif** : lister les demandes d'adhésion visibles par une pharmacie.
- **Méthode HTTP** : `GET`
- **URL** : `/api/pharmacies/{pharmacy_pk}/join-requests/`
- **Page frontend** : `/app/pharmacies/[pharmacyId]/notifications`
- **Service frontend** : `getPharmacyJoinRequests(pharmacyDatabaseId)` dans `lib/api`
- **Authentification** : requise avec `Authorization: Bearer <access_token>`.
- **Permission backend** : propriétaire ou `join_request_view`.
- **Effet backend** : les demandes non vues sont marquées comme vues.
- **Réponse attendue (200)** : liste de demandes, avec notamment `id`, `pharmacy`,
  `pharmacy_name`, `user`, `user_email`, `requested_role`, `message`, `status`,
  `is_seen`, `reviewer_email`, `reviewed_at`, `created_at`.

> Remarque : ces endpoints management attendent l'identifiant interne numérique
> de la pharmacie (`pharmacy_pk`). La page frontend part de la référence publique
> `[pharmacyId]` (`PHXXXXXXXX`), puis récupère l'id interne via
> `getPublicPharmacyByReference(pharmacyId)`.

### POST /api/pharmacies/{pharmacy_pk}/join-requests/{join_request_id}/accept/

- **Objectif** : accepter une demande d'adhésion en attente.
- **Méthode HTTP** : `POST`
- **URL** : `/api/pharmacies/{pharmacy_pk}/join-requests/{join_request_id}/accept/`
- **Page frontend** : `/app/pharmacies/[pharmacyId]/notifications`
- **Service frontend** : `acceptPharmacyJoinRequest(pharmacyDatabaseId, joinRequestId)` dans `lib/api`
- **Authentification** : requise.
- **Permission backend** : propriétaire ou `join_request_accept`.
- **Payload** : aucun corps requis.
- **Réponse attendue (200)** : demande mise à jour avec `status = ACCEPTED`.
- **Erreurs possibles** : `400 Bad Request` si la demande n'est plus en attente,
  `401 Unauthorized`, `403 Forbidden`, `404 Not Found`.

### POST /api/pharmacies/{pharmacy_pk}/join-requests/{join_request_id}/reject/

- **Objectif** : refuser une demande d'adhésion en attente.
- **Méthode HTTP** : `POST`
- **URL** : `/api/pharmacies/{pharmacy_pk}/join-requests/{join_request_id}/reject/`
- **Page frontend** : `/app/pharmacies/[pharmacyId]/notifications`
- **Service frontend** : `rejectPharmacyJoinRequest(pharmacyDatabaseId, joinRequestId)` dans `lib/api`
- **Authentification** : requise.
- **Permission backend** : propriétaire ou `join_request_reject`.
- **Payload** : aucun corps requis.
- **Réponse attendue (200)** : demande mise à jour avec `status = REJECTED`.
- **Erreurs possibles** : `400 Bad Request` si la demande n'est plus en attente,
  `401 Unauthorized`, `403 Forbidden`, `404 Not Found`.

### POST /api/pharmacies/{pharmacy_pk}/join-requests/{join_request_id}/archive/

- **Objectif** : archiver une demande uniquement côté pharmacie.
- **Méthode HTTP** : `POST`
- **URL** : `/api/pharmacies/{pharmacy_pk}/join-requests/{join_request_id}/archive/`
- **Page frontend** : `/app/pharmacies/[pharmacyId]/notifications`
- **Service frontend** : `archivePharmacyJoinRequest(pharmacyDatabaseId, joinRequestId)` dans `lib/api`
- **Authentification** : requise.
- **Permission backend** : propriétaire ou `join_request_view`.
- **Payload** : aucun corps requis.
- **Réponse attendue (200)** : demande archivée côté pharmacie.
- **Comportement frontend** : la carte est retirée de la liste après succès.

### GET /api/pharmacies/{pharmacy_id}/members/

- **Objectif** : lister les membres d'une pharmacie.
- **Méthode HTTP** : `GET`
- **URL** : `/api/pharmacies/{pharmacy_id}/members/`
- **Pages frontend** : `/app/pharmacies/[pharmacyId]/settings/human-resources`,
  `/app/pharmacies/[pharmacyId]/settings/human-resources/[memberId]`
- **Service frontend** : `getPharmacyMembers(pharmacyId)` dans `lib/api`
- **Authentification** : requise avec `Authorization: Bearer <access_token>`.
- **Permission backend** : propriétaire ou `member_view`.
- **Réponse attendue (200)** : liste de membres avec `id`, `pharmacy`, `user`,
  `user_email`, `user_full_name`, `role`, `is_suspended`, `permissions`, `joined_at`.
- **Comportement frontend** : la liste RH alimente le tableau des employés. L'action
  `Voir` ouvre une page détail qui retrouve le membre dans cette réponse.

#### Exemple de requête

```http
GET /api/pharmacies/PH0UKUI3NQ/members/
Authorization: Bearer <access_token>
Accept: application/json
```

### POST /api/pharmacies/{pharmacy_id}/members/{member_id}/

- **Objectif** : modifier le rôle **et/ou** le statut de suspension d'un membre en une
  seule requête. Cette route remplace l'ancien `PATCH` sur le même endpoint ainsi que
  l'ancienne route `/suspend/` (supprimée).
- **Méthode HTTP** : `POST`
- **URL** : `/api/pharmacies/{pharmacy_id}/members/{member_id}/`
- **Page frontend** : `/app/pharmacies/[pharmacyId]/settings/human-resources`
- **Service frontend** : `updatePharmacyMember(pharmacyId, memberId, input)` (changement de
  rôle) et `suspendPharmacyMember(pharmacyId, memberId)` (suspension) dans `lib/api`
- **Authentification** : requise.
- **Permission backend** : `member_update` (si le rôle change) et/ou `member_suspend`
  (si le statut de suspension change). Le propriétaire passe toujours.
- **Payload envoyé (JSON)** : `role` et/ou `is_suspended`.
- **Réponse attendue (200)** : membre mis à jour (`PharmacyMemberDetailSerializer`).
- **Erreurs possibles** : `400 Bad Request`, `401 Unauthorized`, `403 Forbidden`, `404 Not Found`.

#### Exemple de requête (changement de rôle)

```http
POST /api/pharmacies/PH0UKUI3NQ/members/12/
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "role": "MANAGER"
}
```

#### Exemple de requête (suspension)

```http
POST /api/pharmacies/PH0UKUI3NQ/members/12/
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "is_suspended": true
}
```

### DELETE /api/pharmacies/{pharmacy_id}/members/{member_id}/

- **Objectif** : supprimer un membre de la pharmacie.
- **Méthode HTTP** : `DELETE`
- **URL** : `/api/pharmacies/{pharmacy_id}/members/{member_id}/`
- **Page frontend** : `/app/pharmacies/[pharmacyId]/settings/human-resources`
- **Service frontend** : `deletePharmacyMember(pharmacyId, memberId)` dans `lib/api`
- **Authentification** : requise.
- **Permission backend** : propriétaire ou `member_delete`.
- **Réponse attendue** : `204 No Content`.
- **Erreurs possibles** : `401 Unauthorized`, `403 Forbidden`, `404 Not Found`.

### PUT /api/pharmacies/{pharmacy_id}/members/{member_id}/permissions/

- **Objectif** : remplacer les permissions d'un membre.
- **Méthode HTTP** : `PUT`
- **URL** : `/api/pharmacies/{pharmacy_id}/members/{member_id}/permissions/`
- **Page frontend** : `/app/pharmacies/[pharmacyId]/settings/human-resources`
- **Vue backend** : `PharmacyMemberPermissionAssignView`
- **Service frontend** : `assignPharmacyMemberPermissions(pharmacyId, memberId, permissions)` dans `lib/api`
- **Authentification** : requise.
- **Permission backend** : propriétaire ou `member_manage_permissions`.
- **Payload envoyé (JSON)** : objet de permissions booléennes (`product_view`,
  `sale_create`, `member_update`, etc.).
- **Réponse attendue (200)** : membre mis à jour avec ses permissions recalculées.
- **Règle backend** : un membre ne peut attribuer que les permissions qu'il possède.
- **Erreurs backend** : la vue renvoie `detail` pour expliquer pourquoi l'affectation
  est refusée, par exemple si l'utilisateur tente d'accorder une permission qu'il
  ne possède pas.
- **Comportement frontend** : les permissions ne sont plus affichées dans la page
  principale RH. Elles sont consultées et modifiées dans le modal ouvert via
  `Actions` > `Permissions`. L'option est visible mais non cliquable sans
  `member_manage_permissions` ou pour un propriétaire.

#### Exemple de requête

```http
PUT /api/pharmacies/PH0UKUI3NQ/members/12/permissions/
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "product_view": true,
  "product_create": true,
  "sale_view": true
}
```

## Pharmacie (détail)

### GET /api/pharmacies/{pharmacy_id}/

- **Objectif** : consulter le détail complet d'une pharmacie (page « Détails pharmacie »).
- **Méthode HTTP** : `GET`
- **URL** : `/api/pharmacies/{pharmacy_id}/`
- **Pages frontend** : `/app/pharmacies/[pharmacyId]/settings/details`,
  `/app/pharmacies/[pharmacyId]/invoices`
- **Service frontend** : `getPharmacyDetail(pharmacyId)` dans `lib/api`
- **Authentification** : requise avec `Authorization: Bearer <access_token>`.
- **Identifiant** : `{pharmacy_id}` accepte la **référence** publique (`PHXXXXXXXX`) ou
  l'identifiant interne. La route a été harmonisée avec les autres sous-ressources pour
  accepter la référence.
- **Permission backend** : `pharmacy_view` (le propriétaire passe toujours). En cas de
  refus, l'API renvoie un message explicite dans `detail` (ex. « Vous n'avez pas la
  permission de consulter cette pharmacie. ») que le frontend affiche tel quel.
- **Réponse attendue (200)** : `PharmacyDetailSerializer` avec `reference`, `owner_reference`,
  `owner_full_name` (nom complet du propriétaire), `invited_by_reference`, `name`, `slug`,
  `email`, `phone_number`, `devise`, `adresse` (pays, ville/province, quartier, rue, etc.),
  `subscription`, `is_archived_at`, `created_at`, `updated_at`.
- **Format des dates** : `YYYY-MM-DD HH:MM:SS` (ex. `2026-08-02 14:11:02`), sans fuseau
  ni microsecondes.
- **Objet `subscription`** : `plan_code`, `plan_name`, `duration_months`, `status`,
  `trial_starts_at`, `trial_ends_at`, `starts_at`, `expires_at`, `auto_renew`,
  `total_amount`, `discount_percentage`, `is_trial_active`, `is_active`, et
  **`features`** (dictionnaire des fonctionnalités du plan, ex. `{"Produits": true,
  "Stock": true, "Ventes": true, "IA": true, "reports": true}`). Le frontend utilise
  `subscription.features.reports` comme feature unique pour tout l'espace « Rapports ».
- **Erreurs possibles** : `401 Unauthorized`, `403 Forbidden`, `404 Not Found`.

> Note : cette même route est aussi celle utilisée par l'édition (voir `PUT` ci-dessous).

#### Exemple de requête

```http
GET /api/pharmacies/PH0UKUI3NQ/
Authorization: Bearer <access_token>
Accept: application/json
```

### PUT /api/pharmacies/{pharmacy_id}/

- **Objectif** : modifier les coordonnées et/ou l'adresse d'une pharmacie.
- **Méthode HTTP** : `PUT`
- **URL** : `/api/pharmacies/{pharmacy_id}/`
- **Page frontend** : `/app/pharmacies/[pharmacyId]/settings/details`
- **Service frontend** : `updatePharmacy(pharmacyId, input)` dans `lib/api`
- **Authentification** : requise.
- **Permission backend** : propriétaire ou `pharmacy_update`.
- **Champs immuables** : côté backend, le modèle `Pharmacy` interdit la modification de
  `owner`, `reference`, `invited_by`, `devise` et `created_at`. Le serializer retire ces
  champs de la validation, donc le frontend n'envoie **pas** `devise`. La `devise` est
  affichée en lecture seule dans le formulaire.
- **Payload envoyé (JSON)** :
  - Champs simples : `name`, `email`, `phone_number`.
  - Adresse imbriquée `adresse` (optionnelle) : `country` (indicatif téléphonique, ex.
    `+243`), `city_or_province` (id), `neighborhood`, `street`, `complement_adresse`,
    `postal_code`, `proximite_transports`, `formatted_address`. Le frontend renvoie le
    pays et la ville existants (non modifiables ici) avec les champs d'adresse édités.
- **Réponse attendue (200)** : pharmacie mise à jour (`PharmacyDetailSerializer`).
- **Erreurs possibles** : `400 Bad Request`, `401 Unauthorized`, `403 Forbidden`, `404 Not Found`.

#### Exemple de requête (coordonnées)

```http
PUT /api/pharmacies/PH0UKUI3NQ/
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "name": "Pharmacie de Gombe",
  "email": "contact@pharmacie-gombe.cd",
  "phone_number": "+243812345678"
}
```

#### Exemple de requête (adresse)

```http
PUT /api/pharmacies/PH0UKUI3NQ/
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "adresse": {
    "country": "+243",
    "city_or_province": 5,
    "neighborhood": "Gombe",
    "street": "Avenue des Trois Z",
    "complement_adresse": "Immeuble B",
    "postal_code": "00242",
    "proximite_transports": "Arrêt Gare centrale",
    "formatted_address": "Avenue des Trois Z, Gombe, Kinshasa"
  }
}
```

## Produits

- `GET /api/products/?pharmacy_reference={pharmacy_id}`
- `GET /api/products/filter-options/?pharmacy_reference={pharmacy_id}`
- `GET /api/products/{reference}/?pharmacy_reference={pharmacy_id}`
- `POST /api/products/`
- `PATCH /api/products/{reference}/?pharmacy_reference={pharmacy_id}`
- `DELETE /api/products/{reference}/?pharmacy_reference={pharmacy_id}`
- `GET /api/products/export/pdf/?pharmacy_reference={pharmacy_id}`
- `GET /api/products/export/excel/?pharmacy_reference={pharmacy_id}`

### POST /api/products/

- **Objectif** : créer un produit appartenant à une pharmacie.
- **Méthode HTTP** : `POST`
- **URL** : `/api/products/`
- **Page frontend** : `/app/pharmacies/[pharmacyId]/products/create`
- **Service frontend** : `createProduct(pharmacyId, values)` dans `lib/api/products.ts`

#### Payload envoyé (JSON)

| Champ              | Type    | Obligatoire | Remarque                                                        |
| ------------------ | ------- | ----------- | --------------------------------------------------------------- |
| `pharmacy_reference` | string  | oui         | Référence publique PHXXXXXXXX de la pharmacie (clé `pharmacyId`). |
| `name`             | string  | oui         | Nom du produit.                                                 |
| `sale_price`       | number  | oui         | Prix de vente, >= 0.                                            |
| `description`      | string  | non         | Description du produit.                                         |
| `form`             | string  | non         | Forme (`TABLET`, `CAPSULE`, `SYRUP`, ...). Défaut : `TABLET`.   |
| `target_gender`    | string  | non         | Public visé (`MALE`, `FEMALE`, `MIXED`, `UNDEFINED`). Défaut : `UNDEFINED`. |
| `target_age_group` | string  | non         | Tranche d'âge (`NEWBORN`, `CHILD`, ..., `ALL`). Défaut : `ALL`. |
| `therapeutic_category` | string | non      | Catégorie (`ANALGESIC`, `ANTIBIOTIC`, ..., `OTHER`). Défaut : `OTHER`. |
| `strength`         | string  | non         | Dosage ou concentration, max 50 caractères. Envoyé seulement si renseigné. |
| `package`          | string  | non         | Conditionnement commercial, max 50 caractères. Envoyé seulement si renseigné. |
| `purchase_price`   | number  | non         | Prix d'achat, >= 0. Envoyé seulement si renseigné.              |
| `current_stock`    | integer | non         | Stock initial, >= 0. Défaut : 0. Envoyé seulement si renseigné. |
| `created_date`     | string  | non         | Date de création (AAAA-MM-JJ). Envoyée seulement si renseignée. |
| `expiration_date`  | string  | non         | Date de péremption (AAAA-MM-JJ). Envoyée seulement si renseignée. |

> Remarque pharmacie : le backend relie le produit à la pharmacie via le champ
> `pharmacy_reference` (pas `pharmacy`, `pharmacy_id`, ni l'entier PK). Le champ
> `reference` du produit est généré automatiquement par le backend.

#### Réponse attendue (201 Created)

Le backend renvoie le produit créé (serializer de lecture), incluant notamment
`reference`, `pharmacy_reference`, `name`, `sale_price`, `current_stock`, etc.

#### Erreurs possibles

- `400 Bad Request` : données invalides (ex. `name` ou `sale_price` manquant,
  `pharmacy_reference` invalide ou introuvable, prix négatif, stock non entier).
  Le message liste les erreurs par champ.
- `401 Unauthorized` : token d'accès absent ou invalide.
- `403 Forbidden` : l'abonnement de la pharmacie n'est pas actif, ou la limite de
  produits du plan est atteinte.

#### Exemple de requête

```http
POST /api/products/
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "pharmacy_reference": "PH0UKUI3NQ",
  "name": "Paracétamol 500mg",
  "description": "Antalgique",
  "form": "TABLET",
  "target_gender": "UNDEFINED",
  "target_age_group": "ALL",
  "therapeutic_category": "ANALGESIC",
  "strength": "500 mg",
  "package": "Boîte de 10 comprimés",
  "sale_price": 1.5,
  "purchase_price": 0.9,
  "current_stock": 100
}
```

> Note : `pharmacy_reference` ci-dessus (`PH0UKUI3NQ`) est un exemple ; le frontend
> utilise dynamiquement le `pharmacyId` de l'URL, jamais une valeur en dur.

#### Exemple de réponse

```json
{
  "reference": "PR00000012",
  "pharmacy_reference": "PH0UKUI3NQ",
  "name": "Paracétamol 500mg",
  "description": "Antalgique",
  "form": "TABLET",
  "target_gender": "UNDEFINED",
  "target_age_group": "ALL",
  "therapeutic_category": "ANALGESIC",
  "strength": "500 mg",
  "package": "Boîte de 10 comprimés",
   "sale_price": "1.50",
   "purchase_price": "0.90",
   "current_stock": 100,
   "created_date": "2026-07-08",
   "expiration_date": "2027-07-08",
   "is_deleted": false,
   "deleted_at": null,
   "created_at": "2026-07-08T12:00:00Z",
   "updated_at": "2026-07-08T12:00:00Z"
}
```

### GET /api/products/

- **Objectif** : lister les produits d'une pharmacie (avec pagination et filtres).
- **Méthode HTTP** : `GET`
- **URL** : `/api/products/?pharmacy_reference={pharmacy_id}`
- **Pages frontend** : `/app/pharmacies/[pharmacyId]/products`,
  `/app/pharmacies/[pharmacyId]/sales/create` (recherche manuelle de produits),
  `/app/pharmacies/[pharmacyId]/stock` (champ de recherche du produit du mouvement)
- **Service frontend** : `getPharmacyProducts(pharmacyId, filters)` dans `lib/api`
- **Paramètre query obligatoire** : `pharmacy_reference` (référence PHXXXXXXXX de la pharmacie).
- **Autres query params** : `search`, `reference`, `name`, `form`, `target_gender`,
  `target_age_group`, `therapeutic_category`, `strength`, `package`, `stock_status`,
  `min_stock`, `max_stock`, `min_sale_price`, `max_sale_price`, `min_purchase_price`,
  `max_purchase_price`, `created_from`, `created_to`, `updated_from`, `updated_to`,
  `ordering`, `page`.
- **Recherche** : `search` couvre notamment le nom, la référence, la description,
  la catégorie, le dosage (`strength`) et le conditionnement (`package`).
- **Réponse attendue (200)** : objet paginé `{ count, next, previous, results }` où
  chaque `result` est un produit (serializer de lecture). Chaque produit inclut
  désormais `created_date` et `expiration_date` (dates `AAAA-MM-JJ`, éventuellement
  `null`) utilisées par les colonnes « Création » et « Expiration » de la liste.
- **Erreurs possibles** : `401 Unauthorized`, `403 Forbidden`.
- **Endpoint compagnon** : `GET /api/products/filter-options/?pharmacy_reference={pharmacy_id}`
  (`getProductFilterOptions`) renvoie les options des filtres (formes, catégories, etc.),
  dont les tris `strength`, `-strength`, `package` et `-package`.

### GET /api/products/export/pdf/

- **Objectif** : télécharger la liste des produits au format PDF.
- **Méthode HTTP** : `GET`
- **URL** : `/api/products/export/pdf/?pharmacy_reference={pharmacy_id}`
- **Page frontend** : `/app/pharmacies/[pharmacyId]/products`
- **Service frontend** : `downloadProductExport(pharmacyId, "pdf", filters)` dans `lib/api/products.ts`
- **Permission requise** : `product_export_pdf`.
- **Paramètres** : `pharmacy_reference` obligatoire, mêmes filtres que la liste produits. `page` n'est pas transmis par le frontend pour exporter tous les résultats filtrés.
- **Réponse attendue (200)** : fichier `application/pdf` avec `Content-Disposition: attachment`.
- **Erreurs possibles** : `401 Unauthorized`, `403 Forbidden` avec le message métier du backend.

### GET /api/products/export/excel/

- **Objectif** : télécharger la liste des produits au format Excel.
- **Méthode HTTP** : `GET`
- **URL** : `/api/products/export/excel/?pharmacy_reference={pharmacy_id}`
- **Page frontend** : `/app/pharmacies/[pharmacyId]/products`
- **Service frontend** : `downloadProductExport(pharmacyId, "excel", filters)` dans `lib/api/products.ts`
- **Permission requise** : `product_export_excel`.
- **Paramètres** : `pharmacy_reference` obligatoire, mêmes filtres que la liste produits. `page` n'est pas transmis par le frontend pour exporter tous les résultats filtrés.
- **Réponse attendue (200)** : fichier `.xlsx` avec `Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet` et `Content-Disposition: attachment`.
- **Erreurs possibles** : `401 Unauthorized`, `403 Forbidden` avec le message métier du backend.

## Stock (mouvements)

- `GET /api/stock-movements/`
- `POST /api/stock-movements/`
- `GET /api/stock-movements/{id}/`

### GET /api/stock-movements/

- **Objectif** : lister les mouvements de stock (entrées, sorties, ajustements) d'une pharmacie.
- **Méthode HTTP** : `GET`
- **URL** : `/api/stock-movements/?pharmacy_reference={pharmacy_id}`
- **Page frontend** : `/app/pharmacies/[pharmacyId]/stock`
- **Service frontend** : `getStockMovements(filters)` dans `lib/api/stock-movements.ts`
- **Paramètre query obligatoire** : `pharmacy_reference` (référence PHXXXXXXXX de la pharmacie).
- **Autres query params** : `product_reference`, `movement_type`, `ordering`, `page`.
- **Permission requise** : `stock_view` dans la pharmacie.
- **Réponse attendue (200)** : objet paginé `{ count, next, previous, results }`.

### POST /api/stock-movements/

- **Objectif** : créer un mouvement de stock manuel (entrée, sortie ou ajustement).
- **Méthode HTTP** : `POST`
- **URL** : `/api/stock-movements/`
- **Page frontend** : `/app/pharmacies/[pharmacyId]/stock` (bloc « Créer un mouvement manuel »)
- **Service frontend** : `createStockMovement(input)` dans `lib/api/stock-movements.ts`
- **Permission requise** : `stock_adjust` dans la pharmacie.
- **Payload envoyé (JSON)** :

  | Champ              | Type    | Obligatoire | Description                                           |
  |-------------------|---------|-------------|-------------------------------------------------------|
  | `pharmacy_reference` | string | oui         | Référence PHXXXXXXXX de la pharmacie.              |
  | `product`          | string  | oui         | Référence du produit concerné par le mouvement. |
  | `movement_type`   | string  | oui         | `IN`, `OUT` ou `ADJUSTMENT`.                    |
  | `quantity`        | integer | conditionnel| Quantité strictement positive. Obligatoire pour `IN` et `OUT` ; ignoré pour `ADJUSTMENT`. |
  | `new_stock`       | integer | conditionnel| Stock final (>= 0). Obligatoire pour `ADJUSTMENT` ; ignoré pour `IN`/`OUT`. |
  | `reason`          | string  | non         | Motif du mouvement (envoyé si renseigné).       |

- **Note de champ `product`** : contrairement à la lecture (qui renvoie
  `product_reference`), la création attend la clé `product` contenant
  directement la référence du produit (même convention que la création
  de vente dans `lib/api/sales.ts`). Envoyer `product_reference` est
  ignoré et provoque l'erreur `product : La référence du produit est obligatoire.`
- **Note de champ `new_stock`** : pour un ajustement (`ADJUSTMENT`),
  le backend attend la **valeur finale du stock** (`new_stock`), et non une
  quantité. Sinon il renvoie `Le stock final est obligatoire pour un ajustement.`
  Pour `IN`/`OUT`, c'est `quantity` qui est requis.
- **Réponse attendue (201)** : mouvement créé (serializer de lecture avec
  `product_reference`, `product_name`, `previous_stock`, `new_stock`, etc.).

### GET /api/stock-movements/{reference}/

- **Objectif** : consulter un mouvement de stock précis.
- **Méthode HTTP** : `GET`
- **URL** : `/api/stock-movements/{reference}/`
- **Page frontend** : `/app/pharmacies/[pharmacyId]/stock` (bouton « Consulter » d'un mouvement)
- **Service frontend** : `getStockMovementDetail(reference)` dans `lib/api/stock-movements.ts`
- **Identifiant** : la route utilise la **référence alphanumérique du mouvement**
  (`MVXXXXXXXX`, champ `reference` du modèle `StockMovement`), et **non** son `id`
  interne. Cela aligne le endpoint avec les autres ressources
  (produit `PR...`, pharmacie `PH...`, vente `SEL...`).
- **Permission requise** : `stock_view` dans la pharmacie du mouvement.
- **Réponse attendue (200)** : détail du mouvement (mêmes champs que la liste,
  `reference` inclus).
- **Erreurs possibles** : `401 Unauthorized`, `403 Forbidden`, `404 Not Found`
  si la référence n'appartient pas à la pharmacie.

## Ventes

- `POST /api/sales/`
- `GET /api/sales/?pharmacy_reference={pharmacy_id}`
- `POST /api/sales/vision/` (analyse d'ordonnance, multipart `pharmacy_reference` + `image`)
- `POST /api/sales/prescription-captures/` (sauvegarde de l'image d'ordonnance capturée, multipart `pharmacy` (optionnel) + `image`)

### Page `/app/pharmacies/{pharmacy_id}/sales/create`

- **Objectif frontend** : préparer une nouvelle vente de pharmacie avant validation.
- **Route frontend** : `/app/pharmacies/{pharmacy_id}/sales/create`
- **Service frontend** : types et helpers dans `lib/api/sales.ts`
- **Recherche produits utilisée** : `GET /api/products/?pharmacy_reference={pharmacy_id}&search={query}&ordering=name&page=1`
  via `searchSaleProducts(pharmacyId, query)`.
- **Comportement de recherche** : la saisie manuelle déclenche cette recherche en
  temps réel avec un debounce de 400 ms. Le frontend n'appelle pas l'API pour une
  recherche vide ou inférieure à 2 caractères, et ignore les réponses obsolètes si
  l'utilisateur a déjà saisi une nouvelle valeur.
- **Contexte pharmacie utilisé** : `GET /api/pharmacies/{pharmacy_id}/dashboard/`
  via `getPharmacyDashboard(pharmacyId)` pour afficher le nom de la pharmacie et
  utiliser sa devise (`pharmacy.devise`) dans les montants de la vente.
- **Contexte caissier utilisé** : `GET /api/accounts/me/`
  via `getCurrentCashierName()` pour afficher le nom ou l'email du caissier.
- **Validation vente** : aucun endpoint backend réel n'est encore consommé. Le helper
  `createSale(payload)` existe côté frontend, mais il renvoie le message :
  `La validation backend de la vente sera ajoutée ultérieurement.`
- **Brouillon temporaire** : dès qu'au moins un produit est présent dans le
  brouillon, les produits, les informations client et la réduction sont sauvegardés
  automatiquement dans `localStorage`, avec une clé par pharmacie. Le brouillon est
  restauré après actualisation de la page et supprimé lorsqu'il ne contient plus de
  produit ou lorsque l'utilisateur confirme l'action `Annuler`.
- **Scanner IA** : analyse réelle d'une ordonnance via la caméra ou un fichier
  importé depuis le stockage local. Le flux est géré par le composant
  `AiScannerModal` (ouvert depuis la carte « Scanner avec l'IA ») :
  1. ouverture de la caméra (`getUserMedia`) avec un bouton en bas à gauche pour
     importer une image depuis le stockage local ;
  2. capture ou import de la photo, affichée avec le rappel
     « Les résultats proposés par l'IA doivent être vérifiés avant validation. » ;
  3. appel `POST /api/sales/vision/` (multipart : `pharmacy_reference` + `image`)
     via `analyzePrescription(pharmacyId, file)` pendant l'affichage d'un spinner et
     d'un compteur de secondes ;
  4. pour chaque médicament détecté (`medications[].raw_name`), le frontend recherche
     le produit correspondant via `searchSaleProducts` et l'ajoute au brouillon
     (`addProduct`). Les médicaments sans correspondance dans le stock sont signalés.
- **Crédits IA** : la carte « Scanner avec l'IA » appelle
   `GET /api/paiements/pharmacies/{pharmacy_id}/users/{user_reference}/ai-credits/`
   (voir section « Crédits IA ») pour afficher `(X crédits IA restants)`. La même
   requête est consommée par la page `settings/me` (« Mon espace dans cette pharmacie »)
   pour afficher le compteur personnel de crédits IA restants, la période en cours et
   le taux d'utilisation. Après une analyse réussie, le scanner diffuse l'événement
   global `kisinet:ai-credits-updated` (via `notifyAiCreditsUpdated`) ; la page
   `settings/me` l'écoute et recharge automatiquement le compteur de crédits IA
   (rafraîchissement inter-pages, utile si les deux pages sont ouvertes dans des
   onglets distincts).
- **Données temporaires** : aucune donnée produit temporaire n'est utilisée pour la
  recherche manuelle ; les produits viennent de l'API existante. Le champ affiché
  `dosage` est alimenté par `strength`. Les champs non exposés par l'API actuelle
  (`barcode`, `expirationDate`) restent affichés en repli `Non renseigné`.
- **Endpoints backend manquants à créer plus tard** :
  - `POST /api/sales/drafts/` ou équivalent si les brouillons doivent être persistés côté serveur.
  - Endpoint d'annulation de facture si l'action `Annuler` doit être activée.
  - Endpoint de facture/reçu si `Imprimer le reçu` doit être activé.

### GET /api/sales/

- **Objectif** : lister les ventes/factures d'une pharmacie pour la page `Factures`.
- **Méthode HTTP** : `GET`
- **URL** : `/api/sales/?pharmacy_reference={pharmacy_id}`
- **Page frontend** : `/app/pharmacies/[pharmacyId]/invoices`
- **Service frontend** : `getPharmacyInvoices(pharmacyId, filters)` dans `lib/api/invoices.ts`
- **Authentification** : requise avec `Authorization: Bearer <access_token>`.
- **Permission frontend** : la page est visible avec `sale_view`. L'action liée à
  la caisse dépend de `sale_payment_create`. Le backend reste responsable de
  l'autorisation réelle.
- **Paramètres envoyés par le frontend** :
  - `pharmacy_reference` : référence de la pharmacie active, obligatoire.
  - `search` : recherche par référence, client ou téléphone.
  - `payment_status` : `UNPAID`, `PARTIALLY_PAID`, `PAID` ou `OVERPAID`.
  - `status` : `DRAFT`, `CONFIRMED` ou `CANCELED`.
  - `date_from` : date de début au format `YYYY-MM-DD`.
  - `date_to` : date de fin au format `YYYY-MM-DD`.
  - `page` : page demandée pour la pagination.
- **Réponse attendue (200)** : réponse paginée
  `{ count, next, previous, summary, results }`.
  Chaque élément de `results` contient les champs utilisés par la page :
  `reference`, `pharmacy`, `customer_name`, `customer_phone`, `subtotal_amount`,
  `discount_amount`, `total_amount`, `paid_amount`, `remaining_amount`,
  `change_amount`, `items_count`, `total_product_quantity`, `status`,
  `payment_status`, `created_by`, `created_at` et `detail_url`.
- **Résumé global** : `summary` est calculé par le backend sur toutes les factures
  correspondant aux filtres actifs, avant pagination. Le frontend utilise
  `total_invoices`, `unpaid_invoices`, `partially_paid_invoices`, `paid_invoices`
  et `remaining_amount` pour les cartes.
- **Pagination** : le frontend utilise `count`, `next` et `previous`, et conserve
  les filtres/recherche actifs lors des changements de page.
- **Fonctionnalités non connectées faute d'endpoint dédié** : annulation de facture
  et impression/téléchargement de reçu.
- **Erreurs possibles** : `401 Unauthorized`, `403 Forbidden`, `404 Not Found`,
  `500 Internal Server Error` côté API. Le frontend affiche un message convivial
  sans exposer la réponse technique brute.

### POST /api/sale-payments/

- **Objectif** : enregistrer un paiement sur une facture depuis la page
  `Factures`, sans intégrer un formulaire complet de caisse.
- **Méthode HTTP** : `POST`
- **URL** : `/api/sale-payments/`
- **Page frontend** : `/app/pharmacies/[pharmacyId]/invoices`
- **Service frontend** : `createInvoicePayment(payload)` dans
  `lib/api/invoices.ts`
- **Authentification** : requise avec `Authorization: Bearer <access_token>`.
- **Permission frontend** : le bouton `Encaisser` est affiché seulement avec
  `sale_payment_create`. Le backend applique aussi cette permission.
- **Corps JSON envoyé** :
  - `pharmacy` : référence de la pharmacie active.
  - `sale` : référence de la facture à encaisser.
  - `amount` : montant affecté à la facture. Le modal envoie le reste à payer si
    `amount_received` couvre la facture ; sinon il envoie `amount_received` pour
    enregistrer un paiement partiel.
  - `amount_received` : montant réellement reçu, au format décimal.
  - `payment_method` : mode de paiement, par exemple `CASH`.
  - `transaction_reference` : référence externe optionnelle.
- **Réponse attendue** : `201 Created` avec le paiement créé. Le frontend conserve
  le code HTTP retourné (`statusCode`) et recharge la liste des factures après un
  encaissement réussi.
- **Erreurs possibles** : `400 Bad Request`, `401 Unauthorized`, `403 Forbidden`.
  Le frontend affiche un message lisible sans exposer une stack trace ou une
  réponse technique brute.

### GET /api/sales/metadata/

- **Objectif** : récupérer les métadonnées de filtres de la page `Factures`.
- **Méthode HTTP** : `GET`
- **URL** : `/api/sales/metadata/?pharmacy_reference={pharmacy_id}`
- **Page frontend** : `/app/pharmacies/[pharmacyId]/invoices`
- **Service frontend** : `getInvoiceMetadata(pharmacyId)` dans `lib/api/invoices.ts`
- **Authentification** : requise avec `Authorization: Bearer <access_token>`.
- **Permission frontend/backend** : `sale_view`.
- **Paramètre query obligatoire** : `pharmacy_reference`.
- **Réponse attendue (200)** :
  `{ statuses, payment_statuses, orderings }`, chaque liste contenant des objets
  `{ value, label }`.
- **Utilisation** : le frontend construit le filtre de statut avec
  `payment_statuses` puis `statuses`. Si cet endpoint échoue en développement, la
  page conserve ses options locales de secours.
- **Erreurs possibles** : `400 Bad Request`, `401 Unauthorized`, `403 Forbidden`.

### GET /api/sales/payment-methods/

- **Objectif** : récupérer les modes de paiement globaux utilisés par le domaine
  ventes.
- **Méthode HTTP** : `GET`
- **URL** : `/api/sales/payment-methods/`
- **Service frontend** : `refreshSalesChoices()` dans `lib/api/sales-choices.ts`
- **Chargement frontend** : `SalesChoicesBootstrap` est monté dans `app/layout.tsx`
  et rafraîchit `localStorage` à chaque ouverture de l'application.
- **Authentification** : aucune.
- **Permission** : aucune.
- **Réponse attendue (200)** : liste d'objets `{ value, label }`.
- **Stockage frontend** : la réponse est regroupée avec les autres choix dans
  `localStorage`, clé `kisinet_sales_choices`.
- **Erreurs possibles** : le frontend ignore l'erreur pour ne pas bloquer
  l'application.

### GET /api/sales/payment-statuses/

- **Objectif** : récupérer les statuts possibles d'un paiement de facture.
- **Méthode HTTP** : `GET`
- **URL** : `/api/sales/payment-statuses/`
- **Service frontend** : `refreshSalesChoices()` dans `lib/api/sales-choices.ts`
- **Chargement frontend** : à chaque ouverture de l'application via
  `SalesChoicesBootstrap`.
- **Authentification** : aucune.
- **Permission** : aucune.
- **Réponse attendue (200)** : liste d'objets `{ value, label }`.
- **Stockage frontend** : `localStorage`, clé `kisinet_sales_choices`.

### GET /api/sales/statuses/

- **Objectif** : récupérer les statuts possibles d'une facture.
- **Méthode HTTP** : `GET`
- **URL** : `/api/sales/statuses/`
- **Service frontend** : `refreshSalesChoices()` dans `lib/api/sales-choices.ts`
- **Chargement frontend** : à chaque ouverture de l'application via
  `SalesChoicesBootstrap`.
- **Authentification** : aucune.
- **Permission** : aucune.
- **Réponse attendue (200)** : liste d'objets `{ value, label }`.
- **Stockage frontend** : `localStorage`, clé `kisinet_sales_choices`.

### GET /api/products/{reference}/

- **Objectif** : consulter le détail complet d'un produit.
- **Méthode HTTP** : `GET`
- **URL** : `/api/products/{reference}/?pharmacy_reference={pharmacy_id}`
- **Page frontend** : `/app/pharmacies/[pharmacyId]/products/[reference]`
- **Service frontend** : `getProductDetail(pharmacyId, reference)` dans `lib/api/products.ts`
- **Paramètre query obligatoire** : `pharmacy_reference`.
- **Réponse attendue (200)** : produit complet (serializer de lecture), incluant
  `reference`, `pharmacy_reference`, `name`, `description`, `form`, `target_gender`,
  `target_age_group`, `therapeutic_category`, `strength`, `package`, `sale_price`,
  `purchase_price`, `current_stock`, `is_deleted`, `deleted_at`, `created_at`,
  `updated_at`.
- **Erreurs possibles** : `401 Unauthorized`, `403 Forbidden`, `404 Not Found`.

### DELETE /api/products/{reference}/

- **Objectif** : suppression logique d'un produit (le produit passe `is_deleted=true`).
- **Méthode HTTP** : `DELETE`
- **URL** : `/api/products/{reference}/?pharmacy_reference={pharmacy_id}`
- **Page frontend** : `/app/pharmacies/[pharmacyId]/products` (bouton « Supprimer » du menu Actions)
- **Service frontend** : `deleteProduct(pharmacyId, reference)` dans `lib/api/products.ts`
- **Paramètre query obligatoire** : `pharmacy_reference`.
- **Réponse attendue** : `204 No Content` (aucun corps).
- **Erreurs possibles** : `400 Bad Request` (paramètre manquant), `401 Unauthorized`,
  `403 Forbidden`, `404 Not Found`.

### PATCH /api/products/{reference}/

- **Objectif** : modification partielle d'un produit (mise à jour des dates, prix, stock, etc.).
- **Méthode HTTP** : `PATCH`
- **URL** : `/api/products/{reference}/?pharmacy_reference={pharmacy_id}`
- **Page frontend** : `/app/pharmacies/[pharmacyId]/products/[reference]/edit`
- **Service frontend** : `updateProduct(pharmacyId, reference, values)` dans `lib/api/products.ts`
- **Paramètre query obligatoire** : `pharmacy_reference`.
- **Champs envoyés (JSON)** : identiques au payload `POST`, mais tous optionnels.
  `created_date` et `expiration_date` sont des dates `AAAA-MM-JJ` ; envoyer `null`
  (ou une chaîne vide côté formulaire) pour effacer la valeur.
- **Validation métier** : si `created_date` et `expiration_date` sont tous deux fournis,
  le backend renvoie `400` avec le message `La date d'expiration ne peut pas être
  antérieure à la date de création.` (sur le champ `expiration_date`).
- **Réponse attendue (200)** : le produit mis à jour (serializer de lecture), incluant
  `created_date` et `expiration_date`.
- **Erreurs possibles** : `400 Bad Request`, `401 Unauthorized`, `403 Forbidden`,
  `404 Not Found`.

## Permissions et dashboard

### GET /api/pharmacies/{pharmacy_id}/permissions/

- **Objectif** : récupérer les permissions de l'utilisateur connecté dans la pharmacie.
- **Méthode HTTP** : `GET`
- **URL** : `/api/pharmacies/{pharmacy_id}/permissions/`
- **Vue backend** : `MyPharmacyPermissionListView`
- **Pages frontend** : `/app/pharmacies/[pharmacyId]/dashboard`,
  `/app/pharmacies/[pharmacyId]/products`,
  `/app/pharmacies/[pharmacyId]/products/create`,
  `/app/pharmacies/[pharmacyId]/invoices`,
  `/app/pharmacies/[pharmacyId]/reports`,
  `/app/pharmacies/[pharmacyId]/settings/human-resources`
- **Service frontend** : `getPharmacyPermissions(pharmacyId)` dans `lib/api`
- **Réponse attendue (200)** : objet dont les clés sont les permissions (ex.
  `product_view`, `product_create`, `product_update`, `product_delete`,
  `product_export_pdf`, `product_export_excel`,
  `sale_view`, `sale_create`, `sale_payment_create`, `sale_cancel`,
  `report_view`, `report_export`, `report_financial_view`, `report_staff_view`,
  `report_ai_view`) avec des valeurs booléennes.
- **Comportement frontend dashboard** : la page dashboard charge ces permissions
  en même temps que les données du dashboard. Les actions `Nouvelle vente` et
  `Entrée de stock` restent visibles, mais elles ne sont cliquables que si
  l'utilisateur possède respectivement `sale_create` et `stock_adjust`. Le
  raccourci `Produits` n'est cliquable que si l'utilisateur possède `product_view`.
- **Comportement frontend factures** : la page `Factures` utilise `sale_view` pour
  l'accès, `sale_create` pour le bouton `Nouvelle vente`, `sale_payment_create`
  pour l'action liée à la caisse, et `sale_cancel` pour l'action d'annulation.
- **Comportement frontend navbar pharmacie** : les onglets contrôlés par permissions
  restent visibles dans la navigation de la pharmacie, mais ils sont désactivés si
  la permission correspondante n'est pas accordée. `Produits` dépend de
  `product_view`, `Stock` de `stock_view`, `Ventes` de `sale_view`, `Facture` de
  `sale_view`, et `Notification` de `join_request_view`. L'onglet `Rapports`
  dépend de la feature de plan `reports` et de la permission `report_view`.
- **Erreurs possibles** : `401 Unauthorized`, `403 Forbidden`.

## Rapports pharmacie

La page `/app/pharmacies/[pharmacyId]/reports` consomme les rapports backend
avec le module `lib/api/reports.ts`. Les totaux, revenus, stocks et statuts de
péremption sont fournis par le backend ; le frontend ne fait que filtrer,
paginer et formater l'affichage.

### GET /api/pharmacies/{pharmacy_reference}/reports/overview/

- **Objectif** : afficher la vue d'ensemble des rapports.
- **Méthode HTTP** : `GET`
- **URL** : `/api/pharmacies/{pharmacy_reference}/reports/overview/`
- **Page frontend** : `/app/pharmacies/[pharmacyId]/reports`
- **Service frontend** : `getReportOverview(pharmacyReference, period)` dans
  `lib/api/reports.ts`
- **Authentification** : requise avec `Authorization: Bearer <access_token>`.
- **Permissions/features frontend** : `report_view` et `reports`.
- **Query params envoyés si renseignés** : `start_date`, `end_date`.
- **Réponse utilisée** : compte des ventes, chiffre d'affaires, articles vendus,
  produits actifs, stock total, produits en rupture, produits proches de la
  péremption et produits expirés.
- **Erreurs possibles** : `400 Bad Request`, `401 Unauthorized`,
  `403 Forbidden`, `404 Not Found`, `500 Internal Server Error`.

### GET /api/pharmacies/{pharmacy_reference}/reports/sales/

- **Objectif** : afficher le rapport paginé des ventes.
- **Méthode HTTP** : `GET`
- **URL** : `/api/pharmacies/{pharmacy_reference}/reports/sales/`
- **Page frontend** : `/app/pharmacies/[pharmacyId]/reports`
- **Service frontend** : `getSalesReport(pharmacyReference, filters)` dans
  `lib/api/reports.ts`
- **Authentification** : requise avec `Authorization: Bearer <access_token>`.
- **Permissions/features frontend** : `report_view` et `reports`.
- **Query params envoyés si renseignés** : `start_date`, `end_date`, `user`,
  `product`, `page`.
- **Réponse utilisée** : résumé (`sales_count`, `items_sold`, `revenue`) et
  liste paginée avec référence, date, utilisateur, total et nombre d'articles.
- **Erreurs possibles** : `400 Bad Request`, `401 Unauthorized`,
  `403 Forbidden`, `404 Not Found`, `500 Internal Server Error`.

### GET /api/pharmacies/{pharmacy_reference}/reports/inventory/

- **Objectif** : afficher le rapport paginé du stock.
- **Méthode HTTP** : `GET`
- **URL** : `/api/pharmacies/{pharmacy_reference}/reports/inventory/`
- **Page frontend** : `/app/pharmacies/[pharmacyId]/reports`
- **Service frontend** : `getInventoryReport(pharmacyReference, filters)` dans
  `lib/api/reports.ts`
- **Authentification** : requise avec `Authorization: Bearer <access_token>`.
- **Permissions/features frontend** : `report_view` et `reports`.
- **Query params envoyés si renseignés** : `page`.
- **Réponse utilisée** : résumé du nombre de produits, quantité totale en stock,
  ruptures, stocks faibles, valeur estimée si renvoyée, puis liste paginée avec
  référence, produit, stock, prix d'achat, prix de vente, statut stock et valeur
  estimée.
- **Erreurs possibles** : `400 Bad Request`, `401 Unauthorized`,
  `403 Forbidden`, `404 Not Found`, `500 Internal Server Error`.

### GET /api/pharmacies/{pharmacy_reference}/reports/expirations/

- **Objectif** : afficher le rapport paginé des péremptions.
- **Méthode HTTP** : `GET`
- **URL** : `/api/pharmacies/{pharmacy_reference}/reports/expirations/`
- **Page frontend** : `/app/pharmacies/[pharmacyId]/reports`
- **Service frontend** : `getExpirationReport(pharmacyReference, filters)` dans
  `lib/api/reports.ts`
- **Authentification** : requise avec `Authorization: Bearer <access_token>`.
- **Permissions/features frontend** : `report_view` et `reports`.
- **Query params envoyés si renseignés** : `status`, `start_date`, `end_date`,
  `page`.
- **Réponse utilisée** : résumé (`expired`, `expiring_soon`, `valid`,
  `no_expiration`) et liste paginée avec référence, produit, stock actuel, date
  de péremption et statut.
- **Erreurs possibles** : `400 Bad Request`, `401 Unauthorized`,
  `403 Forbidden`, `404 Not Found`, `500 Internal Server Error`.

### GET /api/pharmacies/{pharmacy_id}/activity/

- **Objectif** : récupérer l'activité récente de la pharmacie active.
- **Méthode HTTP** : `GET`
- **URL** : `/api/pharmacies/{pharmacy_id}/activity/`
- **Vue backend** : `PharmacyActivityView`
- **Page frontend** : `/app/pharmacies/[pharmacyId]/history`
- **Service frontend** : `getPharmacyActivity(pharmacyId)` dans `lib/api`
- **Authentification** : requise avec `Authorization: Bearer <access_token>`.
- **Réponse attendue (200)** : liste d'événements avec `id`, `type`, `message`,
  `user` et `created_at`.
- **Comportement frontend** : le menu `Compte > Mon historique` ouvre
  l'historique de la pharmacie active.
- **Erreurs possibles** : `401 Unauthorized`, `403 Forbidden`, `404 Not Found`.

### GET /api/pharmacies/{pharmacy_id}/dashboard/

- **Objectif** : synthèse globale du dashboard d'une pharmacie (stats, alertes, ventes, etc.).
- **Méthode HTTP** : `GET`
- **URL** : `/api/pharmacies/{pharmacy_id}/dashboard/`
- **Page frontend** : `/app/pharmacies/[pharmacyId]/dashboard`
- **Service frontend** : `getPharmacyDashboard(pharmacyId)` dans `lib/dashboard-api`
- **Réponse attendue (200)** : payload contenant `pharmacy` (avec `id` = référence de la
  pharmacie), `stats`, `alerts`, `sales_last_7_days`, `top_products`, `latest_sales`,
  `restock_products`, `recent_activity`.
- **Erreurs possibles** : `401 Unauthorized`, `403 Forbidden`, `404 Not Found`.

### GET /api/pharmacies/{pharmacy_id}/invoices/pending/

- **Objectif** : récupérer les factures en attente de traitement pour une pharmacie.
- **Méthode HTTP** : `GET`
- **URL** : `/api/pharmacies/{pharmacy_id}/invoices/pending/`
- **Page frontend** : `/app/pharmacies/[pharmacyId]/dashboard`
- **Services frontend** : `getPharmacyDashboard(pharmacyId)` dans `lib/dashboard-api`
  pour les alertes du dashboard. Le helper `getPendingPharmacyInvoices(pharmacyId)`
  reste disponible dans `lib/api/invoices.ts` pour un usage ciblé.
- **Usage frontend** : cet endpoint alimente les alertes du dashboard. La page
  `Facture` utilise désormais `GET /api/sales/` pour la liste complète.
- **Réponse attendue (200)** : liste de factures en attente avec `id`, `reference`,
  `customer`, `amount` et `created_at`.
- **Erreurs possibles** : `401 Unauthorized`, `403 Forbidden`, `404 Not Found`.

## Abonnements et paiements

- **Page frontend** : `/tarifs/[name]`
- **Service frontend** : `lib/api.ts`
- **Authentification** : requise avec `Authorization: Bearer <access_token>` pour
  initialiser un paiement ou consulter un reçu.

Endpoints consommés:

| Usage frontend | Méthode et URL |
| --- | --- |
| Plans pharmacie | `GET /api/paiements/pharmacy-plans/` |
| Détail plan | `GET /api/paiements/pharmacy-plans/{name}/` |
| Initialiser checkout agrégateur | `POST /api/paiements/pharmacy-subscriptions/agregateur/checkout/` |
| Détail reçu abonnement | `GET /api/paiements/subscription-payments/{payment_id}/?pharmacy_reference=PHXXXXXXXX` |

Flux agrégateur:

1. `/tarifs/[name]` appelle l'endpoint de checkout avec `pharmacy_reference`,
   `plan_code`, `plan_id`, `user_count`, `duration_months` et `currency`.
   `plan_id` et `user_count` (facturation par utilisateur) ne sont envoyés que
   lorsqu'ils sont connus, afin de rester compatibles avec l'ancien contrat.
   Le frontend ne transmet jamais de montant : le backend reste la seule source
   de vérité pour le montant, les remises et les crédits IA inclus.
2. Le backend crée un paiement `PENDING` et renvoie `checkout_url`.
3. Le frontend ouvre `checkout_url` dans une iframe agrégateur.
4. Le message frontend `agregateur-success` affiche une confirmation en cours mais ne
   valide pas l'abonnement.
5. Le frontend relit le reçu jusqu'au statut backend `VALIDATED`, produit par le
   webhook `/api/webhook/`.

Statuts paiement consommés: `PENDING`, `VALIDATED`, `CANCELED`, `REFUNDED`.

## Crédits IA (scan d'ordonnance)

- **Pages frontend** :
  - `/app/pharmacies/[pharmacyId]/sales/create` (solde utilisateur)
  - `/app/pharmacies/[pharmacyId]/settings/ai` (solde pharmacie)
- **Service frontend** : `lib/api/billing.ts` (fonctions `getUserAiCredits` et `getPharmacyAiCredits`)
- **Authentification** : requise avec `Authorization: Bearer <access_token>`.
- **Règle importante** : les soldes sont fournis par le backend (`PharmacyUserAnalysisCreditPeriod`
  pour l'utilisateur, système de périodes/crédits pour la pharmacie). Le frontend ne calcule jamais
  les soldes, il les affiche tels quels.

Endpoints consommés:

| Usage frontend | Méthode et URL |
| --- | --- |
| Crédits IA restants d'un utilisateur | `GET /api/paiements/pharmacies/{pharmacy_id}/users/{user_reference}/ai-credits/` (page vente « Scanner avec l'IA » et page `settings/me` « Mon espace ») |
| Crédits IA restants d'une pharmacie | `GET /api/paiements/pharmacies/{pharmacy_id}/ai-credits/` |

Paramètres de chemin:

- `pharmacy_id` : référence de la pharmacie active (depuis l'URL).
- `user_reference` (endpoint utilisateur) : référence de l'utilisateur connecté (`GET /api/accounts/me/`).

Réponse attendue (extrait pertinent):

```json
{
  "pharmacy": { "id": 1, "reference": "PHXXXXXXXX" },
  "plan": {
    "code": "standard",
    "name": "Standard",
    "price_per_user_month": "0.00",
    "included_ai_credit_per_user_month": 30000
  },
  "period": { "start": "2026-08-01T00:00:00Z", "end": "2026-08-31T23:59:59Z" },
  "billing": { "billable_users": 3 },
  "credits": {
    "included": 30000,
    "used": 0,
    "remaining": 30000,
    "usage_percent": 0
  }
}
```

Le frontend de la page `settings/ai` utilise `credits.included`, `credits.used`, `credits.remaining`
et `credits.usage_percent`, ainsi que `plan.name`, `period.start/end` et `billing.billable_users`.
En cas d'erreur (401/403/404), la page affiche un message d'erreur sans blocage.

Le frontend de la page de vente utilise uniquement `credits.remaining` pour afficher
`(X crédits IA restants)`. En cas d'erreur (401/403/404), l'appel est ignoré
`.catch(() => null)` et le solde n'est pas affiché, sans bloquer la page de vente.

## Parrainage

- **Page frontend** : `/app/referrals`
- **Service frontend** : `lib/api/referrals.ts`
- **Authentification** : requise avec `Authorization: Bearer <access_token>`.
- **Règle importante** : le frontend ne crée jamais une commission et ne confirme
  jamais un paiement. Il affiche uniquement les données confirmées par le
  backend.

Endpoints consommés:

| Usage frontend | Méthode et URL |
| --- | --- |
| Résumé portefeuilles | `GET /api/paiements/referrals/me/` |
| Pharmacies parrainées | `GET /api/paiements/referrals/referred-pharmacies/` |
| Portefeuilles | `GET /api/paiements/referral-wallets/` |
| Résumé devise | `GET /api/paiements/referral-wallets/{currency}/summary/` |
| Transactions devise | `GET /api/paiements/referral-wallets/{currency}/transactions/` |
| Commissions | `GET /api/paiements/referral-commissions/` |
| Commissions par devise | `GET /api/paiements/referral-commissions/?currency=USD` |
| Comptes de retrait | `GET /api/paiements/referral-payout-accounts/` |
| Créer compte retrait | `POST /api/paiements/referral-payout-accounts/` |
| Modifier compte retrait | `PATCH /api/paiements/referral-payout-accounts/{reference}/` |
| Retraits | `GET /api/paiements/referral-withdrawals/` |
| Création retrait | `POST /api/paiements/referral-withdrawals/` |
| Détail retrait | `GET /api/paiements/referral-withdrawals/{reference}/` |

Payload envoyé depuis `/app/settings` pour configurer le compte de réception:

```json
{
  "currency": "USD",
  "provider": "AGREGATEUR",
  "payment_method": "MOBILE_MONEY",
  "operator": "MPESA",
  "phone_number": "+243XXXXXXXXX",
  "account_name": "Nom du bénéficiaire",
  "metadata": {}
}
```

Payload envoyé depuis `/app/referrals` pour un retrait groupé:

```json
{
  "amount": "15.00",
  "currency": "USD",
  "payout_account_reference": "PAXXXXXXXX"
}
```

La page affiche les montants sous forme de chaînes décimales retournées par le
backend: solde disponible, en attente, réservé, retiré, commissions récentes,
retraits récents et pharmacies parrainées. Les coordonnées de destination sont
configurées dans les paramètres globaux du compte utilisateur, pas dans l'espace
pharmacie. Le webhook agrégateur reste une route backend uniquement, à configurer
côté agrégateur sur `POST /api/webhook/`.

> Note : `{pharmacy_id}` dans les URLs pharmacies correspond à la **référence** publique
> de la pharmacie (ex. `PH0UKUI3NQ`), jamais à l'identifiant interne. Le frontend utilise
> dynamiquement le `pharmacyId` de l'URL, jamais une valeur en dur.

## Notifications

Le backend fournit un système de notifications centralisé pour Kisinet. Le frontend consume les endpoints:

Toutes les requêtes notifications passent par `authenticatedFetch` afin d'ajouter
le header `Authorization: Bearer <access_token>` et de rafraîchir automatiquement
le JWT avant de rejouer une requête expirée.

| Usage frontend | Méthode et URL | Auth |
| --- | --- | --- |
| Liste notifications | `GET /api/notifications/` | Oui |
| Compteur non lues | `GET /api/notifications/unread-count/` | Oui |
| Résumé par catégorie | `GET /api/notifications/unread-summary/` | Oui |
| Marquer comme lue | `POST /api/notifications/{reference}/read/` | Oui |
| Marquer tout comme lu | `POST /api/notifications/read-all/` | Oui |

### GET /api/notifications/

- **Objectif** : lister les notifications de l'utilisateur connecté.
- **Méthode HTTP** : `GET`
- **URL** : `/api/notifications/`
- **Page frontend** : `/app/pharmacies/[pharmacyId]/notifications`
- **Service frontend** : `getNotifications(filters)` dans `lib/api/notifications`
- **Authentification** : requise avec `Authorization: Bearer <access_token>`.
- **Paramètres query** :
  - `category` : filtre optionnel sur la catégorie de notification ;
  - `pharmacy` : filtre optionnel sur la référence de pharmacie ;
  - `is_read` : `true` ou `false` pour filtrer par statut de lecture ;
  - `page`, `page_size` : pagination DRF standard.
- **Réponse attendue (200)** : objet paginé `{ count, next, previous, results }`. Chaque `result` contient :
  - `reference` : identifiant unique de la notification ;
  - `category` : catégorie de notification (ex: `AI_CREDIT_LOW`, `PRODUCT_EXPIRATION`, `PAYMENT_SUCCESS`) ;
  - `severity` : gravité (`INFO`, `SUCCESS`, `WARNING`, `CRITICAL`) ;
  - `title` : titre de la notification ;
  - `message` : corps du message ;
  - `pharmacy_reference` : référence de la pharmacie associée (ou `null`) ;
  - `pharmacy_name` : nom de la pharmacie (ou `null`) ;
  - `action_url` : URL d'action optionnelle (ou `null`) ;
  - `is_read` : booléen indiquant si la notification est lue ;
  - `read_at` : date de lecture (ou `null`) ;
  - `created_at` : date de création.
- **Comportement frontend** : la page notifications affiche les notifications avec filtrage par catégorie, statut de lecture et pharmacie. Chaque notification non lue affiche un indicateur visuel.
- **Page pharmacie** : `/app/pharmacies/[pharmacyId]/notifications` transmet toujours
  `pharmacy=<pharmacyId>` pour ne pas mélanger les notifications globales personnelles
  avec les événements de la pharmacie courante.
- **Compteurs de page** : les totaux `Toutes`, `Non lues` et `Lues` sont lus via ce
  même endpoint avec `page_size=1`, afin d'utiliser le champ paginé `count` sans
  charger l'historique complet.

### GET /api/notifications/unread-count/

- **Objectif** : récupérer le nombre de notifications non lues pour le badge navbar.
- **Méthode HTTP** : `GET`
- **URL** : `/api/notifications/unread-count/`
- **Service frontend** : `getUnreadNotificationCount()` dans `lib/api/notifications`
- **Authentification** : requise.
- **Réponse attendue (200)** : `{ "count": number }`
- **Comportement frontend** : le badge de la navbar pharmacie affiche ce compteur
  global utilisateur. Si `count = 0`, aucun badge n'est rendu. Si `count > 99`,
  afficher `99+`.
- **Synchronisation** : après `markNotificationAsRead` ou `markAllNotificationsAsRead`,
  le service notifications déclenche un événement navigateur local
  `kisinet:notifications_refresh`; `AppLayout` recharge alors ce compteur.
- **Limite backend actuelle** : cet endpoint ne prend pas de paramètre `pharmacy`.
  Le badge navbar reste donc global utilisateur tant que le backend ne fournit pas
  un compteur non lu filtrable par pharmacie.

### GET /api/notifications/unread-summary/

- **Objectif** : récupérer le résumé des notifications non lues groupées par catégorie.
- **Méthode HTTP** : `GET`
- **URL** : `/api/notifications/unread-summary/`
- **Page frontend** : future page globale `/app/notifications` ou usage global.
- **Service frontend** : `getUnreadNotificationSummary()` dans `lib/api/notifications`
- **Authentification** : requise.
- **Réponse attendue (200)** :
  ```json
  {
    "total": 5,
    "groups": {
      "payments": 1,
      "commissions": 1,
      "products": 2,
      "ai_credits": 1
    }
  }
  ```
- **Comportement frontend** : le service reste disponible pour une page globale
  utilisateur. La page pharmacie ne l'utilise pas pour ses cartes, car le backend
  ne filtre pas encore ce résumé par `pharmacy`.
- **Cartes page pharmacie** : les groupes `payments`, `commissions`, `products` et
  `ai_credits` sont alignés sur les groupes backend connus, mais leurs compteurs
  sont calculés par des appels paginés `GET /api/notifications/?pharmacy=...&category=...&is_read=false&page_size=1`.
  Cette stratégie évite d'afficher des notifications globales dans une page
  spécifique à une pharmacie.

### POST /api/notifications/{reference}/read/

- **Objectif** : marquer une notification spécifique comme lue.
- **Méthode HTTP** : `POST`
- **URL** : `/api/notifications/{reference}/read/`
- **Page frontend** : `/app/pharmacies/[pharmacyId]/notifications`
- **Service frontend** : `markNotificationAsRead(reference)` dans `lib/api/notifications`
- **Authentification** : requise.
- **Payload** : aucun corps requis.
- **Réponse attendue (200)** : `{ "detail": "Notification marquée comme lue." }`
- **Comportement frontend** : après succès, mettre à jour localement la notification,
  décrémenter les compteurs de la page, recharger les métadonnées et déclencher la
  revalidation du badge navbar. Si la notification possède `action_url`, la
  navigation Next.js est lancée après la tentative de lecture.

### POST /api/notifications/read-all/

- **Objectif** : marquer toutes les notifications non lues comme lues.
- **Méthode HTTP** : `POST`
- **URL** : `/api/notifications/read-all/`
- **Page frontend** : `/app/pharmacies/[pharmacyId]/notifications`
- **Service frontend** : `markAllNotificationsAsRead(options)` dans `lib/api/notifications`
- **Authentification** : requise.
- **Payload optionnel** :
  - `category` : ne marquer comme lues que les notifications de cette catégorie ;
  - `pharmacy` : ne marquer comme lues que les notifications de cette pharmacie.
- **Réponse attendue (200)** : `{ "detail": "X notification(s) marquée(s) comme lue(s).", "marked_count": X }`
- **Comportement frontend** : sur la page pharmacie, envoyer `pharmacy=<pharmacyId>`
  dans le payload pour limiter l'action aux notifications de la pharmacie courante.
  Après succès, les notifications affichées sont marquées comme lues, les compteurs
  et cartes de la page sont rechargés, puis le badge navbar est revalidé.

### Catégories de notifications

| Code | Label frontend | Description |
|------|---------------|-------------|
| `AI_CREDIT_LOW` | Crédits IA | Crédits IA faibles |
| `AI_CREDIT_PURCHASE` | Achat de crédits IA | Achat de crédits confirmé |
| `PRODUCT_EXPIRATION` | Produits | Produit proche de l'expiration |
| `STOCK_LOW` | Stock | Stock faible |
| `SUBSCRIPTION_PAYMENT` | Abonnement | Paiement d'abonnement confirmé |
| `SUBSCRIPTION_EXPIRING` | Abonnement | Abonnement proche de l'expiration |
| `SUBSCRIPTION_EXPIRED` | Abonnement | Abonnement expiré |
| `PAYMENT_SUCCESS` | Paiements | Paiement réussi |
| `PAYMENT_FAILED` | Paiements | Paiement échoué |
| `COMMISSION_RECEIVED` | Commissions | Commission de parrainage reçue |
| `WITHDRAWAL_REQUESTED` | Retraits | Demande de retrait effectuée |
| `WITHDRAWAL_APPROVED` | Retraits | Retrait approuvé |
| `WITHDRAWAL_REJECTED` | Retraits | Retrait rejeté |
| `WITHDRAWAL_PAID` | Retraits | Retrait payé |
| `PHARMACY` | Pharmacie | Événement relié à la pharmacie |
| `MEMBER` | Membres | Événement relié à un membre |
| `PERMISSION` | Permissions | Modification de permission |
| `SYSTEM` | Système | Notification système |

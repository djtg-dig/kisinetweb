# APIs consommées par le frontend Kisinet

Ce fichier liste les endpoints backend déjà consommés par l'interface frontend.

## Authentification

- `GET /api/carri-account/login/`

## Pharmacies

- `GET /api/pharmacies/public/`
- `GET /api/pharmacies/public/filter-options/`
- `POST /api/pharmacies/join-requests/`
- `GET /api/pharmacies/`
- `POST /api/pharmacies/`
- `GET /api/pharmacies/countries/`
- `GET /api/pharmacies/cities-or-provinces/`
- `GET /api/pharmacies/{pharmacy_id}/permissions/`
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

## Produits

- `GET /api/products/?pharmacy_reference={pharmacy_id}`
- `GET /api/products/filter-options/?pharmacy_reference={pharmacy_id}`
- `GET /api/products/{reference}/?pharmacy_reference={pharmacy_id}`
- `POST /api/products/`
- `DELETE /api/products/{reference}/?pharmacy_reference={pharmacy_id}`

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
| `purchase_price`   | number  | non         | Prix d'achat, >= 0. Envoyé seulement si renseigné.              |
| `current_stock`    | integer | non         | Stock initial, >= 0. Défaut : 0. Envoyé seulement si renseigné. |

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
  "sale_price": "1.50",
  "purchase_price": "0.90",
  "current_stock": 100,
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
- **Page frontend** : `/app/pharmacies/[pharmacyId]/products`
- **Service frontend** : `getPharmacyProducts(pharmacyId, filters)` dans `lib/api`
- **Paramètre query obligatoire** : `pharmacy_reference` (référence PHXXXXXXXX de la pharmacie).
- **Autres query params** : `search`, `reference`, `name`, `form`, `target_gender`,
  `target_age_group`, `therapeutic_category`, `stock_status`, `min_stock`, `max_stock`,
  `min_sale_price`, `max_sale_price`, `min_purchase_price`, `max_purchase_price`,
  `created_from`, `created_to`, `updated_from`, `updated_to`, `ordering`, `page`.
- **Réponse attendue (200)** : objet paginé `{ count, next, previous, results }` où
  chaque `result` est un produit (serializer de lecture).
- **Erreurs possibles** : `401 Unauthorized`, `403 Forbidden`.
- **Endpoint compagnon** : `GET /api/products/filter-options/?pharmacy_reference={pharmacy_id}`
  (`getProductFilterOptions`) renvoie les options des filtres (formes, catégories, etc.).

### GET /api/products/{reference}/

- **Objectif** : consulter le détail complet d'un produit.
- **Méthode HTTP** : `GET`
- **URL** : `/api/products/{reference}/?pharmacy_reference={pharmacy_id}`
- **Page frontend** : `/app/pharmacies/[pharmacyId]/products/[reference]`
- **Service frontend** : `getProductDetail(pharmacyId, reference)` dans `lib/api/products.ts`
- **Paramètre query obligatoire** : `pharmacy_reference`.
- **Réponse attendue (200)** : produit complet (serializer de lecture), incluant
  `reference`, `pharmacy_reference`, `name`, `description`, `form`, `target_gender`,
  `target_age_group`, `therapeutic_category`, `sale_price`, `purchase_price`,
  `current_stock`, `is_deleted`, `deleted_at`, `created_at`, `updated_at`.
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

## Permissions et dashboard

### GET /api/pharmacies/{pharmacy_id}/permissions/

- **Objectif** : récupérer les permissions de l'utilisateur connecté dans la pharmacie.
- **Méthode HTTP** : `GET`
- **URL** : `/api/pharmacies/{pharmacy_id}/permissions/`
- **Pages frontend** : `/app/pharmacies/[pharmacyId]/products`,
  `/app/pharmacies/[pharmacyId]/products/create`
- **Service frontend** : `getPharmacyPermissions(pharmacyId)` dans `lib/api`
- **Réponse attendue (200)** : objet dont les clés sont les permissions (ex.
  `product_view`, `product_create`, `product_update`, `product_delete`) avec des
  valeurs booléennes.
- **Erreurs possibles** : `401 Unauthorized`, `403 Forbidden`.

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

> Note : `{pharmacy_id}` dans les URLs pharmacies correspond à la **référence** publique
> de la pharmacie (ex. `PH0UKUI3NQ`), jamais à l'identifiant interne. Le frontend utilise
> dynamiquement le `pharmacyId` de l'URL, jamais une valeur en dur.

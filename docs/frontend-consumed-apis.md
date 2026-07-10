# APIs consommées par le frontend Kisinet

Ce fichier liste les endpoints backend déjà consommés par l'interface frontend.

## Authentification

- `GET /api/carri-account/login/`

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
- **Pages frontend** : `/app/select-pharmacy`, `/tarifs/[name]`
- **Service frontend** : `getUserPharmacies()` dans `lib/api`
- **Authentification** : requise avec `Authorization: Bearer <access_token>`.
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
- **Page frontend** : `/app/pharmacies/[pharmacyId]/settings/details`
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
- **Vue backend** : `MyPharmacyPermissionListView`
- **Pages frontend** : `/app/pharmacies/[pharmacyId]/dashboard`,
  `/app/pharmacies/[pharmacyId]/products`,
  `/app/pharmacies/[pharmacyId]/products/create`,
  `/app/pharmacies/[pharmacyId]/settings/human-resources`
- **Service frontend** : `getPharmacyPermissions(pharmacyId)` dans `lib/api`
- **Réponse attendue (200)** : objet dont les clés sont les permissions (ex.
  `product_view`, `product_create`, `product_update`, `product_delete`) avec des
  valeurs booléennes.
- **Comportement frontend dashboard** : la page dashboard charge ces permissions
  en même temps que les données du dashboard. Les actions `Nouvelle vente` et
  `Entrée de stock` restent visibles, mais elles ne sont cliquables que si
  l'utilisateur possède respectivement `sale_create` et `stock_adjust`.
- **Erreurs possibles** : `401 Unauthorized`, `403 Forbidden`.

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

> Note : `{pharmacy_id}` dans les URLs pharmacies correspond à la **référence** publique
> de la pharmacie (ex. `PH0UKUI3NQ`), jamais à l'identifiant interne. Le frontend utilise
> dynamiquement le `pharmacyId` de l'URL, jamais une valeur en dur.

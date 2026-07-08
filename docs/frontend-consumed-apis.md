# APIs consommées par le frontend Kisinet

Ce fichier liste les endpoints backend déjà consommés par l'interface frontend.

## Authentification

- `GET /api/carri-account/login/`

## Pharmacies

- `GET /api/pharmacies/`
- `POST /api/pharmacies/`
- `GET /api/pharmacies/countries/`
- `GET /api/pharmacies/cities-or-provinces/`
- `GET /api/pharmacies/{pharmacy_id}/permissions/`
- `GET /api/pharmacies/{pharmacy_id}/dashboard/`
- `GET /api/pharmacies/{pharmacy_id}/stock/alerts/`
- `GET /api/pharmacies/{pharmacy_id}/invoices/pending/`

## Produits

- `GET /api/products/?pharmacy_reference={pharmacy_id}`
- `GET /api/products/filter-options/?pharmacy_reference={pharmacy_id}`

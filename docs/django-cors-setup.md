# Configuration CORS pour le backend Django (développement)

Ce document fournit un patch minimal `settings.py` et des commandes pour activer CORS
lorsque le frontend tourne sur `http://localhost:3000`.

> IMPORTANT (dev only): n'utilisez `CORS_ALLOW_ALL_ORIGINS = True` qu'en développement.

## 1) Installer la dépendance

```bash
pip install django-cors-headers
```

## 2) Extrait à coller dans `settings.py`

Placez ces lignes (ou adaptez) dans votre `settings.py` :

```py
# settings.py (extraits)

INSTALLED_APPS = [
    # ... autres apps ...
    'corsheaders',
]

MIDDLEWARE = [
    # CorsMiddleware doit être placé avant tout middleware qui peut générer des réponses
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.common.CommonMiddleware',
    # ... le reste de vos middlewares ...
]

# Autoriser l'origine du frontend en dev
CORS_ALLOWED_ORIGINS = [
    'http://localhost:3000',
]

# Autoriser l'en-tête Authorization utilisé pour Bearer tokens
from corsheaders.defaults import default_headers
CORS_ALLOW_HEADERS = list(default_headers) + [
    'authorization',
]

# Si vous utilisez l'authentification avec cookies, activez ceci
# CORS_ALLOW_CREDENTIALS = True
```

Si vous préférez une règle plus permissive (uniquement en développement) :

```py
CORS_ALLOW_ALL_ORIGINS = True
```

## 3) Redémarrer le serveur Django

Redémarrez votre serveur (par exemple `manage.py runserver` ou votre configuration uvicorn/gunicorn).

## 4) Vérifier depuis la machine locale

Tester le preflight OPTIONS :

```bash
curl -i -X OPTIONS http://127.0.0.1:8002/api/pharmacies/ \
  -H "Origin: http://localhost:3000" \
  -H "Access-Control-Request-Method: GET" \
  -H "Access-Control-Request-Headers: authorization,accept"
```

La réponse devrait contenir un en-tête `Access-Control-Allow-Origin: http://localhost:3000`.

Tester la requête GET (avec token si nécessaire) :

```bash
curl -v -H "Authorization: Bearer <VOTRE_TOKEN>" http://127.0.0.1:8002/api/pharmacies/
```

## 5) Remarques

- En production, configurez précisément `CORS_ALLOWED_ORIGINS` pour vos domaines.
- N'exposez pas `CORS_ALLOW_ALL_ORIGINS = True` en production.
- Si vous utilisez un reverse-proxy (nginx, traefik), assurez-vous que le proxy ne retire pas les en-têtes CORS.

---

Si vous voulez, je peux générer un patch `git` (`diff`) prêt à appliquer sur le dépôt backend si vous me fournissez l'arborescence du backend ou un chemin vers son `settings.py`.

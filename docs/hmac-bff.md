# BFF HMAC Kisinet Web

## Architecture

Le navigateur appelle les endpoints métier en same-origin via `/api/backend/...`.
La Route Handler Next.js reconstruit l'URL Django `/api/...`, ajoute les headers
HMAC côté serveur, puis relaie la réponse sans supposer que le contenu est JSON.

```text
Browser -> Next.js BFF -> Django
           HMAC             JWT utilisateur
```

## Variables d'environnement

```text
KISINET_BACKEND_URL=http://127.0.0.1:8002
KISINET_HMAC_CLIENT_ID=kisinet-web
KISINET_HMAC_SECRET=<secret serveur uniquement>
KISINET_HMAC_SIGNATURE_VERSION=v1
```

Le secret doit être injecté dans le runtime serveur Next.js. Il ne doit jamais
être préfixé par `NEXT_PUBLIC_`, codé en dur, transmis en prop React, stocké en
localStorage, sessionStorage, cookie lisible par JavaScript, ni journalisé.

Pour le développement local, `.env.development` peut contenir une valeur temporaire
identique à celle configurée côté backend Django pour `kisinet-web`. Ce fichier
ne doit pas être commité.

## Signature

`lib/server/hmac.ts` utilise `node:crypto` et `import "server-only"`. La chaîne
canonique est celle du backend :

```text
v1
{client_id}
{timestamp}
{nonce}
{METHOD}
{canonical_path_and_query}
{body_sha256}
```

La query string reproduit `urllib.parse.parse_qsl(..., keep_blank_values=True)`
puis `urlencode(sorted(..., key=(key, value)))` : tri Unicode déterministe par
code point, clé puis valeur, valeurs vides gardées, paramètres répétés conservés
et espaces encodés en `+`. Le tri ne dépend pas de la locale, d'ICU, du système
ou du navigateur.

Les tests unitaires vérifient l'égalité exacte avec les vecteurs Python du backend
(`core/tests/test_hmac_authentication.py`) pour body vide, JSON, GET/POST/PATCH/DELETE,
query simple, réordonnée, multivalue, valeurs vides, caractères URL-encodés et Unicode.

## signedBackendFetch

`lib/server/backend-fetch.ts` centralise l'appel serveur :

- validation du chemin interne `/api/...`;
- rejet des URL absolues, `//` et traversées `..`;
- allowlist des headers entrants;
- suppression des éventuels headers `X-Kisinet-*` fournis par le navigateur;
- ajout de `Authorization: Bearer ...` seulement si un JWT utilisateur est passé;
- génération d'un timestamp, nonce et signature neufs à chaque requête.

## Route Handler BFF

`app/api/backend/[...path]/route.ts` supporte `GET`, `POST`, `PUT`, `PATCH`,
`DELETE` et `HEAD`. Le path signé est le path Django final, par exemple :

```text
Browser: /api/backend/pharmacies/
Django:  /api/pharmacies/
Signé:   /api/pharmacies/
```

Les appels existants construits avec `apiBaseUrl + "/api/..."` donnent donc des
URL navigateur de type `/api/backend/api/pharmacies/`, que le Route Handler
normalise vers `/api/pharmacies/` côté Django.

Le BFF relaie les contenus JSON, PDF, Excel, images/fichiers autorisés, `204 No
Content`, `Content-Type`, `Content-Disposition`, `ETag`, `Cache-Control` et
headers utiles sans lire systématiquement `response.json()`.

## JWT et refresh

Les tokens utilisateur et admin restent exclusivement dans des cookies `HttpOnly`,
`Secure` en production, `SameSite=Lax`. Le BFF Next.js relaie le JWT utilisateur
vers Django avec HMAC. Le refresh JWT existant reste single-flight et repasse par
`/api/backend/api/accounts/token/refresh/` ou `/api/backend/api/admin/auth/refresh/`.

Aucun token ne doit jamais être stocké dans `localStorage`, `sessionStorage`,
l'URL query, l'URL fragment, ou exposé au Client Components.

HMAC authentifie `kisinet-web`, tandis que le JWT authentifie `request.user`.
Les deux couches restent indépendantes et complémentaires.

## Uploads et downloads

Pour les uploads multipart, la Route Handler lit les bytes reçus avec
`request.arrayBuffer()`, signe ces mêmes bytes, puis transmet exactement ce body
à Django. Les téléchargements PDF/Excel sont relayés en stream avec leurs headers
de disposition afin de préserver les noms de fichiers.

## Rotation du secret

Le frontend utilise uniquement le secret courant. Pour une rotation :

1. configurer côté Django `previous = ancien`, `current = nouveau`;
2. déployer Next.js avec le nouveau `KISINET_HMAC_SECRET`;
3. vérifier le trafic;
4. supprimer le secret précédent côté Django.

## Activation stricte

L'ordre recommandé reste :

1. `KISINET_HMAC_ENABLED=true` et `KISINET_HMAC_ENFORCE=false`;
2. déployer le BFF HMAC;
3. vérifier qu'aucun appel navigateur direct vers Django ne reste;
4. valider login, refresh, uploads, downloads, parcours métier et logs backend;
5. activer `KISINET_HMAC_ENFORCE=true`.

Un secret de production peut être généré hors code avec :

```bash
openssl rand -hex 32
```

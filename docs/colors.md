# Couleurs de Kisinet

Kisinet est une application de gestion de pharmacies. Son interface doit donc
inspirer confiance, sécurité, lisibilité et sérieux. La palette choisie reprend
des codes visuels courants dans les produits médicaux : le bleu pour la
fiabilité, le vert pour les états positifs, l'orange pour les alertes, le rouge
pour les erreurs et le cyan pour les informations.

## Couleurs principales

### Primary / Bleu médical

Le bleu médical est utilisé pour les actions principales, les liens importants,
les éléments actifs et les zones qui doivent rassurer l'utilisateur.

| Niveau | Code |
| --- | --- |
| 50 | `#EFF6FF` |
| 100 | `#DBEAFE` |
| 200 | `#BFDBFE` |
| 300 | `#93C5FD` |
| 400 | `#60A5FA` |
| 500 | `#3B82F6` |
| 600 | `#2563EB` |
| 700 | `#1D4ED8` |
| 800 | `#1E40AF` |
| 900 | `#1E3A8A` |

Usages recommandés :

- Boutons principaux : `primary-600`
- Survol des boutons : `primary-700`
- Fonds légers : `primary-50`
- Textes ou badges importants : `primary-700`

### Success / Vert santé

Le vert indique un état positif, une validation, un stock correct ou une action
réussie.

| Niveau | Code |
| --- | --- |
| 50 | `#ECFDF5` |
| 100 | `#D1FAE5` |
| 200 | `#A7F3D0` |
| 300 | `#6EE7B7` |
| 400 | `#34D399` |
| 500 | `#10B981` |
| 600 | `#059669` |
| 700 | `#047857` |
| 800 | `#065F46` |
| 900 | `#064E3B` |

Usages recommandés :

- Badges de succès : `success-50` avec texte `success-700`
- Messages de confirmation : `success-600`
- Indicateurs de stock suffisant : `success-500` ou `success-600`

## Couleurs d'état

| Rôle | Code | Usage recommandé |
| --- | --- | --- |
| Warning | `#F59E0B` | Alertes, seuils de stock faibles, attention requise |
| Error | `#EF4444` | Erreurs, actions dangereuses, échecs de validation |
| Info | `#06B6D4` | Informations neutres, aide, contexte complémentaire |

## Thème clair

| Rôle | Code | Usage |
| --- | --- | --- |
| Background | `#F8FAFC` | Fond principal de l'application |
| Surface | `#FFFFFF` | En-têtes, panneaux et surfaces de contenu |
| Card | `#FFFFFF` | Cartes de modules, listes et résumés |
| Border | `#E2E8F0` | Bordures discrètes |
| Text | `#0F172A` | Texte principal |
| Muted | `#64748B` | Texte secondaire et descriptions |

## Thème sombre

| Rôle | Code | Usage |
| --- | --- | --- |
| Background | `#020617` | Fond principal sombre |
| Surface | `#0F172A` | En-têtes et zones de contenu |
| Card | `#1E293B` | Cartes et blocs d'information |
| Border | `#334155` | Bordures visibles sans être agressives |
| Text | `#F8FAFC` | Texte principal sur fond sombre |
| Muted | `#94A3B8` | Texte secondaire sur fond sombre |

## Recommandations UI

- Boutons : utiliser le bleu médical pour les actions principales.
- Badges : utiliser une couleur d'état selon le message affiché.
- Alertes : orange pour prévenir, rouge pour bloquer ou signaler une erreur.
- Textes : utiliser `Text` pour le contenu important et `Muted` pour les aides.
- Fonds : utiliser `Background` pour la page, `Surface` pour les zones larges et
  `Card` pour les éléments répétés.
- Cartes : garder des bordures sobres avec `Border` pour conserver une interface
  professionnelle et lisible.

Les variables de thème sont définies dans `app/globals.css`, puis exposées dans
Tailwind avec les couleurs `app-background`, `app-surface`, `app-card`,
`app-border`, `app-text` et `app-muted`.

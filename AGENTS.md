# Instructions générales — Frontend Kisinet

Tu travailles sur le frontend de **Kisinet**, développé avec **Next.js**, **TypeScript** et **App Router**.

Ces instructions s’appliquent à toutes les tâches réalisées dans ce projet.

## 1. Priorité absolue : préserver le fonctionnement existant

Toute modification doit préserver :

* les fonctionnalités existantes ;
* le style global ;
* le thème clair et sombre ;
* la mise en page ;
* la navigation ;
* le responsive ;
* les providers globaux ;
* les composants partagés ;
* les appels API existants ;
* les règles métier déjà implémentées.

Ne casse jamais une fonctionnalité existante pour en ajouter une nouvelle.

Effectue toujours la modification minimale nécessaire.

Ne réécris pas entièrement un fichier lorsqu’une modification ciblée suffit.

## 2. Lire le code avant de le modifier

Avant de modifier un fichier :

1. lis son contenu complet ;
2. comprends son rôle ;
3. identifie ses imports ;
4. identifie ses dépendances ;
5. recherche les composants déjà réutilisables ;
6. vérifie les conséquences possibles sur les autres pages ;
7. conserve les comportements existants qui ne concernent pas directement la tâche.

Ne suppose jamais le contenu ou la structure d’un fichier sans l’avoir consulté.

Ne crée pas un nouveau fichier lorsqu’un fichier ou composant existant peut être correctement adapté.

## 3. Ne jamais casser le style global

Le style doit rester chargé et fonctionnel sur toute l’application, notamment sur :

* la page d’accueil `/` ;
* les pages publiques ;
* les pages d’authentification ;
* les tableaux de bord ;
* les pages des pharmacies ;
* les pages de produits ;
* les pages de stock ;
* les pages de ventes ;
* les pages de factures
* les pages d’erreur ;
* les pages 404 ;
* les écrans de chargement ;
* les composants partagés.

Après une modification touchant le layout, les styles, le thème, les providers ou les pages globales, vérifie que les styles sont toujours appliqués sur la page d’accueil et sur les pages concernées.

Une page qui s’affiche sans CSS ne doit jamais être considérée comme terminée.

## 4. Fichiers critiques à protéger

Porte une attention particulière aux fichiers suivants, selon la structure réelle du projet :

* `app/layout.tsx` ;
* `app/globals.css` ;
* `app/page.tsx` ;
* `app/error.tsx` ;
* `app/global-error.tsx` ;
* `app/not-found.tsx` ;
* les fichiers `loading.tsx` ;
* les layouts imbriqués ;
* les providers globaux ;
* le provider du thème ;
* les composants de navigation ;
* les composants UI partagés ;
* `tailwind.config.*` si ce fichier existe ;
* `postcss.config.*` ;
* `next.config.*` ;
* les fichiers de configuration liés aux styles.

Ne supprime jamais l’importation du fichier CSS global, par exemple :

```tsx
import "./globals.css"
```

Ne déplace pas cette importation sans vérifier les conséquences sur toutes les routes.

Ne duplique pas l’importation de `globals.css` dans plusieurs composants ou pages pour masquer un problème de configuration.

Le CSS global doit rester chargé depuis l’emplacement prévu par l’architecture du projet.

## 5. Préservation du layout racine

Ne remplace pas entièrement `app/layout.tsx` sauf nécessité réelle et démontrée.

Avant de modifier ce fichier, conserve notamment :

* l’importation de `globals.css` ;
* les polices ;
* les métadonnées ;
* les providers ;
* le provider du thème ;
* les composants globaux ;
* les notifications ;
* les composants de gestion réseau ;
* les attributs appliqués à `<html>` et `<body>` ;
* les classes CSS globales ;
* les éléments nécessaires à l’hydratation ;
* les mécanismes d’authentification ou de session éventuellement présents.

Ne supprime aucun provider ou composant global sans avoir vérifié son rôle et toutes ses utilisations.

Ne transforme pas inutilement le layout racine en composant client.

## 6. Gestion de `global-error.tsx`

Dans App Router, `global-error.tsx` est utilisé lorsqu’une erreur atteint le niveau global de l’application.

Ce fichier doit respecter les exigences de Next.js et inclure sa propre structure HTML lorsque cela est nécessaire :

```tsx
<html lang="fr">
  <body>
    {/* Interface d’erreur */}
  </body>
</html>
```

Le composant doit être un composant client lorsque Next.js l’exige.

Il doit notamment pouvoir recevoir :

```tsx
error
reset
```

La page d’erreur globale doit :

* rester lisible même en cas de défaillance du layout principal ;
* utiliser un style compatible avec Kisinet ;
* proposer une action pour réessayer ;
* proposer un retour vers une page sûre ;
* ne jamais afficher une stack trace ;
* ne jamais afficher un message technique brut ;
* ne pas dépendre d’un composant complexe susceptible d’avoir lui-même provoqué l’erreur.

Évite de réutiliser dans `global-error.tsx` des providers, layouts ou composants complexes qui pourraient être responsables de l’erreur globale.

Pour cette page particulière, préfère une interface simple, autonome et robuste.

Ne tente pas de corriger un problème de style global en important arbitrairement plusieurs fichiers CSS dans `global-error.tsx`.

## 7. Pages `error.tsx`

Les fichiers `error.tsx` doivent :

* être des composants clients lorsque Next.js l’exige ;
* recevoir correctement `error` et `reset` ;
* afficher un message compréhensible ;
* proposer un bouton « Réessayer » utilisant `reset()` ;
* proposer une navigation de secours lorsque cela est utile ;
* conserver le design du segment concerné ;
* enregistrer les détails techniques uniquement dans les logs autorisés.

Une erreur dans un segment ne doit pas supprimer inutilement tout le layout de l’application.

Utilise `error.tsx` au niveau le plus proche de la fonctionnalité concernée lorsque cela permet d’isoler correctement l’erreur.

## 8. Gestion des erreurs visible par l’utilisateur

L’utilisateur ne doit jamais voir directement :

* une stack trace ;
* `Internal Server Error` ;
* `Application error` ;
* une exception JavaScript brute ;
* un message Django ou API brut ;
* un chemin interne du projet ;
* une requête SQL ;
* une variable d’environnement ;
* un token ;
* une information sensible ;
* des détails techniques destinés aux développeurs.

À la place, affiche un message simple, par exemple :

```text
Une erreur s’est produite
```

Avec une description compréhensible, par exemple :

```text
Une erreur inattendue est survenue lors du traitement de votre demande.
Veuillez réessayer dans quelques instants.
```

Selon le contexte, propose des actions telles que :

* Réessayer ;
* Retour à l’accueil ;
* Retour au tableau de bord ;
* Recharger la page.

Les détails techniques doivent rester dans les logs de développement ou dans le système de journalisation prévu en production.

Ne masque cependant pas les erreurs pendant le développement : elles doivent rester consultables dans le terminal ou les logs.

## 9. Diagnostic d’une disparition du style

Si le style disparaît, ne compense pas le problème avec du CSS ajouté au hasard.

Recherche d’abord la cause réelle.

Vérifie notamment :

* que `globals.css` existe ;
* que `globals.css` est importé au bon endroit ;
* que le layout racine est toujours utilisé ;
* qu’un layout imbriqué ne remplace pas incorrectement la structure attendue ;
* que les classes de `<html>` et `<body>` sont conservées ;
* que le provider du thème est encore présent ;
* que les variables CSS sont toujours définies ;
* que Tailwind ou le moteur CSS utilisé compile correctement ;
* que les fichiers sources sont bien détectés par Tailwind ;
* que PostCSS fonctionne ;
* qu’aucune erreur de syntaxe CSS ne bloque la génération ;
* qu’aucun import de police ou de style n’a été supprimé ;
* que les alias d’importation sont toujours valides ;
* qu’un fichier n’a pas été déplacé sans mise à jour de ses imports ;
* que le cache de développement ne contient pas une compilation invalide ;
* que le serveur de développement ne signale aucune erreur ;
* que les classes utilisées existent réellement ;
* qu’aucune dépendance CSS requise n’a été supprimée ;
* qu’un composant client ou serveur n’est pas utilisé incorrectement.

Corrige la cause réelle avec le moins de modifications possible.

Ne duplique pas les styles globaux dans chaque page.

## 10. Design system de Kisinet

Toute nouvelle interface doit respecter le design system existant de Kisinet.

Avant toute modification visuelle, consulte :

* `app/globals.css` ;
* les composants UI existants ;
* le fichier de documentation du design system s’il existe ;
* les variables CSS déjà définies ;
* les classes Tailwind déjà utilisées dans le projet.

Respecte :

* la palette de Kisinet ;
* les variables de thème ;
* les bordures ;
* les rayons ;
* les espacements ;
* les tailles de texte ;
* la hiérarchie typographique ;
* les icônes ;
* les boutons ;
* les cartes ;
* les formulaires ;
* le mode clair ;
* le mode sombre ;
* les états de survol ;
* les états de focus ;
* les états désactivés ;
* les états d’erreur ;
* les états de chargement.

N’introduis pas une nouvelle couleur codée directement dans un composant lorsqu’une variable ou classe du design system existe déjà.

N’utilise pas des couleurs différentes pour une seule page sans justification fonctionnelle.

## 11. Réutilisation des composants

Avant de créer un composant, recherche si un composant équivalent existe déjà.

Réutilise en priorité les composants existants, par exemple :

* `Button` ;
* `Card` ;
* `Alert` ;
* `Input` ;
* `Select` ;
* `Dialog` ;
* `DropdownMenu` ;
* `Badge` ;
* `Skeleton` ;
* les composants de navigation ;
* les composants de layout ;
* les composants du thème ;
* les composants d’erreur ;
* les composants de formulaire.

Ne crée pas plusieurs composants ayant le même rôle.

Si un composant partagé doit être modifié, vérifie toutes ses utilisations avant d’effectuer le changement.

Évite d’ajouter des classes spécifiques qui casseraient son apparence sur les autres pages.

## 12. Responsive obligatoire

Toute nouvelle interface ou modification visuelle doit rester utilisable sur :

* un petit téléphone ;
* un téléphone standard ;
* une tablette ;
* un ordinateur portable ;
* un grand écran.

Vérifie notamment que :

* les boutons importants restent accessibles ;
* les menus restent utilisables ;
* les textes ne sortent pas de leur conteneur ;
* les cartes ne débordent pas ;
* les tableaux disposent d’un comportement adapté ;
* les formulaires restent lisibles ;
* les fenêtres modales restent accessibles ;
* la navigation mobile fonctionne ;
* aucun défilement horizontal inutile n’est introduit ;
* les éléments cliquables conservent une taille suffisante.

Ne cache pas une action essentielle sur mobile sans prévoir une autre manière d’y accéder.

## 13. Thème clair et sombre

Toute nouvelle page ou composant doit être compatible avec les thèmes clair et sombre lorsqu’ils sont pris en charge par l’application.

N’utilise pas uniquement des couleurs adaptées au thème clair.

Vérifie notamment :

* le contraste des textes ;
* le fond des pages ;
* les cartes ;
* les bordures ;
* les champs de formulaire ;
* les menus ;
* les modales ;
* les alertes ;
* les boutons ;
* les états de survol ;
* les états désactivés.

Réutilise les variables CSS et les classes sémantiques existantes plutôt que des couleurs fixes.

## 14. TypeScript et qualité du code

Utilise TypeScript correctement.

Évite :

* `any` sans nécessité ;
* les assertions de type inutiles ;
* les types dupliqués ;
* les valeurs non vérifiées ;
* les propriétés optionnelles utilisées sans contrôle.

Préfère :

* des types explicites ;
* des noms compréhensibles ;
* des composants courts ;
* des fonctions ciblées ;
* des retours anticipés simples ;
* des validations lisibles ;
* des imports organisés.

Ne complexifie pas le code sans bénéfice réel.

## 15. Simplicité et lisibilité

Le propriétaire du projet apprend encore Next.js.

Utilise donc :

* une syntaxe simple ;
* des noms explicites ;
* des fonctions courtes ;
* des composants faciles à comprendre ;
* des commentaires simples en français lorsque cela apporte une réelle aide ;
* une structure cohérente ;
* des solutions standard de Next.js.

Évite :

* les abstractions prématurées ;
* les patterns complexes ;
* les hooks personnalisés inutiles ;
* les généralisations excessives ;
* la duplication ;
* les raccourcis difficiles à comprendre ;
* les dépendances inutiles ;
* les techniques avancées lorsqu’une solution simple suffit.

Les commentaires doivent expliquer le « pourquoi » lorsqu’il n’est pas évident, et non répéter chaque ligne de code.

## 16. Dépendances

N’ajoute aucune nouvelle dépendance sans vérifier d’abord si le besoin peut être couvert par :

* Next.js ;
* React ;
* les dépendances déjà installées ;
* les composants existants ;
* une petite fonction locale simple.

Si une dépendance est réellement nécessaire :

* explique pourquoi ;
* vérifie sa compatibilité avec la version actuelle du projet ;
* évite les bibliothèques lourdes pour un besoin simple ;
* ne remplace pas inutilement une solution déjà fonctionnelle.

Ne mets pas à jour plusieurs dépendances sans lien direct avec la tâche.

## 17. Vérifications obligatoires

Après toute modification, exécute les vérifications disponibles et pertinentes dans le projet.

Selon les scripts existants, utilise par exemple :

```bash
npm run lint
```

```bash
npm run typecheck
```

```bash
npm run build
```

ou leurs équivalents définis dans `package.json`.

Ne suppose pas qu’un script existe : consulte d’abord `package.json`.

Pour une modification touchant le style global, le layout, le thème ou les providers, vérifie au minimum :

* la route `/` ;
* la route directement concernée ;
* une page utilisant le layout principal ;
* une page d’erreur si elle a été modifiée ;
* le thème clair ;
* le thème sombre ;
* l’affichage mobile ;
* l’absence d’erreurs dans le terminal ;
* l’absence d’erreurs d’hydratation ;
* le chargement effectif du CSS.

Pour le tableau de bord d’une pharmacie, utilise un identifiant réellement disponible dans l’environnement local lorsque cela est possible.

Ne remplace pas littéralement `[pharmacyId]` dans une URL de test.

## 18. Ne pas prétendre avoir effectué une vérification impossible

Ne déclare jamais qu’une page fonctionne ou que son style est correct sans l’avoir réellement vérifiée.

Si tu ne peux pas ouvrir un navigateur, lancer le serveur, accéder à une API, t’authentifier ou consulter une route protégée, indique clairement la limitation.

Distingue toujours :

* ce qui a été corrigé dans le code ;
* ce qui a été vérifié par compilation ;
* ce qui a été vérifié dans le navigateur ;
* ce qui n’a pas pu être vérifié.

N’invente aucun résultat de test.

## 19. Limiter la portée des modifications

Ne modifie que les fichiers nécessaires à la tâche.

Ne profite pas d’une correction pour :

* renommer des composants non concernés ;
* reformater tout le projet ;
* déplacer plusieurs dossiers ;
* modifier l’architecture ;
* remplacer le design system ;
* mettre à jour toutes les dépendances ;
* corriger des problèmes sans rapport avec la demande.

Si tu découvres un autre problème, signale-le séparément sans le corriger automatiquement, sauf s’il bloque directement la tâche actuelle.

## 20. Compte rendu de fin de tâche

À la fin de chaque tâche, indique clairement :

1. la cause du problème lorsqu’elle a été identifiée ;
2. les fichiers créés ou modifiés ;
3. les changements effectués ;
4. les vérifications exécutées ;
5. les résultats des vérifications ;
6. les éléments qui n’ont pas pu être vérifiés ;
7. les éventuels risques ou points restant à surveiller.

Ne donne pas une confirmation générale comme « tout fonctionne » sans fournir les vérifications correspondantes.



## 21. Message de commit à la fin de chaque tâche

À la fin de chaque tâche terminée, propose toujours un message de commit Git clair, court et fidèle aux modifications réellement effectuées.

Le message de commit doit :

* être rédigé en français ;
* décrire uniquement les changements de la tâche actuelle ;
* être précis ;
* éviter les formulations vagues comme `mise à jour`, `modifications` ou `corrections diverses` ;
* ne pas mentionner des changements qui n’ont pas été effectués ;
* utiliser de préférence un préfixe Conventional Commits adapté.

Préfixes recommandés :

* `feat:` pour une nouvelle fonctionnalité ;
* `fix:` pour une correction ;
* `refactor:` pour une réorganisation interne sans changement fonctionnel ;
* `style:` pour une modification uniquement visuelle ou de formatage ;
* `docs:` pour la documentation ;
* `test:` pour les tests ;
* `chore:` pour la configuration, les dépendances ou la maintenance ;
* `perf:` pour une amélioration des performances.

Exemples :

```text
fix: restaurer le chargement des styles globaux
```

```text
feat: ajouter une page d’erreur personnalisée
```

```text
refactor: centraliser la gestion des erreurs API
```

```text
style: harmoniser l’affichage mobile du tableau de bord
```

Le message de commit doit être affiché dans une section distincte du compte rendu final :

```text
Message de commit proposé :

fix: restaurer le style de la page d’accueil
```

Ne fournis aucune commande Git.

Ne propose notamment pas :

```text
git add
```

```text
git commit
```

```text
git push
```

```text
git status
```

Ne mets jamais le message de commit dans une commande shell.

Fournis uniquement le texte du message de commit, prêt à être copié.

Si plusieurs changements appartiennent clairement à une même tâche, propose un seul message de commit synthétique.

Si les changements sont réellement indépendants et nécessitent plusieurs commits, propose plusieurs messages séparés, sans fournir les commandes Git correspondantes.


8. un message de commit(en francais) proposé, sans aucune commande Git.



## 22. Mise à jour de la documentation des API consommées

Le fichier :

```text
docs/frontend-consumed-apis.md
```

est la référence des API consommées par le frontend.

À chaque tâche, vérifie si les modifications impactent les échanges entre le frontend et le backend.

Cela inclut notamment :

* l'ajout d'un nouvel endpoint ;
* la suppression d'un endpoint ;
* la modification d'une URL ;
* la modification d'une méthode HTTP (`GET`, `POST`, `PUT`, `PATCH`, `DELETE`, etc.) ;
* la modification des paramètres de requête ;
* la modification des paramètres de chemin (`path parameters`) ;
* la modification des en-têtes requis ;
* la modification du format du corps de la requête ;
* la modification du format de la réponse ;
* l'ajout, la suppression ou la modification de champs dans les objets JSON ;
* la modification des codes de réponse HTTP ;
* l'ajout de nouvelles règles métier ayant un impact sur les échanges avec l'API.

Si une de ces modifications est effectuée, mets obligatoirement à jour :

```text
docs/frontend-consumed-apis.md
```

La documentation doit toujours refléter exactement l'état actuel du frontend.

Ne laisse jamais ce fichier en retard par rapport au code.

Si la tâche ne modifie aucune consommation d'API, indique explicitement dans le compte rendu final :

```text
Documentation des API : aucune mise à jour nécessaire.
```

Sinon, indique :

* les sections de la documentation mises à jour ;
* les endpoints ajoutés, modifiés ou supprimés ;
* les principales modifications apportées à la documentation.

Ne termine pas une tâche impactant les API sans avoir vérifié la cohérence entre le code et `docs/frontend-consumed-apis.md`.

# Audit UI/UX de Kisinet

## 1. Résumé exécutif

Kisinet possède une base frontend saine et lisible, avec des pages fonctionnelles, une architecture Next.js App Router simple et des tokens Tailwind de départ dans `app/globals.css` et `tailwind.config.ts`. L’interface reste toutefois trop proche d’un template d’administration générique : beaucoup de cartes blanches, de bordures grises, de titres similaires, de boutons textuels et de tableaux scrollables. Le domaine pharmaceutique est présent dans les libellés, mais peu dans l’expérience visuelle, les priorités métier, les icônes, les états critiques et les parcours quotidiens.

L’audit est basé sur l’analyse statique du code réellement présent. Aucun fichier existant n’a été modifié. Le responsive et le mode sombre ont été évalués par les classes, grilles, breakpoints et tokens, sans validation visuelle dans un navigateur.

Note générale du design : 56/100.

## 2. Évaluation globale

| Critère | Note /10 |
| --- | ---: |
| Première impression | 5 |
| Identité visuelle | 4 |
| Palette de couleurs | 5 |
| Typographie | 5 |
| Hiérarchie visuelle | 5 |
| Navigation | 5 |
| Tableau de bord | 6 |
| Tableaux | 5 |
| Formulaires | 6 |
| Responsive | 6 |
| Accessibilité | 5 |
| Cohérence | 5 |
| Maintenabilité du code UI | 5 |
| Mode sombre | 4 |
| Qualité globale | 6 |

Note générale : 56/100.

## 3. Points forts actuels

- Le CSS global est correctement chargé depuis `app/layout.tsx` avec `import "./globals.css"`.
- Les tokens `app-background`, `app-surface`, `app-card`, `app-border`, `app-text` et `app-muted` existent déjà dans `app/globals.css` et `tailwind.config.ts`.
- Les pages métier utilisent une structure récurrente facile à comprendre : en-tête, résumé, filtres, liste, états.
- Les composants `Button`, `LinkButton`, `ConfirmDialog`, `LoadingBubble`, `FeatureCard`, `AppErrorScreen` donnent une première base de design system.
- Plusieurs pages ont des états de chargement, vides, interdits et erreurs : `dashboard`, `products`, `stock`, `invoices`, `human-resources`, `select-pharmacy`.
- Les tailles de zones cliquables sont souvent correctes grâce à `min-h-10` et `min-h-11`.
- Les formulaires de produit et stock utilisent des labels visibles, pas seulement des placeholders.

## 4. Problèmes critiques

- Identifiant : UI-001
- Niveau de priorité : critique
- Page concernée : Annuaire public des pharmacies
- Fichier concerné : `app/pharmacies/page.tsx`
- Composant concerné : message d’erreur de la liste publique
- Description précise : la classe `border-danger/30 bg-danger/10 text-danger` est utilisée, mais la couleur `danger` n’est pas définie dans `tailwind.config.ts`.
- Impact utilisateur : l’erreur peut apparaître sans traitement visuel clair, ce qui réduit la compréhension en cas d’échec API.
- Impact visuel : incohérence avec les autres erreurs qui utilisent `red-*` ou `error`.
- Impact technique : classe Tailwind non générée ou sans effet, dette de token.
- Cause probable : mélange entre un nom de token prévu et la palette réellement déclarée.
- Recommandation : remplacer par le token existant `error` ou créer un alias `danger` documenté.
- Exemple concret de correction : utiliser `border-error/30 bg-error/10 text-error` après ajout d’une échelle `error`, ou rester sur `border-red-200 bg-red-50 text-red-700`.
- Niveau d’effort : faible

- Identifiant : UI-002
- Niveau de priorité : critique
- Page concernée : mode sombre global
- Fichier concerné : `app/globals.css`, `app/layout.tsx`, `components/layout/public-layout.tsx`, `components/layout/app-layout.tsx`
- Composant concerné : thème global
- Description précise : la classe `.dark` existe, mais aucun provider, toggle ou initialisation de thème n’est visible. Le commentaire indique même que la classe permettra d’activer le thème sombre plus tard.
- Impact utilisateur : les utilisateurs ne peuvent pas réellement choisir le thème sombre depuis l’interface.
- Impact visuel : promesse de mode sombre partielle, avec rendu non garanti.
- Impact technique : tokens sombres disponibles mais non orchestrés.
- Cause probable : design system commencé avant l’implémentation du thème.
- Recommandation : créer un `ThemeProvider` simple et persistant, puis auditer les composants qui utilisent des couleurs fixes.
- Exemple concret de correction : ajouter une classe `dark` au document selon `localStorage` et préférences système, puis exposer un bouton dans les layouts.
- Niveau d’effort : moyen

- Identifiant : UI-003
- Niveau de priorité : critique
- Page concernée : nouvelle vente
- Fichier concerné : `app/app/pharmacies/[pharmacyId]/sales/create/page.tsx`
- Composant concerné : `ProductSearch`, `SaleDraft`, `TextInput`, `SelectInput`, `AiScannerPlaceholder`
- Description précise : plusieurs champs et blocs utilisent `bg-white`, `bg-cyan-50`, `bg-orange-50`, `bg-red-50` sans variantes sombres.
- Impact utilisateur : en thème sombre, les champs et panneaux peuvent devenir trop lumineux ou incohérents.
- Impact visuel : rupture forte avec `bg-app-card` et `bg-app-surface`.
- Impact technique : styles non centralisés et difficiles à corriger page par page.
- Cause probable : composants de formulaire créés localement au lieu de primitives partagées.
- Recommandation : remplacer les couleurs fixes par des tokens `app-*` et des variantes d’état compatibles sombre.
- Exemple concret de correction : `bg-white` devient `bg-app-surface`; les alertes utilisent un composant `Alert` avec variantes `warning`, `error`, `info`.
- Niveau d’effort : moyen

- Identifiant : UI-004
- Niveau de priorité : critique
- Page concernée : navigation applicative
- Fichier concerné : `components/layout/app-layout.tsx`
- Composant concerné : `AppNavbar`, `DesktopNav`, `MobileNav`
- Description précise : la navigation métier est une barre horizontale avec 8 entrées, pas une sidebar. Les libellés sont longs, il n’y a presque pas d’icônes, pas de regroupement métier visible, pas de nom de pharmacie affiché dans la barre.
- Impact utilisateur : l’utilisateur comprend moins vite où il se trouve, quelle pharmacie est active et quelles zones sont prioritaires.
- Impact visuel : l’application ressemble à une navigation de site public plutôt qu’à un SaaS métier.
- Impact technique : la barre peut saturer aux largeurs proches de `1024px` et dépend d’un menu mobile séparé.
- Cause probable : réutilisation d’un pattern de navbar plutôt qu’un shell applicatif SaaS.
- Recommandation : créer un vrai shell métier avec sidebar desktop, topbar contextuelle, pharmacie active, actions rapides et navigation groupée.
- Exemple concret de correction : groupes `Pilotage`, `Catalogue`, `Opérations`, `Administration` avec icônes cohérentes et état actif plus marqué.
- Niveau d’effort : élevé

- Identifiant : UI-005
- Niveau de priorité : critique
- Page concernée : modales de stock et factures
- Fichier concerné : `app/app/pharmacies/[pharmacyId]/stock/page.tsx`, `app/app/pharmacies/[pharmacyId]/invoices/page.tsx`
- Composant concerné : `MovementDetailDialog`, `InvoiceDetailDialog`, `InvoicePaymentDialog`
- Description précise : les modales ont `role="dialog"` dans certains cas mais pas toutes, aucun focus trap visible, pas de gestion Escape systématique, overlay parfois implémenté comme bouton plein écran.
- Impact utilisateur : navigation clavier fragile, risque de focus derrière la modale.
- Impact visuel : comportement moins professionnel dans les workflows critiques.
- Impact technique : logique modale dupliquée et non centralisée.
- Cause probable : modales locales créées au fil des pages.
- Recommandation : centraliser une primitive `Dialog` accessible, réutilisée par stock, factures, permissions et confirmations.
- Exemple concret de correction : composant partagé avec `aria-modal`, focus initial, fermeture Escape, scroll interne et footer fixe.
- Niveau d’effort : moyen

## 5. Problèmes majeurs

- Identifiant : UI-006
- Niveau de priorité : élevé
- Page concernée : tableau de bord pharmacie
- Fichier concerné : `components/dashboard/pharmacy-dashboard.tsx`
- Composant concerné : `StatCard`, `Panel`, `SalesBars`, `AlertItem`
- Description précise : le dashboard empile des cartes similaires sans récit métier fort. Les urgences stock, péremption, factures impayées et chiffre du jour ont presque le même poids.
- Impact utilisateur : les décisions urgentes ne ressortent pas assez.
- Impact visuel : hiérarchie plate, sensation de dashboard générique.
- Impact technique : composants locaux non réutilisables ailleurs.
- Cause probable : approche “cartes d’indicateurs” standard.
- Recommandation : créer une zone prioritaire “À traiter aujourd’hui”, puis des indicateurs secondaires plus compacts.
- Exemple concret de correction : une carte critique pleine largeur pour ruptures/péremptions, puis KPI compacts en ligne.
- Niveau d’effort : moyen

- Identifiant : UI-007
- Niveau de priorité : élevé
- Page concernée : produits, factures, stock, ventes
- Fichier concerné : `app/app/pharmacies/[pharmacyId]/products/page.tsx`, `app/app/pharmacies/[pharmacyId]/invoices/page.tsx`, `app/app/pharmacies/[pharmacyId]/stock/page.tsx`, `app/app/pharmacies/[pharmacyId]/sales/create/page.tsx`
- Composant concerné : tableaux et listes métier
- Description précise : chaque page crée son propre tableau, sa propre pagination, ses badges et ses actions. Les largeurs minimales `min-w-[680px]`, `min-w-[760px]`, `min-w-[1080px]` forcent le scroll horizontal.
- Impact utilisateur : lecture difficile sur tablette et mobile, comportement différent selon les modules.
- Impact visuel : manque de maturité SaaS, densité mal maîtrisée.
- Impact technique : duplication importante, corrections futures coûteuses.
- Cause probable : absence de primitive `DataTable`.
- Recommandation : créer `DataTable`, `MobileRecordCard`, `Pagination`, `TableActions`.
- Exemple concret de correction : transformer les factures en tableau desktop dense et en cartes mobiles structurées par statut, montant et action primaire.
- Niveau d’effort : élevé

- Identifiant : UI-008
- Niveau de priorité : élevé
- Page concernée : produits
- Fichier concerné : `app/app/pharmacies/[pharmacyId]/products/page.tsx`
- Composant concerné : `ProductFiltersPanel`
- Description précise : les filtres avancés affichent jusqu’à 16 champs dans une seule carte.
- Impact utilisateur : recherche intimidante, surtout pour un utilisateur non technique.
- Impact visuel : bloc massif qui prend le dessus sur la liste.
- Impact technique : logique de filtres locale difficile à réutiliser.
- Cause probable : ajout exhaustif de filtres sans hiérarchisation.
- Recommandation : séparer recherche principale, filtres fréquents et tiroir de filtres avancés.
- Exemple concret de correction : ligne principale `Recherche`, `Stock`, `Catégorie`, `Tri`; autres filtres dans un drawer.
- Niveau d’effort : moyen

- Identifiant : UI-009
- Niveau de priorité : élevé
- Page concernée : ressources humaines
- Fichier concerné : `app/app/pharmacies/[pharmacyId]/settings/human-resources/page.tsx`
- Composant concerné : `ActionSelect`, `PermissionsModal`
- Description précise : les actions critiques sont dans un `<select>` et la suppression utilise `window.confirm`.
- Impact utilisateur : actions difficiles à scanner, confirmation peu intégrée, risque de confusion.
- Impact visuel : interaction datée, moins crédible qu’un menu d’actions contrôlé.
- Impact technique : comportement natif peu personnalisable, accessibilité et états incohérents.
- Cause probable : choix simple mais peu adapté aux actions métier sensibles.
- Recommandation : remplacer par un menu d’actions partagé et `ConfirmDialog`.
- Exemple concret de correction : bouton “Actions” avec menu, puis confirmation Kisinet pour supprimer.
- Niveau d’effort : moyen

- Identifiant : UI-010
- Niveau de priorité : élevé
- Page concernée : accueil publique
- Fichier concerné : `app/page.tsx`
- Composant concerné : hero, `ProductShowcase`, sections marketing
- Description précise : la page vend Kisinet avec une maquette interne simple, mais peu d’éléments visuels identitaires, pas d’image réelle ou illustration forte du domaine pharmaceutique.
- Impact utilisateur : première impression sérieuse mais peu mémorable.
- Impact visuel : ressemble à une landing page SaaS générique.
- Impact technique : plusieurs composants marketing locaux au lieu de sections réutilisables.
- Cause probable : identité visuelle construite uniquement avec cartes et textes.
- Recommandation : introduire une direction artistique pharmaceutique légère : signalétique, pictogrammes santé, alertes métier, aperçu opérationnel plus crédible.
- Exemple concret de correction : hero avec tableau de bord compact montrant stock critique, péremption, caisse du jour et pharmacie active.
- Niveau d’effort : moyen

## 6. Problèmes mineurs

- Identifiant : UI-011
- Niveau de priorité : moyen
- Page concernée : navigation
- Fichier concerné : `components/layout/app-layout.tsx`
- Composant concerné : `appNavItems`
- Description précise : certains libellés sont au singulier ou peu naturels : `Facture`, `Notification`, `Dashboard`.
- Impact utilisateur : micro-friction linguistique.
- Impact visuel : impression moins soignée.
- Impact technique : aucun risque majeur.
- Cause probable : libellés ajoutés progressivement.
- Recommandation : harmoniser en français métier : `Tableau de bord`, `Factures`, `Notifications`.
- Exemple concret de correction : renommer les labels sans changer les routes.
- Niveau d’effort : faible

- Identifiant : UI-012
- Niveau de priorité : moyen
- Page concernée : formulaires
- Fichier concerné : `app/app/pharmacies/[pharmacyId]/products/create/page.tsx`, `app/app/pharmacies/[pharmacyId]/settings/details/page.tsx`, `app/app/pharmacies/create/page.tsx`
- Composant concerné : champs locaux
- Description précise : les champs obligatoires sont indiqués dans le texte du label avec `*`, sans convention visuelle partagée ni aide claire.
- Impact utilisateur : erreurs possibles dans les formulaires longs.
- Impact visuel : rendu inégal selon les pages.
- Impact technique : validation et accessibilité dispersées.
- Cause probable : absence de composant `FormField`.
- Recommandation : centraliser label, aide, erreur, requis et description.
- Exemple concret de correction : `FormField label="Prix de vente" required error={...}` avec `aria-describedby`.
- Niveau d’effort : moyen

- Identifiant : UI-013
- Niveau de priorité : faible
- Page concernée : global
- Fichier concerné : `app/globals.css`
- Composant concerné : typographie globale
- Description précise : le projet utilise `Arial, Helvetica, sans-serif`, sans police d’interface distinctive.
- Impact utilisateur : lisible, mais peu premium.
- Impact visuel : sensation générique.
- Impact technique : faible.
- Cause probable : choix système minimal.
- Recommandation : adopter une police moderne de type Inter, Geist ou Source Sans 3 selon contraintes de chargement.
- Exemple concret de correction : intégrer `next/font` dans `app/layout.tsx` et définir une variable CSS.
- Niveau d’effort : faible

## 7. Audit de l’identité visuelle

L’identité actuelle est sobre mais faible. Les pages disent “pharmacie”, mais la structure visuelle dit surtout “admin Tailwind”. Les couleurs, cartes, boutons et tableaux ne créent pas encore un univers propre à Kisinet.

Le logo est présent dans `public/kisinet-logo.png` via `components/layout/public-layout.tsx` et `components/layout/app-layout.tsx`, mais il reste petit et ne pilote pas vraiment la direction visuelle. L’application gagnerait à utiliser un langage de santé opérationnelle : stock sûr, péremption, traçabilité, caisse, confiance, contrôle.

## 8. Audit de la typographie

La typographie est lisible mais peu distinctive. Les titres principaux sont souvent `text-3xl font-bold`, les sections `text-lg font-bold`, les métadonnées `text-sm` ou `text-xs`. Cette répétition crée une hiérarchie régulière mais plate.

Les tableaux utilisent beaucoup de `text-xs`, `font-semibold`, `uppercase`, parfois avec `tracking-wide`, ce qui peut fatiguer dans des données longues comme références, montants et statuts. Les pages publiques utilisent parfois des tailles plus ambitieuses, mais l’application interne reste très uniforme.

Recommandation : définir une échelle stricte : page title 28-32 px, section title 18-20 px, table body 13-14 px, metadata 12 px, chiffres KPI 24-30 px selon importance.

## 9. Audit des couleurs

La palette actuelle repose sur le bleu Tailwind, vert succès, cyan info, orange warning et rouge erreur. Elle est correcte mais standard. Le texte principal `#0F172A` donne de la solidité, mais utilisé partout il durcit l’interface et renforce le côté générique.

Couleurs trop dominantes : bleu `primary-600` / `#2563EB`, blanc pur `#FFFFFF`, gris bleuté `#F8FAFC`.

Couleurs mal utilisées : `danger` non défini dans `app/pharmacies/page.tsx`; `green-*`, `red-*`, `cyan-*`, `orange-*`, `slate-*` codés en dur dans plusieurs pages; `bg-white` dans des composants qui devraient utiliser `app-surface`.

Couleurs utiles à conserver : vert succès pour stock disponible et validation; orange pour seuils, péremption proche et attention; rouge pour erreurs et actions destructives; cyan seulement pour information secondaire.

## 10. Audit des espacements

L’espacement est cohérent dans les grandes lignes : `px-4 sm:px-6 lg:px-8`, `py-8`, `gap-4`, `gap-6`, `p-5`, `p-6`. Le problème vient de la répétition : presque toutes les pages ont le même rythme, ce qui aplatit la hiérarchie.

Les formulaires longs comme `products/create` sont lisibles mais très verticaux. Les filtres produits sont trop denses lorsqu’ils sont avancés. Le dashboard utilise beaucoup de cartes de taille similaire, ce qui ne guide pas assez l’œil.

## 11. Audit de la navigation

La navigation publique est claire, mais l’application interne manque d’un shell SaaS robuste. `components/layout/app-layout.tsx` utilise une navbar horizontale et un menu mobile. Pour une gestion de pharmacie, une sidebar desktop serait plus professionnelle et plus efficace.

L’utilisateur ne voit pas suffisamment la pharmacie active dans la navigation globale. Les permissions désactivent des entrées, mais les états désactivés sont gris fixes (`slate-*`) et peu compatibles avec le thème. Les actions secondaires comme `Fermer la pharmacie`, `Aide`, `Déconnexion` sont mélangées dans le même panneau.

## 12. Audit du tableau de bord

`components/dashboard/pharmacy-dashboard.tsx` couvre les bonnes données : produits, stock faible, ruptures, ventes du jour, chiffre du jour, employés, alertes, ventes récentes, activité. Le contenu métier est pertinent.

La présentation manque toutefois de priorisation. Les urgences devraient ressortir avant les KPI. Les graphiques sont très simples (`SalesBars`) et ne donnent pas encore une impression de produit analytique moderne. Le dashboard doit devenir une “tour de contrôle” : quoi vendre, quoi commander, quoi encaisser, quoi traiter aujourd’hui.

## 13. Audit des tableaux

Les tableaux sont fonctionnels mais fragmentés. Les factures ont un tableau desktop et des cartes mobiles dédiées, ce qui est une bonne direction. Les produits et stock utilisent des grilles simulant des tableaux, avec passage en cartes sur mobile. La vente utilise un vrai tableau avec `min-w-[760px]`.

Les problèmes principaux sont la duplication, les largeurs minimales, l’absence de tri visuel, la densité irrégulière, les actions textuelles dispersées, et des badges redéfinis localement.

Tableaux à simplifier ou restructurer en priorité : factures, produits, brouillon de vente, mouvements de stock, membres.

## 14. Audit des formulaires

Les labels sont présents et les champs sont globalement compréhensibles. Le formulaire d’ajout produit est simple pour démarrer, mais les champs ne sont pas regroupés par logique métier visible : identité, classification, prix, stock. Les messages d’erreur sont affichés, mais pas toujours reliés avec `aria-describedby`.

Les formulaires de stock et encaissement sont plus proches d’un workflow métier. Ils doivent toutefois utiliser une primitive commune pour champs, aide, erreurs, montants et sélecteurs.

## 15. Audit des boutons et actions

Les boutons principaux et secondaires sont cohérents grâce à `components/ui/button.tsx` et `components/ui/link-button.tsx`, mais beaucoup de pages recodent les classes de boutons localement. Les variantes nécessaires manquent : destructive, success, ghost, icon, loading, compact.

La page vente utilise le vert pour `Ajouter` et `Créer la facture`, ce qui peut être logique, mais l’action primaire système reste bleue ailleurs. Il faut clarifier : bleu pour navigation/commande, vert pour validation opérationnelle, rouge pour destruction.

## 16. Audit des modales et menus

`ConfirmDialog` est une bonne base. Les modales locales de stock, factures et permissions ne sont pas harmonisées. Certaines ont de bons attributs ARIA, d’autres moins. Les menus d’actions sont parfois des dropdowns custom, parfois des `<select>`, parfois des boutons directs.

Il faut créer une couche partagée : `Dialog`, `Drawer`, `DropdownMenu`, `Toast`, `ActionMenu`.

## 17. Audit du responsive design

Analyse par breakpoints demandés :

- 320 px : les boutons empilés fonctionnent souvent, mais les tableaux avec `min-w-*` imposent un scroll horizontal; les modales sans scroll interne complet peuvent être serrées.
- 375 px : la plupart des cartes restent lisibles; les menus fixes de `AppLayout` et `PublicLayout` restent utilisables.
- 425 px : les listes mobiles produits, factures, membres sont acceptables.
- 640 px : plusieurs layouts passent en `sm:flex-row` ou `sm:grid-cols-2`; risque de rupture visuelle entre 610 px et 640 px pour boutons et cartes.
- 768 px : certains tableaux restent en cartes jusqu’à `lg`, ce qui est prudent mais peut gaspiller l’espace tablette.
- 1024 px : la navbar desktop apparaît avec beaucoup d’entrées, risque de saturation.
- 1280 px : les pages en `max-w-7xl` sont confortables.
- 1440 px : bonne largeur, mais beaucoup de cartes restent visuellement pauvres.
- 1920 px : `max-w-7xl` évite l’étirement, mais l’interface peut paraître vide et peu immersive.

## 18. Audit de l’accessibilité

Points positifs : labels visibles, `aria-label` sur certains boutons icônes, `role="dialog"` sur certaines modales, tailles de boutons souvent suffisantes.

Risques WCAG : focus trap absent dans les modales locales, messages d’erreur de champs non reliés aux inputs, dépendance à la couleur dans les badges, contraste des tons clairs en mode sombre non vérifié, menus custom sans navigation clavier complète, `alt=""` sur le logo alors que le texte Kisinet voisin compense partiellement.

## 19. Audit du mode sombre

Le mode sombre est incomplet. Les tokens existent, mais l’activation n’est pas implémentée. Plusieurs composants utilisent `bg-white`, `bg-red-50`, `bg-orange-50`, `bg-cyan-50`, `bg-slate-100`, ce qui rendrait le thème sombre incohérent.

Priorité : rendre tous les composants internes dépendants de tokens sémantiques, puis ajouter un provider de thème.

## 20. Audit du design system

Le projet possède une intention de design system, pas encore un système complet. Les composants partagés actuels sont trop peu nombreux pour absorber la complexité de l’application.

À centraliser : boutons, liens-boutons, champs, selects, textareas, alertes, badges, toasts, modales, menus d’actions, cartes KPI, panneaux, tableaux, pagination, états vides, squelettes, en-têtes de page.

## 21. Audit de la qualité du code UI

Les classes Tailwind sont nombreuses et souvent répétées. Les pages longues comme `sales/create`, `invoices`, `human-resources`, `settings/details`, `pharmacies/page` contiennent beaucoup de composants locaux. Cela facilite l’apprentissage initial, mais freine l’harmonisation.

Les valeurs arbitraires sont raisonnables mais révélatrices : `min-w-[1080px]`, `xl:grid-cols-[1fr_360px]`, `top-24`, `z-[1100]`. Elles devraient devenir des conventions de layout.

## 22. Pages nécessitant une refonte complète

- `components/layout/app-layout.tsx` : passer d’une navbar horizontale à un shell SaaS métier.
- `app/page.tsx` : renforcer la première impression, l’identité pharmaceutique et la preuve produit.
- `components/dashboard/pharmacy-dashboard.tsx` : transformer le dashboard en centre de décision.
- `app/app/pharmacies/[pharmacyId]/sales/create/page.tsx` : revoir le workflow caisse, panier, résumé et scan.
- `app/app/pharmacies/[pharmacyId]/invoices/page.tsx` : restructurer tableau, encaissement, statuts et détails.

## 23. Pages nécessitant des améliorations partielles

- `app/app/pharmacies/[pharmacyId]/products/page.tsx` : filtres, table, actions, badges.
- `app/app/pharmacies/[pharmacyId]/products/create/page.tsx` : regroupement du formulaire et composants partagés.
- `app/app/pharmacies/[pharmacyId]/stock/page.tsx` : formulaire, historique, dialog.
- `app/app/pharmacies/[pharmacyId]/settings/human-resources/page.tsx` : actions, permissions, confirmation.
- `app/app/select-pharmacy/page.tsx` : cartes pharmacie plus informatives et plus distinctives.
- `app/pharmacies/page.tsx` : correction du token `danger`, filtres et cartes publiques.
- `app/error.tsx`, `app/global-error.tsx`, `app/not-found.tsx` : conserver, améliorer légèrement l’identité visuelle.

## 24. Composants à conserver

- `components/ui/button.tsx` : bonne base à étendre.
- `components/ui/link-button.tsx` : bonne base à fusionner conceptuellement avec les variantes de bouton.
- `components/ui/confirm-dialog.tsx` : à conserver et renforcer.
- `components/ui/loading-bubble.tsx` : simple et réutilisable.
- `components/app-error-screen.tsx` : robuste pour les erreurs globales.
- `components/layout/site-footer.tsx` : correct pour les pages publiques.
- `components/pharmacies/join-request-modal.tsx` : logique utile, à harmoniser avec `Dialog`.

## 25. Composants à supprimer ou remplacer

- Remplacer les `StatusBadge` locaux du dashboard, factures, membres, notifications, vente par un `Badge` partagé.
- Remplacer les `PaginationControls` locaux par un composant `Pagination`.
- Remplacer les modales locales de stock et factures par `Dialog`.
- Remplacer `ActionSelect` dans `human-resources` par un `ActionMenu`.
- Remplacer les champs locaux `TextInput`, `FilterInput`, `SelectInput`, `TextField`, `NumberField` par des primitives de formulaire.

## 26. Composants partagés à créer

- `PageHeader` : titre, contexte pharmacie, description, actions.
- `AppShell` : sidebar, topbar, menu mobile, pharmacie active.
- `KpiCard` : valeur, tendance, état, aide courte.
- `Panel` : surface standard avec titre, action optionnelle et densité.
- `DataTable` : colonnes, actions, état vide, pagination, version mobile.
- `Badge` : variantes `neutral`, `success`, `warning`, `danger`, `info`.
- `Alert` : messages utilisateur compatibles clair/sombre.
- `FormField`, `TextInput`, `Select`, `Textarea`, `MoneyInput`.
- `Dialog`, `Drawer`, `DropdownMenu`, `Toast`.
- `EmptyState` : titre, description, action, illustration optionnelle légère.

## 27. Palette de couleurs recommandée

Palette proposée, plus médicale, moins générique, sans multiplier les couleurs :

| Rôle | Hex | Usage |
| --- | --- | --- |
| Primary 50 | `#EAF7F5` | fonds actifs doux |
| Primary 100 | `#CFEDEA` | focus, badges faibles |
| Primary 500 | `#1BAA9A` | accent santé Kisinet |
| Primary 600 | `#0F8F82` | boutons principaux |
| Primary 700 | `#0B6F66` | hover et textes actifs |
| Ink 900 | `#102027` | texte principal moins dur que `#0F172A` |
| Ink 600 | `#52616B` | texte secondaire |
| Background | `#F6F8FA` | fond application |
| Surface | `#FFFFFF` | panneaux |
| Border | `#DDE5EA` | séparateurs |
| Success | `#138A5B` | validation, stock sûr |
| Warning | `#B7791F` | péremption, seuil faible |
| Danger | `#C2413B` | erreurs, destruction |
| Info | `#247BA0` | aide et contexte |

Mode sombre recommandé :

| Rôle | Hex |
| --- | --- |
| Background | `#071316` |
| Surface | `#0D1E22` |
| Card | `#12272C` |
| Border | `#244047` |
| Text | `#F3FAFA` |
| Muted | `#9BB0B5` |
| Primary | `#35C7B5` |

## 28. Typographie recommandée

Police recommandée : `Inter` ou `Geist Sans` via `next/font`, avec fallback système. Pour une app utilisée quotidiennement en pharmacie, la priorité est la lisibilité, pas l’effet décoratif.

Échelle recommandée :

- Titre page : 30 px, `font-semibold` ou `font-bold`.
- Titre section : 18-20 px.
- Corps : 14 px.
- Table dense : 13-14 px.
- Label : 13 px, `font-medium`.
- Métadonnée : 12 px.
- KPI principal : 28-32 px.

## 29. Règles visuelles recommandées

- Une action principale visible par écran.
- Les alertes métier critiques doivent apparaître avant les indicateurs décoratifs.
- Bleu/vert primaire pour action normale, vert seulement pour validation opérationnelle, rouge seulement pour danger.
- Maximum trois niveaux de carte par écran : page, panel, item.
- Pas de nouvelles couleurs hors tokens.
- Rayon standard : 8 px pour cartes et champs; 999 px uniquement pour badges.
- Tableaux desktop denses; cartes mobiles dédiées.
- Tous les champs doivent avoir label, aide optionnelle, erreur reliée et état désactivé.

## 30. Proposition de nouvelle direction artistique

Direction : “pharmacie sous contrôle”. Kisinet doit paraître rapide, fiable et proche du terrain : stock, caisse, péremption, responsabilités, traçabilité.

Visuellement, cela signifie : une base claire, des accents vert-teal médicaux, des alertes bien hiérarchisées, des tableaux sobres, des icônes métier cohérentes, et des écrans qui montrent immédiatement les décisions importantes. L’interface doit rester légère pour les connexions et machines modestes en RDC et en Afrique : peu d’animations lourdes, peu d’images décoratives, priorité à la lisibilité et à la rapidité.

## 31. Plan de refonte priorisé

Priorité 1 — Corrections critiques :

- Corriger le token `danger` non défini dans `app/pharmacies/page.tsx`.
- Remplacer les couleurs fixes qui cassent le mode sombre dans la vente, stock, factures et produits.
- Centraliser les modales critiques avec accessibilité minimale.
- Harmoniser les libellés de navigation.

Priorité 2 — Refonte visuelle principale :

- Refaire `AppLayout` en shell SaaS avec sidebar.
- Repenser le dashboard autour des urgences du jour.
- Moderniser la page de vente comme workflow de caisse.
- Renforcer la landing page avec une vraie preuve produit.

Priorité 3 — Harmonisation du design system :

- Créer `Badge`, `Alert`, `FormField`, `DataTable`, `Pagination`, `Dialog`, `Toast`, `ActionMenu`.
- Définir tokens couleur complets clair/sombre.
- Documenter les règles dans `docs/colors.md` ou un nouveau document design system.

Priorité 4 — Finitions :

- Ajouter micro-interactions sobres.
- Ajouter icônes métier cohérentes.
- Améliorer états vides avec illustrations légères.
- Affiner les transitions, focus et feedbacks.

## 32. Risques de la refonte

- Risque de casser les workflows API si la refonte mélange UI et logique métier.
- Risque de rendre l’application trop décorative au détriment de la rapidité.
- Risque de multiplier les composants partagés trop tôt.
- Risque de dégrader le mode sombre si les tokens ne sont pas traités avant les écrans.
- Risque de perdre la simplicité utile aux utilisateurs non techniques.

## 33. Critères d’acceptation

- La page `/` conserve son CSS, son responsive et une première impression plus distinctive.
- Le shell applicatif affiche clairement la pharmacie active et le module actif.
- Les pages dashboard, produits, stock, vente, factures et membres utilisent les mêmes primitives UI.
- Aucune classe de couleur non définie comme `danger` ne reste dans l’interface.
- Tous les composants nouveaux fonctionnent en clair et sombre.
- Les modales ont `role="dialog"`, `aria-modal`, fermeture clavier et focus maîtrisé.
- Les tableaux sont lisibles desktop et disposent d’une alternative mobile sans scroll horizontal inutile.
- Les messages d’erreur utilisateur ne montrent pas de détails techniques bruts.
- Les pages restent utilisables à 320, 375, 425, 640, 768, 1024, 1280, 1440 et 1920 px.

## 34. Conclusion

Kisinet est fonctionnel et construit sur une base compréhensible, mais son interface manque encore de personnalité, de hiérarchie métier et de cohérence systémique. La priorité n’est pas d’ajouter beaucoup de couleurs ou d’effets : il faut d’abord transformer l’application en véritable outil SaaS pharmaceutique, avec un shell clair, des composants partagés, des alertes métier fortes et un mode sombre réellement maîtrisé.

La refonte doit être progressive : corriger les incohérences critiques, poser les primitives, puis moderniser les écrans à fort impact. C’est la voie la plus réaliste pour rendre Kisinet plus attractif, crédible et agréable sans fragiliser les fonctionnalités existantes.

/**
 * Composants d'affichage partagés par la liste et la page détail des comptes de
 * paiement utilisateurs (espace admin).
 *
 * Ces composants sont uniquement visuels : ils n'effectuent aucun appel API et
 * n'exposent aucune action de modification, la section étant en lecture seule.
 */

import type { ReactNode } from "react";

// Badge Oui/Non utilisé pour les champs booléens (actif, principal, vérifié).
// Reprend le style des badges déjà utilisés dans les tableaux admin.
export function YesNoBadge({
  value,
  trueLabel = "Oui",
  falseLabel = "Non",
}: {
  value: boolean;
  trueLabel?: string;
  falseLabel?: string;
}) {
  return (
    <span
      className={`inline-flex rounded-md px-2.5 py-1 text-xs font-bold ${
        value ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"
      }`}
    >
      {value ? trueLabel : falseLabel}
    </span>
  );
}

// Ligne « libellé / valeur » utilisée dans les blocs d'information du détail.
export function DetailRow({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="min-w-0">
      <p className="text-xs font-semibold uppercase tracking-wide text-app-muted">{label}</p>
      <div className="mt-1 break-words text-sm font-semibold text-app-text">{value}</div>
    </div>
  );
}

// Bandeau rappelant que la section est consultable mais non modifiable.
export function ReadOnlyNotice({ children }: { children?: ReactNode }) {
  return (
    <div className="rounded-lg border border-app-border bg-app-surface p-4">
      <p className="text-sm font-semibold text-app-text">Section en lecture seule</p>
      <p className="mt-1 text-sm text-app-muted">
        {children ??
          "Les comptes de paiement des utilisateurs sont uniquement consultables ici : aucune création, modification ou suppression n’est possible depuis cette interface."}
      </p>
    </div>
  );
}

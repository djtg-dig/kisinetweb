// Liste statique minimale des pays de destination supportés par les retraits
// iKeePay. Le frontend ne doit pas inventer une cartographie exhaustive :
// cette liste couvre les principaux pays africains attendus et quelques
// génériques (CI/SN/CD/CM/etc.). Les codes sont ISO 3166-1 alpha-2.
//
// Si un nouveau pays doit être ajouté, mettre à jour cette constante.
// Aucun appel réseau n'est nécessaire ; le backend valide le code lors
// de la création du retrait.

export type CountryOption = {
  // Code ISO 3166-1 alpha-2 envoyé au backend (par exemple "CD").
  iso2: string;
  // Libellé humain affiché dans le select.
  label: string;
};

export const WITHDRAWAL_COUNTRIES: CountryOption[] = [
  { iso2: "CD", label: "République démocratique du Congo" },
  { iso2: "CI", label: "Côte d'Ivoire" },
  { iso2: "CM", label: "Cameroun" },
  { iso2: "SN", label: "Sénégal" },
  { iso2: "GA", label: "Gabon" },
  { iso2: "CG", label: "Congo" },
  { iso2: "BF", label: "Burkina Faso" },
  { iso2: "ML", label: "Mali" },
  { iso2: "TG", label: "Togo" },
  { iso2: "BJ", label: "Bénin" },
  { iso2: "KE", label: "Kenya" },
  { iso2: "UG", label: "Ouganda" },
  { iso2: "TZ", label: "Tanzanie" },
  { iso2: "RW", label: "Rwanda" },
  { iso2: "NG", label: "Nigeria" },
  { iso2: "GH", label: "Ghana" },
  { iso2: "FR", label: "France" },
];

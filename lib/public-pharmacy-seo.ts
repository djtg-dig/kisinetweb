import type { PharmacySummary } from "@/lib/api";

const DESCRIPTION_MAX_LENGTH = 155;

export function buildPublicPharmacyIntro(pharmacy: PharmacySummary) {
  return pharmacy.name + " est une pharmacie référencée sur Kisinet.";
}

export function buildPublicPharmacyMetadataTitle(pharmacy: PharmacySummary) {
  if (pharmacy.cityOrProvince) {
    return pharmacy.name + " | " + pharmacy.cityOrProvince;
  }

  return pharmacy.name;
}

export function buildPublicPharmacyMetadataDescription(pharmacy: PharmacySummary) {
  const publicDescription = cleanDescription(pharmacy.description);

  if (publicDescription) {
    return publicDescription;
  }

  const intro = buildPublicPharmacyIntro(pharmacy);

  if (intro) {
    return cleanDescription(intro + " Consultez ses informations publiques.");
  }

  return "Consultez les informations publiques de " + pharmacy.name + " sur Kisinet.";
}

export function buildLocationLabel(
  pharmacy: PharmacySummary,
  options: { includeNeighborhood?: boolean } = {},
) {
  const parts = [
    options.includeNeighborhood ? pharmacy.neighborhood : undefined,
    pharmacy.cityOrProvince,
    pharmacy.country,
  ];

  return parts.filter(Boolean).join(", ");
}

function cleanDescription(value?: string) {
  const description = value?.replace(/\s+/g, " ").trim();

  if (!description) {
    return "";
  }

  return description.length > DESCRIPTION_MAX_LENGTH
    ? description.slice(0, DESCRIPTION_MAX_LENGTH - 3).trimEnd() + "..."
    : description;
}

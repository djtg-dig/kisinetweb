export function serializeJsonLd(data: unknown): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}

const COUNTRY_ALPHA2: Record<string, string> = {
  cd: "CD",
  ci: "CI",
  cm: "CM",
  sn: "SN",
  ga: "GA",
  cg: "CG",
  bf: "BF",
  ml: "ML",
  tg: "TG",
  bj: "BJ",
  ke: "KE",
  ug: "UG",
  tz: "TZ",
  rw: "RW",
  ng: "NG",
  gh: "GH",
  fr: "FR",
};

const COUNTRY_NAME_TO_ALPHA2: Record<string, string> = {
  "rdc": "CD",
  "rd congo": "CD",
  "république démocratique du congo": "CD",
  "democratic republic of the congo": "CD",
  "côte d'ivoire": "CI",
  "cameroun": "CM",
  "sénégal": "SN",
  "gabon": "GA",
  "congo": "CG",
  "burkina faso": "BF",
  "mali": "ML",
  "togo": "TG",
  "bénin": "BJ",
  "kenya": "KE",
  "ouganda": "UG",
  "tanzanie": "TZ",
  "rwanda": "RW",
  "nigeria": "NG",
  "ghana": "GH",
  "france": "FR",
};

function normalizeCountryCode(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) {
    return trimmed;
  }

  const upper = trimmed.toUpperCase();
  if (COUNTRY_ALPHA2[upper]) {
    return COUNTRY_ALPHA2[upper];
  }

  const lower = trimmed.toLowerCase();
  if (COUNTRY_NAME_TO_ALPHA2[lower]) {
    return COUNTRY_NAME_TO_ALPHA2[lower];
  }

  return trimmed;
}

export function getHomeJsonLd(
  siteUrl: string,
  description: string,
  faqs: Array<{ question: string; answer: string }>,
) {
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        name: "Kisinet",
        url: siteUrl,
        description,
      },
      {
        "@type": "SoftwareApplication",
        name: "Kisinet",
        applicationCategory: "BusinessApplication",
        operatingSystem: "Web",
        url: siteUrl,
        description,
      },
      {
        "@type": "FAQPage",
        mainEntity: faqs.map((faq) => ({
          "@type": "Question",
          name: faq.question,
          acceptedAnswer: {
            "@type": "Answer",
            text: faq.answer,
          },
        })),
      },
    ],
  };
}

type PharmacyJsonLdInput = {
  name: string;
  reference?: string;
  description?: string;
  phoneNumber?: string;
  email?: string;
  street?: string;
  neighborhood?: string;
  cityOrProvince?: string;
  country?: string;
};

export function getPharmacyJsonLd(
  siteUrl: string,
  pharmacy: PharmacyJsonLdInput,
): Record<string, unknown> | null {
  const reference = pharmacy.reference?.trim();

  if (!reference) {
    return null;
  }

  const url = siteUrl + "/pharmacies/" + encodeURIComponent(reference);

  const data: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Pharmacy",
    name: pharmacy.name,
    url,
  };

  if (pharmacy.description) {
    data.description = pharmacy.description;
  }

  if (pharmacy.phoneNumber) {
    data.telephone = pharmacy.phoneNumber;
  }

  if (pharmacy.email) {
    data.email = pharmacy.email;
  }

  const address: Record<string, unknown> = {};

  if (pharmacy.street) {
    address.streetAddress = pharmacy.street;
  } else if (pharmacy.neighborhood) {
    address.streetAddress = pharmacy.neighborhood;
  }

  if (pharmacy.cityOrProvince) {
    address.addressLocality = pharmacy.cityOrProvince;
  }

  if (pharmacy.country) {
    address.addressCountry = normalizeCountryCode(pharmacy.country);
  }

  if (Object.keys(address).length > 0) {
    data.address = {
      "@type": "PostalAddress",
      ...address,
    };
  }

  return data;
}

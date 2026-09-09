export function serializeJsonLd(data: unknown): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
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
    address.addressCountry = pharmacy.country;
  }

  if (Object.keys(address).length > 0) {
    data.address = {
      "@type": "PostalAddress",
      ...address,
    };
  }

  return data;
}

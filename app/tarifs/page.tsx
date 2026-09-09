import type { Metadata } from "next";
import TarifsPageClient from "./page-client";

const title = "Tarifs du logiciel de gestion de pharmacie";
const description =
  "Consultez les tarifs et formules Kisinet pour choisir une solution adaptée à la gestion de votre pharmacie.";
const url = "https://kisinet.com/tarifs";

export const metadata: Metadata = {
  title,
  description,
  alternates: {
    canonical: url,
  },
  openGraph: {
    title,
    description,
    url,
    siteName: "Kisinet",
    locale: "fr_CD",
    type: "website",
  },
  twitter: {
    card: "summary",
    title,
    description,
  },
};

export default function TarifsPage() {
  return <TarifsPageClient />;
}

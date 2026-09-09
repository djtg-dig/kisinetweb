import type { Metadata } from "next";
import TarifsPageClient from "./page-client";
import { defaultOpenGraph, defaultTwitter } from "@/lib/server/metadata-og";

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
    ...defaultOpenGraph,
    title,
    description,
    url,
  },
  twitter: {
    ...defaultTwitter,
    title,
    description,
  },
};

export default function TarifsPage() {
  return <TarifsPageClient />;
}

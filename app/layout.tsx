import type { Metadata } from "next";
import { SalesChoicesBootstrap } from "@/components/sales/sales-choices-bootstrap";
import "./globals.css";

export const metadata: Metadata = {
  title: "Kisinet",
  description: "Plateforme moderne de gestion de pharmacies",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <body>
        <SalesChoicesBootstrap />
        {children}
      </body>
    </html>
  );
}

import type { Metadata } from "next";
import { SalesChoicesBootstrap } from "@/components/sales/sales-choices-bootstrap";
import { ThemeProvider } from "@/components/theme/theme-provider";
import "./globals.css";

export const metadata: Metadata = {
  title: "Kisinet",
  description: "Plateforme moderne de gestion de pharmacies",
  icons: {
    icon: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <body>
        <ThemeProvider>
          <SalesChoicesBootstrap />
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}

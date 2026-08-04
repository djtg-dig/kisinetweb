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
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var theme = localStorage.getItem('kisinet:theme') || 'system';
                  var root = document.documentElement;
                  if (theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
                    root.classList.add('dark');
                  }
                } catch (e) {}
              })();
            `,
          }}
        />
      </head>
      <body>
        <ThemeProvider>
          <SalesChoicesBootstrap />
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}

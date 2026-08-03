"use client";

import "./error-globals.css";
import { AppErrorScreen } from "@/components/app-error-screen";

type GlobalErrorPageProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function GlobalErrorPage({ error, reset }: GlobalErrorPageProps) {
  // Cette page remplace le layout racine en cas d'erreur globale.
  return (
    <html lang="fr">
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
        <AppErrorScreen error={error} reset={reset} />
      </body>
    </html>
  );
}

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
      <body>
        <AppErrorScreen error={error} reset={reset} />
      </body>
    </html>
  );
}

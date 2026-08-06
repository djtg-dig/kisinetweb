"use client";

import "./globals.css";
import { AppErrorScreen } from "@/components/app-error-screen";
import { ThemeProvider } from "@/components/theme/theme-provider";

type GlobalErrorPageProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

// Script d'initialisation exécuté avant le premier paint, identique à celui du
// layout racine, pour éviter tout flash de thème sur l'écran d'erreur. Cette
// page étant un Client Component, le serveur ne lit pas le cookie : le script
// lit lui-même le cookie (et localStorage en repli) et applique la classe "dark"
// avant l'affichage. Aucune logique métier ici.
const THEME_INIT_SCRIPT = `(function(){try{function g(k){var m=document.cookie.match(new RegExp("(?:^|; )"+k+"=([^;]+)"));return m?decodeURIComponent(m[1]):null;}var t=g("kisinet-theme")||(window.localStorage&&localStorage.getItem("kisinet:theme"))||"system";if(t!=="light"&&t!=="dark"&&t!=="system"){t="system";}var d=t==="dark"||(t==="system"&&window.matchMedia("(prefers-color-scheme: dark)").matches);var r=document.documentElement;if(d){r.classList.add("dark");}else{r.classList.remove("dark");}}catch(e){}})();`;

export default function GlobalErrorPage({ error, reset }: GlobalErrorPageProps) {
  // Cette page remplace le layout racine en cas d'erreur globale.
  return (
    <html lang="fr" suppressHydrationWarning>
      <body>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
        <ThemeProvider>
          <AppErrorScreen error={error} reset={reset} />
        </ThemeProvider>
      </body>
    </html>
  );
}

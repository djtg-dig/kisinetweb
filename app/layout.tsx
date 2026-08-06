import type { Metadata } from "next";
import { cookies } from "next/headers";
import { SalesChoicesBootstrap } from "@/components/sales/sales-choices-bootstrap";
import { ThemeProvider } from "@/components/theme/theme-provider";
import "./globals.css";

// Nom du cookie de thème. Partagé avec le ThemeProvider (qui l'écrit) et avec
// le script d'initialisation (qui le lit). Il permet au serveur de connaître le
// thème choisi pour le rendu SSR, afin d'éviter tout flash de thème.
const THEME_COOKIE = "kisinet-theme";

export const metadata: Metadata = {
  title: "Kisinet",
  description: "Plateforme moderne de gestion de pharmacies",
  icons: {
    icon: "/favicon.svg",
  },
};

// Script d'initialisation exécuté avant le premier paint (Next.js 15 le place
// dans <head>). Il détermine le thème à partir du cookie (ou, à défaut, de
// localStorage pour les utilisateurs ayant un thème enregistré avant l'ajout du
// cookie) et applique la classe "dark" sur <html> avant l'affichage. Aucune
// logique métier ici : il ne fait que poser la classe initiale pour supprimer
// le flash. Le ThemeProvider reprend la main après hydratation.
const THEME_INIT_SCRIPT = `(function(){try{function g(k){var m=document.cookie.match(new RegExp("(?:^|; )"+k+"=([^;]+)"));return m?decodeURIComponent(m[1]):null;}var t=g("kisinet-theme")||(window.localStorage&&localStorage.getItem("kisinet:theme"))||"system";if(t!=="light"&&t!=="dark"&&t!=="system"){t="system";}var d=t==="dark"||(t==="system"&&window.matchMedia("(prefers-color-scheme: dark)").matches);var r=document.documentElement;if(d){r.classList.add("dark");}else{r.classList.remove("dark");}}catch(e){}})();`;

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Lecture du cookie côté serveur (App Router / RSC). On ne pose la classe
  // "dark" sur <html> que pour le choix explicite "dark" ; les modes "light" et
  // "system" ne reçoivent pas la classe (le script client résout "system" avant
  // le premier paint). Cela garantit que le HTML SSR contient déjà le bon thème
  // pour les choix explicites, sans rupture d'hydratation.
  const cookieStore = await cookies();
  const storedTheme = cookieStore.get(THEME_COOKIE)?.value;
  const initialDark = storedTheme === "dark";

  return (
    <html
      lang="fr"
      suppressHydrationWarning
      className={initialDark ? "dark" : undefined}
    >
      <body>
        {/* Script bloquant exécuté avant le premier paint : lit le cookie (et
            localStorage en repli) puis applique la classe "dark" avant
            l'affichage. Supprime le flash de thème. Aucune logique métier. */}
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
        <ThemeProvider>
          <SalesChoicesBootstrap />
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}

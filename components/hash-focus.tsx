// Composant client qui isole une section de la page d'accueil selon le hash de l'URL.
// Lorsque l'URL contient `#fonctionnalites`, seule cette section reste visible ;
// les autres sections de `main` sont masquées. Tout autre hash réaffiche la page complète.
"use client";

import { useEffect } from "react";

const FOCUS_HASH = "#fonctionnalites";

function applyFocus() {
  const main = document.querySelector("main");
  if (!main) return;

  const sections = Array.from(main.children) as HTMLElement[];

  if (window.location.hash === FOCUS_HASH) {
    // Masque chaque section sauf celle ciblée par le hash.
    sections.forEach((section) => {
      if (section.id === "fonctionnalites") {
        section.style.display = "";
      } else {
        section.style.display = "none";
      }
    });
  } else {
    // Réaffiche toutes les sections dans leur comportement normal.
    sections.forEach((section) => {
      section.style.display = "";
    });
  }
}

export function HashFocus() {
  useEffect(() => {
    applyFocus();
    window.addEventListener("hashchange", applyFocus);
    return () => window.removeEventListener("hashchange", applyFocus);
  }, []);

  return null;
}

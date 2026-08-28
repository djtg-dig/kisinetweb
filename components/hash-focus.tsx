// Composant client qui isole une section de la page d'accueil selon le hash de l'URL.
// Les ancres principales doivent afficher une section claire, sans le reste de la landing.
"use client";

import { useEffect } from "react";

const FOCUS_SECTION_IDS = ["fonctionnalites", "faq", "contact"];

function applyFocus() {
  const main = document.querySelector("main");
  if (!main) return;

  const sections = Array.from(main.children) as HTMLElement[];
  const focusedSectionId = window.location.hash.replace("#", "");
  const shouldFocusSection = FOCUS_SECTION_IDS.includes(focusedSectionId);

  if (shouldFocusSection) {
    // Masque chaque section sauf celle ciblée par le hash.
    sections.forEach((section) => {
      if (section.id === focusedSectionId) {
        section.style.display = "";
      } else {
        section.style.display = "none";
      }
    });

    // Après le masquage, la position initiale du hash peut être trop basse.
    document.getElementById(focusedSectionId)?.scrollIntoView();
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

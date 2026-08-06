"use client";

import { useEffect, useState } from "react";
import { adminLoginPath } from "@/lib/admin/config";
import { clearAdminTokens, getAdminAccessToken } from "@/lib/admin/auth";
import { getAdminSession } from "@/lib/api/admin";
import { LoadingBubble } from "@/components/ui/loading-bubble";

type GuardState = "loading" | "ready";

export function AdminAuthGuard({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<GuardState>("loading");

  useEffect(() => {
    let isMounted = true;

    async function verifySession() {
      const hasToken = Boolean(getAdminAccessToken());

      if (!hasToken) {
        if (!isMounted) return;
        clearAdminTokens();
        window.location.replace(adminLoginPath);
        return;
      }

      try {
        await getAdminSession();
        if (!isMounted) return;
        setState("ready");
      } catch {
        if (!isMounted) return;
        clearAdminTokens();
        window.location.replace(adminLoginPath);
      }
    }

    verifySession();

    return () => {
      isMounted = false;
    };
  }, []);

  if (state === "loading") {
    // Écran de vérification de session : spinner existant centré verticalement
    // et horizontalement. Le fond utilise la variable de thème (bg-app-background)
    // qui suit la classe .dark posée sur <html> avant le premier paint, afin que
    // l'écran respecte le thème actuel (clair/sombre) et n'affiche pas un flash blanc.
    return (
      <main className="flex min-h-screen items-center justify-center bg-app-background">
        <LoadingBubble label="Vérification de la session" />
      </main>
    );
  }

  return <>{children}</>;
}

"use client";

import { useEffect, useState } from "react";
import { adminLoginPath } from "@/lib/admin/config";
import { clearAdminTokens } from "@/lib/admin/auth";
import { getAdminSession } from "@/lib/api/admin";
import { LoadingBubble } from "@/components/ui/loading-bubble";

type GuardState = "loading" | "ready";

export function AdminAuthGuard({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<GuardState>("loading");

  useEffect(() => {
    let isMounted = true;

    async function verifySession() {
      try {
        await getAdminSession();
        if (!isMounted) {
          return;
        }
        setState("ready");
      } catch {
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
    return (
      <main className="min-h-screen bg-app-background px-4 py-16">
        <LoadingBubble label="Vérification de la session" className="min-h-[320px]" />
      </main>
    );
  }

  return <>{children}</>;
}

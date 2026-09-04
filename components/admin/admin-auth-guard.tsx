"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { adminLoginPath } from "@/lib/admin/config";
import { useAdminSession } from "@/lib/hooks/use-admin-session";
import { LoadingBubble } from "@/components/ui/loading-bubble";

export function AdminAuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { authenticated, loading, refreshSession } = useAdminSession();

  useEffect(() => {
    if (!loading && !authenticated) {
      router.replace(adminLoginPath + "?session_expired=1");
    }
  }, [loading, authenticated, router]);

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-app-background">
        <LoadingBubble label="Vérification de la session" />
      </main>
    );
  }

  if (!authenticated) {
    return null;
  }

  return <>{children}</>;
}

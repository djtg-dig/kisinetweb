"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { carriAccountBackendLoginUrl } from "@/lib/carri-account";

export default function CarriAuthPage() {
  const router = useRouter();

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const hash = window.location.hash;

    if (hash) {
      const params = new URLSearchParams(hash.slice(1));
      const access = params.get("access");
      const refresh = params.get("refresh");

      if (access || refresh) {
        fetch("/api/auth/session", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            access: access || "",
            refresh: refresh || "",
          }),
        })
          .then((response) => response.json())
          .then(() => {
            window.history.replaceState(null, "", "/");
            router.push("/");
          })
          .catch(() => {
            window.history.replaceState(null, "", "/");
            router.push("/auth/carri/rate-limited?message=Erreur%20lors%20de%20la%20connexion.");
          });

        return;
      }
    }

    window.location.href = carriAccountBackendLoginUrl;
  }, [router]);

  return null;
}

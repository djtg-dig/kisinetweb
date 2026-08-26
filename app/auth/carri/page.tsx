"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  buildSafeAuthRedirect,
  readTokensFromHash,
  saveTokens,
} from "@/lib/auth";

const AUTH_NEXT_STORAGE_KEY = "kisinet:auth_next";

export default function CarriAuthPage() {
  const router = useRouter();

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const hash = window.location.hash;
    const params = new URLSearchParams(window.location.search);
    const requestedNext = params.get("next");
    const storedNext = sessionStorage.getItem(AUTH_NEXT_STORAGE_KEY);
    const nextPath = buildSafeAuthRedirect(requestedNext || storedNext);
    const tokens = readTokensFromHash(hash);

    if (tokens) {
      saveTokens(tokens);
      sessionStorage.removeItem(AUTH_NEXT_STORAGE_KEY);
      window.history.replaceState(null, "", window.location.pathname + window.location.search);
      router.replace(nextPath);
      return;
    }

    if (requestedNext) {
      sessionStorage.setItem(AUTH_NEXT_STORAGE_KEY, requestedNext);
    }

    window.location.href = "/api/auth/carri" + window.location.search;
  }, [router]);

  return null;
}

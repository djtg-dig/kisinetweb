"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

const AUTH_NEXT_STORAGE_KEY = "kisinet:auth_next";

export default function CarriAuthPage() {
  const router = useRouter();

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const params = new URLSearchParams(window.location.search);
    const requestedNext = params.get("next");

    if (requestedNext) {
      sessionStorage.setItem(AUTH_NEXT_STORAGE_KEY, requestedNext);
    }

    window.location.href = "/api/auth/carri" + window.location.search;
  }, [router]);

  return null;
}

"use client";

import { useEffect } from "react";

export default function CarriAuthPage() {
  useEffect(() => {
    window.location.href = "/api/auth/carri" + window.location.search;
  }, []);

  return null;
}

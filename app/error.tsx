"use client";

import { AppErrorScreen } from "@/components/app-error-screen";

type ErrorPageProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function ErrorPage({ error, reset }: ErrorPageProps) {
  // Cette page gère les erreurs des routes qui utilisent le layout principal.
  return <AppErrorScreen error={error} reset={reset} />;
}

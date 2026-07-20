import Link from "next/link";

type RateLimitedPageProps = {
  searchParams: Promise<{
    message?: string;
    retry_after_seconds?: string;
  }>;
};

function formatWaitTime(value?: string) {
  const seconds = Number(value);
  if (!Number.isFinite(seconds) || seconds <= 0) {
    return "";
  }

  if (seconds < 60) {
    return "Réessayez dans environ " + Math.ceil(seconds) + " seconde(s).";
  }

  return "Réessayez dans environ " + Math.ceil(seconds / 60) + " minute(s).";
}

export default async function CarriRateLimitedPage({
  searchParams,
}: RateLimitedPageProps) {
  const params = await searchParams;
  const message =
    params.message || "Trop de tentatives. Veuillez patienter avant de réessayer.";
  const waitMessage = formatWaitTime(params.retry_after_seconds);

  return (
    <main className="flex min-h-screen items-center justify-center bg-app-bg px-6 py-16 text-app-text">
      <section className="w-full max-w-md rounded-lg border border-app-border bg-app-surface p-6 shadow-sm">
        <p className="text-sm font-semibold text-primary-700">Connexion temporairement limitée</p>
        <h1 className="mt-3 text-2xl font-bold">Patientez un instant</h1>
        <p className="mt-3 text-sm leading-6 text-app-muted">{message}</p>
        {waitMessage && <p className="mt-2 text-sm leading-6 text-app-muted">{waitMessage}</p>}

        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href="/auth/carri"
            className="inline-flex min-h-11 items-center justify-center rounded-md bg-primary-600 px-4 text-sm font-semibold text-white hover:bg-primary-700"
          >
            Réessayer
          </Link>
          <Link
            href="/"
            className="inline-flex min-h-11 items-center justify-center rounded-md border border-app-border px-4 text-sm font-semibold text-app-text hover:bg-app-soft"
          >
            Retour à l'accueil
          </Link>
        </div>
      </section>
    </main>
  );
}

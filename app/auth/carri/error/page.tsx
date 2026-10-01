import Link from "next/link";

type Props = { searchParams: Promise<{ error?: string }> };

const messages: Record<string, { title: string; detail: string }> = {
  access_denied: { title: "Connexion annulée", detail: "Vous avez annulé la connexion avec Carri Account." },
  oauth_error: { title: "Connexion indisponible", detail: "La connexion avec Carri Account n’a pas pu être finalisée." },
  callback_failed: { title: "Connexion indisponible", detail: "La session n’a pas pu être finalisée. Réessayez si nécessaire." },
  no_tokens: { title: "Connexion indisponible", detail: "La session n’a pas pu être finalisée. Réessayez si nécessaire." },
  no_handoff: { title: "Connexion indisponible", detail: "Le retour de connexion est incomplet. Réessayez si nécessaire." },
};

export default async function CarriAuthErrorPage({ searchParams }: Props) {
  const { error } = await searchParams;
  const message = messages[error || ""] || messages.oauth_error;
  return (
    <main className="flex min-h-screen items-center justify-center bg-app-bg px-6 py-16 text-app-text">
      <section className="w-full max-w-md rounded-lg border border-app-border bg-app-surface p-6 shadow-sm">
        <p className="text-sm font-semibold text-primary-700">Carri Account</p>
        <h1 className="mt-3 text-2xl font-bold">{message.title}</h1>
        <p className="mt-3 text-sm leading-6 text-app-muted">{message.detail}</p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link href="/auth/carri" className="inline-flex min-h-11 items-center justify-center rounded-md bg-primary-600 px-4 text-sm font-semibold text-white hover:bg-primary-700">Réessayer</Link>
          <Link href="/" className="inline-flex min-h-11 items-center justify-center rounded-md border border-app-border px-4 text-sm font-semibold text-app-text hover:bg-app-soft">Retour à l’accueil</Link>
        </div>
      </section>
    </main>
  );
}

import { ThemeSwitcher } from "@/components/theme/theme-switcher";

type ApplicationSettingsPageProps = {
  params: Promise<{ pharmacyId: string }>;
};

export default async function ApplicationSettingsPage({
  params,
}: ApplicationSettingsPageProps) {
  const { pharmacyId } = await params;

  return (
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <a
        href={"/app/pharmacies/" + pharmacyId + "/settings"}
        className="text-sm font-semibold text-primary-700 transition hover:text-primary-800"
      >
        Retour
      </a>

      <section className="mt-6 rounded-lg border border-app-border bg-app-card p-6 shadow-sm">
        <p className="text-sm font-semibold text-primary-700">Paramètres</p>
        <h1 className="mt-2 text-3xl font-bold text-app-text">
          Paramètres de l’application
        </h1>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-app-muted">
          Configurer les préférences de fonctionnement de l’espace pharmacie.
        </p>
      </section>

      {/* Préférences d'affichage — inclut le choix du thème de l'écran */}
      <section className="mt-6 rounded-lg border border-app-border bg-app-card p-6 shadow-sm">
        <p className="text-sm font-semibold text-primary-700">Préférences</p>
        <h2 className="mt-2 text-xl font-bold text-app-text">Confort d'utilisation</h2>
        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          {/* Thème de l'écran — même contrôle que sur la page Paramètres généraux */}
          <div className="rounded-md border border-app-border bg-app-surface px-4 py-3">
            <p className="text-xs font-semibold text-app-muted">Thème de l’écran</p>
            <p className="mt-1 text-sm leading-5 text-app-muted">
              Choisissez l’apparence claire, sombre ou système.
            </p>
            <div className="mt-3">
              <ThemeSwitcher />
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

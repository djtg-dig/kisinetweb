type MainLayoutProps = {
  children: React.ReactNode;
};

export function MainLayout({ children }: MainLayoutProps) {
  return (
    <main className="min-h-screen bg-app-background">
      <header className="border-b border-app-border bg-app-surface">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary-600 text-lg font-bold text-white">
              K
            </div>
            <div>
              <p className="text-sm font-semibold text-app-text">Kisinet</p>
              <p className="text-xs text-app-muted">Gestion pharmaceutique</p>
            </div>
          </div>
          <span className="rounded-full bg-success-50 px-3 py-1 text-xs font-semibold text-success-700 ring-1 ring-success-100">
            Application sécurisé
          </span>
        </div>
      </header>
      {children}
    </main>
  );
}

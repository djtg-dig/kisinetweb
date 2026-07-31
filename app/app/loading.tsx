export default function AppLoading() {
  return (
    <div className="min-h-screen bg-app-background text-app-text">
      <header className="fixed inset-x-0 top-0 z-20 h-16 border-b border-app-border bg-app-surface/95 backdrop-blur lg:h-[72px]" />
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl">
          <div className="h-8 w-48 animate-pulse rounded-md bg-app-border" />
          <div className="mt-4 h-6 w-full animate-pulse rounded-md bg-app-border" />
          <div className="mt-6 h-64 animate-pulse rounded-lg border border-app-border bg-app-card" />
        </div>
      </main>
    </div>
  );
}

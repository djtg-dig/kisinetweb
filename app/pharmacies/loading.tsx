export default function PharmaciesLoading() {
  return (
    <main className="bg-app-background">
      <section className="border-b border-app-border bg-app-surface">
        <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
          <div className="h-8 w-48 animate-pulse rounded-md bg-app-border" />
          <div className="mt-4 h-10 w-96 animate-pulse rounded-md bg-app-border" />
        </div>
      </section>
      <section className="mx-auto grid max-w-6xl gap-6 px-4 py-8 sm:px-6 lg:grid-cols-[320px_1fr] lg:px-8">
        <div className="h-fit rounded-lg border border-app-border bg-app-card p-4">
          <div className="grid gap-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="h-10 animate-pulse rounded-md bg-app-border" />
            ))}
          </div>
        </div>
        <div className="grid gap-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="h-36 animate-pulse rounded-lg border border-app-border bg-app-card" />
          ))}
        </div>
      </section>
    </main>
  );
}

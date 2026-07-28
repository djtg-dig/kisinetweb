export default function AdminPharmaciesPage() {
  return <AdminPlaceholder title="Pharmacies" />;
}

function AdminPlaceholder({ title }: { title: string }) {
  return (
    <section className="rounded-lg border border-app-border bg-app-card p-6 shadow-sm">
      <p className="text-sm font-semibold text-primary-700">Administration</p>
      <h2 className="mt-2 text-2xl font-bold text-app-text">{title}</h2>
    </section>
  );
}

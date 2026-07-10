type CurrentSubscriptionCardProps = {
  planName: string;
  expiresAt: string;
};

export function CurrentSubscriptionCard({
  planName,
  expiresAt,
}: CurrentSubscriptionCardProps) {
  return (
    <section className="rounded-lg border border-app-border bg-app-card p-5 shadow-sm">
      <p className="text-sm font-semibold uppercase tracking-wide text-app-muted">
        Plan actuel
      </p>
      <p className="mt-3 text-xl font-bold text-app-text">{planName}</p>
      <div className="mt-4 border-t border-app-border pt-4">
        <p className="text-xs font-semibold text-app-muted">Expire le :</p>
        <p className="mt-1 font-semibold text-app-text">{expiresAt}</p>
      </div>
    </section>
  );
}

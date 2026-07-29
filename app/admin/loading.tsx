import { LoadingBubble } from "@/components/ui/loading-bubble";

export default function AdminLoading() {
  return (
    <section className="rounded-lg border border-app-border bg-app-card p-6 shadow-sm">
      <LoadingBubble label="Chargement" className="min-h-[280px]" />
    </section>
  );
}

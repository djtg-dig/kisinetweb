import { LoadingBubble } from "@/components/ui/loading-bubble";

export default function PlanDetailLoading() {
  return (
    <main className="min-h-screen bg-app-background px-4 py-10 sm:px-6 lg:px-8">
      <section className="mx-auto max-w-6xl">
        <LoadingBubble label="Chargement du plan" className="min-h-[360px]" />
      </section>
    </main>
  );
}

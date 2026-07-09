import type { Metadata } from "next";
import { PublicLayout } from "@/components/layout/public-layout";
import { NotFoundActions } from "@/components/not-found-actions";

export const metadata: Metadata = {
  title: "404 - Page introuvable | Kisinet",
};

export default function NotFound() {
  return (
    <PublicLayout>
      <main className="flex min-h-[calc(100vh-77px)] items-center">
        <section className="mx-auto w-full max-w-4xl px-4 py-16 text-center sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary-700">
              Page introuvable
            </p>
            <h1 className="mt-4 text-7xl font-bold leading-none text-app-text sm:text-8xl">
              404
            </h1>
            <p className="mx-auto mt-6 max-w-xl text-base leading-8 text-app-muted sm:text-lg">
              La page que vous recherchez est introuvable ou a été déplacée.
            </p>
            <NotFoundActions />
          </div>
        </section>
      </main>
    </PublicLayout>
  );
}

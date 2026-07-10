"use client";

import { useEffect } from "react";
import { MainLayout } from "@/components/layout/main-layout";
import { LoadingBubble } from "@/components/ui/loading-bubble";
import { getActivePharmacyId } from "@/lib/auth";

export default function ProfileRedirectPage() {
  useEffect(() => {
    const activePharmacyId = getActivePharmacyId();
    window.location.href = activePharmacyId
      ? "/app/pharmacies/" + activePharmacyId + "/profile"
      : "/app/select-pharmacy";
  }, []);

  return (
    <MainLayout>
      <section className="mx-auto min-h-[calc(100vh-220px)] max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
        <LoadingBubble label="Ouverture du profil" />
      </section>
    </MainLayout>
  );
}

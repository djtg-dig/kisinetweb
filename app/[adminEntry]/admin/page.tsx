import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { adminEntrySegment } from "@/lib/admin/config";
import { AdminLoginPageClient } from "./page-client";

export const metadata: Metadata = {
  title: "Connexion interne Kisinet",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function AdminEntryPage({
  params,
}: {
  params: Promise<{ adminEntry: string }>;
}) {
  const { adminEntry } = await params;

  if (adminEntry !== adminEntrySegment) {
    notFound();
  }

  return <AdminLoginPageClient />;
}

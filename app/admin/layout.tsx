import type { Metadata } from "next";
import { AdminAuthGuard } from "@/components/admin/admin-auth-guard";
import { AdminShell } from "@/components/admin/admin-shell";

export const metadata: Metadata = {
  title: "Administration Kisinet",
  robots: {
    index: false,
    follow: false,
  },
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <AdminAuthGuard>
      <AdminShell>{children}</AdminShell>
    </AdminAuthGuard>
  );
}

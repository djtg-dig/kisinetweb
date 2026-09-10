import type { Metadata } from "next";
import { AdminRouteFrame } from "@/components/admin/admin-route-frame";

export const metadata: Metadata = {
  title: "Administration Kisinet",
  robots: {
    index: false,
    follow: false,
  },
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <AdminRouteFrame>{children}</AdminRouteFrame>;
}

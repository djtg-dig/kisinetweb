import type { Metadata } from "next";
import PlanDetailPageClient from "./page-client";

export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
    nocache: true,
  },
};

export default function PlanDetailPage() {
  return <PlanDetailPageClient />;
}

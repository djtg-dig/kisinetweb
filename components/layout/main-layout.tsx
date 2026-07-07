import { PublicLayout } from "@/components/layout/public-layout";

type MainLayoutProps = {
  children: React.ReactNode;
};

export function MainLayout({ children }: MainLayoutProps) {
  return (
    <PublicLayout>
      <main className="min-h-screen bg-app-background">{children}</main>
    </PublicLayout>
  );
}

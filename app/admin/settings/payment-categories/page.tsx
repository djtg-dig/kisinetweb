import { PaymentSettingsLayout } from "@/components/admin/payment-settings-layout";

// Page de la sous-section "Catégories de paiement".
// Structure initiale uniquement : aucun appel API n'est encore implémenté.
export default function AdminPaymentCategoriesPage() {
  return (
    <PaymentSettingsLayout>
      <div className="rounded-lg border border-app-border bg-app-card p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-app-text">Catégories de paiement</h3>
        <p className="mt-2 text-sm text-app-muted">
          Cette section permettra de gérer les catégories de paiement. L’interface est en
          cours de préparation.
        </p>
      </div>
    </PaymentSettingsLayout>
  );
}

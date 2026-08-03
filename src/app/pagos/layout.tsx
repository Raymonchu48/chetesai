import FinancialAlertsCenter from "@/components/FinancialAlertsCenter";

export default function PaymentsLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <FinancialAlertsCenter />
    </>
  );
}

import type { Metadata } from "next";
import { InvoiceProvider } from "@/context/InvoiceContext";
import { NotificationProvider } from "@/providers/notification-provider";
import { SelectedOrganizationProvider } from "@/hooks/use-selected-org";
import { ClientsProvider } from "@/hooks/use-clients";
import { LayoutContent } from "@/components/layout/layout-content";
import SubscriptionWrapper from "@/components/subscription/subscription-wrapper";
import { ExpenseProvider } from "@/hooks/use-expenses";
import { PaymentsProvider } from "@/hooks/use-payments";
import { OrganizationProvider } from "@/hooks/use-organization";

export const metadata: Metadata = {
  title: "Invoxa - Professional Invoice Management System",
  description:
    "Complete invoice management solution with templates, payments tracking, and analytics",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <OrganizationProvider>
      <InvoiceProvider>
        <NotificationProvider>
          <SelectedOrganizationProvider>
            <ClientsProvider>
              <PaymentsProvider>
                <ExpenseProvider>
                  <LayoutContent>
                    <SubscriptionWrapper>{children}</SubscriptionWrapper>
                  </LayoutContent>
                </ExpenseProvider>
              </PaymentsProvider>
            </ClientsProvider>
          </SelectedOrganizationProvider>
        </NotificationProvider>
      </InvoiceProvider>
    </OrganizationProvider>
  );
}
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import { InvoiceProvider } from "@/context/InvoiceContext";
import { NotificationProvider } from "@/providers/notification-provider";
import { SelectedOrganizationProvider } from "@/hooks/use-selected-org";
import { ClientsProvider } from "@/hooks/use-clients";
import { LayoutContent } from "@/components/layout/layout-content";
import SubscriptionWrapper from "@/components/subscription/subscription-wrapper";
import { Toaster } from "react-hot-toast";
import { ExpenseProvider } from "@/hooks/use-expenses";
import { PaymentsProvider } from "@/hooks/use-payments";
import { Organization } from "@clerk/nextjs/server";
import { OrganizationProvider } from "@/hooks/use-organization";

const inter = Inter({ subsets: ["latin"] });

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
    <ClerkProvider
      publishableKey={process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY}
    >
      <html lang="en">
        <body className={inter.className}>
          <OrganizationProvider>
            <InvoiceProvider>
              <NotificationProvider>
                <SelectedOrganizationProvider>
                  <ClientsProvider>
                    <PaymentsProvider>
                      <ExpenseProvider>
                        <LayoutContent>
                          <SubscriptionWrapper>
                            {/* <div className="fixed top-0 left-0 right-0 z-[99] bg-white"> */}
                            <Toaster
                              position="top-center"
                              reverseOrder={false}
                            />
                            {children}
                          </SubscriptionWrapper>
                        </LayoutContent>
                      </ExpenseProvider>
                    </PaymentsProvider>
                  </ClientsProvider>
                </SelectedOrganizationProvider>
              </NotificationProvider>
            </InvoiceProvider>
          </OrganizationProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}

"use client";

import { useInvoiceContext } from "@/context/InvoiceContext";
import { usePathname, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  FileText,
  Settings,
  Building,
  Palette,
  Home,
  Users,
  CreditCard,
  Receipt,
  BarChart3,
  Bell,
  User,
  TrendingUp,
  DollarSign,
  Calendar,
  Shield,
  Menu,
  X,
  Activity,
  OctagonAlert,
} from "lucide-react";
import { Select, SelectTrigger, SelectItem, SelectContent } from "../ui/select";
import { LicenseBanner } from "@/components/license/license-banner";
import { FEATURES } from "@/hooks/use-subscription-access";
import { use, useEffect, useState } from "react";
import { SuperuserLogin } from "@/components/admin/superuser-login";
import { SubscriptionGuard } from "../subscription/subscription-guard";
import { SignedIn, UserButton } from "@clerk/nextjs";
import { NotificationBell } from "../notifications/notification-bell";
import { useInvoices } from "@/hooks/use-invoices";
import { SelectValue } from "@radix-ui/react-select";
import { useSelectedOrganization } from "@/hooks/use-selected-org";
import { useOrganization } from "@/hooks/use-organization";
import { set } from "react-hook-form";

export function LayoutContent({ children }: { children: React.ReactNode }) {
  const { settings } = useInvoices();
  const {
    selectedOrganization: organization,
    setSelectedOrganization,
    organizations,
    memberOrganizations,
  } = useOrganization();

  const router = useRouter();
  const pathname = usePathname();

  const [isSuperuser, setIsSuperuser] = useState(true);
  const [showSuperuserLogin, setShowSuperuserLogin] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const isSuperUserMode = settings?.isSuperUser || isSuperuser;

  useEffect(() => {
    if (organization) {
      setSelectedOrganization(organization);
    } else if (memberOrganizations.length > 0) {
      setSelectedOrganization(memberOrganizations[0].organization);
    }
  }, [organization, memberOrganizations]);

  // Category-based navigation structure
  const getOrganizationCategory = () => {
    const baseItems = [
      // { name: "Overview", href: "/organization", icon: Building },
      { name: "Members", href: "/members", icon: Users },
      { name: "Settings", href: "/settings", icon: Settings },
    ];

    if (organization) {
      baseItems.splice(1, 0, {
        name: "Collaboration",
        href: `/organization/${organization.id}/collaboration`,
        icon: Building,
      });
    }

    return baseItems;
  };

  const organizationCategory = getOrganizationCategory();

  const overviewCategory = [
    { name: "Dashboard", href: "/dashboard", icon: Home },
    { name: "Insights", href: "/insights", icon: TrendingUp },
  ];

  const salesAndClientsCategory = [
    { name: "Clients", href: "/clients", icon: Users },
  ];

  const billingCategory = [
    { name: "Invoices", href: "/invoices", icon: FileText },
  ];

  const paymentsCategory = [
    { name: "Payments", href: "/payments", icon: CreditCard },
    { name: "Ledger", href: "/ledger/payments", icon: DollarSign },
  ];

  const expensesCategory = [
    { name: "Expenses", href: "/expenses", icon: Receipt },
  ];

  const subscriptionNavigationItems = [
    {
      name: "Reports",
      href: "/reports",
      icon: BarChart3,
      feature: FEATURES.REPORTS_ANALYTICS,
    },
  ];

  const renderSidebar = () => (
    <div
      className={`${sidebarOpen ? "translate-x-0" : "-translate-x-full"} fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0`}
    >
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center">
          <FileText className="h-8 w-8 text-blue-600" />
          <span className="ml-2 text-xl font-bold text-gray-900">Invoxa</span>
          {/* <Badge className="ml-2 bg-blue-100 text-blue-800 text-xs">SaaS</Badge> */}
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setSidebarOpen(false)}
          className="lg:hidden"
        >
          <X className="h-5 w-5" />
        </Button>
      </div>

      <div className="px-2 py-4 border-t">
        <div className="mb-2 px-2">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
            Active Organization
          </p>
        </div>
        <div className="space-y-1">
          {/* Selected Organization */}
          <Select
            // value={organization?.id || memberOrganizations[0]?.org_id || ""}
            // key={organization && organization.id}
            value={organization?.id || ""}
            onValueChange={(value) => {
              // Find the selected organization
              const orgToSelect = organizations.find((org) => org.id === value);
              if (orgToSelect) setSelectedOrganization(orgToSelect);
              // const selectedOrg = memberOrganizations.find(
              //   (org: any) => org.org_id === value,
              // );
              // if (selectedOrg && selectedOrg.organization) {
              //   // Update the organization context
              //   // Note: In a real implementation, you would update the global context/state with the new organization
              //   console.log(
              //     "Switching to organization:",
              //     selectedOrg.organization,
              //   );
              //   // This would typically dispatch an action to update the context
              //   // For now, we'll just log the change
              // }
            }}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select an organization">
                {organization ? (
                  <div className="flex items-center">
                    <Building className="h-4 w-4 mr-2 text-gray-500" />
                    <span className="truncate font-medium">
                      {organization.name}
                    </span>
                  </div>
                ) : memberOrganizations.length > 0 ? (
                  <div className="flex items-center">
                    <Building className="h-4 w-4 mr-2 text-gray-500" />
                    <span className="truncate">
                      {memberOrganizations[0]?.name ||
                        memberOrganizations[0]?.organization.name}
                    </span>
                  </div>
                ) : (
                  <span>Select organization</span>
                )}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {organizations.map((org: any) => (
                <SelectItem
                  key={org.id}
                  value={org.id}
                  className="flex items-center"
                >
                  <div className="flex items-center">
                    <Building className="h-4 w-4 mr-2 text-gray-500" />
                    <span className="truncate">{org.name}</span>
                    {organization?.id === org.org_id && (
                      <span className="ml-auto text-xs text-blue-600">
                        (Current)
                      </span>
                    )}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <nav className="flex-1 px-2 py-4 space-y-1">
        {/* Organization Category */}
        <div className="mb-4">
          <h3 className="px-2 py-1 text-xs font-semibold text-gray-500 uppercase tracking-wider">
            Organization
          </h3>
          {getOrganizationCategory().map((item) => {
            const Icon = item.icon;
            const isActive =
              pathname === item.href ||
              (item.href !== "/dashboard" && pathname.startsWith(item.href));
            return (
              <Button
                key={item.name}
                variant={isActive ? "secondary" : "ghost"}
                className={`w-full justify-start pl-8 ${isActive ? "bg-blue-50 border-l-4 border-blue-500" : ""}`}
                onClick={() => {
                  router.push(item.href);
                  setSidebarOpen(false);
                }}
              >
                <Icon className="h-5 w-5 mr-3" />
                {item.name}

                {(item.name === "Collaboration" || item.name === "Members") && (
                  <OctagonAlert className="absolute right-4 h-4 w-4 text-yellow-600" />
                )}
              </Button>
            );
          })}
        </div>

        {/* Overview Category */}
        <div className="mb-4">
          <h3 className="px-2 py-1 text-xs font-semibold text-gray-500 uppercase tracking-wider">
            Overview
          </h3>
          {overviewCategory.map((item) => {
            const Icon = item.icon;
            const isActive =
              pathname === item.href ||
              (item.href !== "/dashboard" && pathname.startsWith(item.href));
            return (
              <Button
                key={item.name}
                variant={isActive ? "secondary" : "ghost"}
                className={`w-full justify-start pl-8 ${isActive ? "bg-blue-50 border-l-4 border-blue-500" : ""}`}
                onClick={() => {
                  router.push(item.href);
                  setSidebarOpen(false);
                }}
              >
                <Icon className="h-5 w-5 mr-3" />
                {item.name}
              </Button>
            );
          })}
        </div>

        {/* Sales & Clients Category */}
        <div className="mb-4">
          <h3 className="px-2 py-1 text-xs font-semibold text-gray-500 uppercase tracking-wider">
            Sales & Clients
          </h3>
          {salesAndClientsCategory.map((item) => {
            const Icon = item.icon;
            const isActive =
              pathname === item.href ||
              (item.href !== "/dashboard" && pathname.startsWith(item.href));
            return (
              <Button
                key={item.name}
                variant={isActive ? "secondary" : "ghost"}
                className={`w-full justify-start pl-8 ${isActive ? "bg-blue-50 border-l-4 border-blue-500" : ""}`}
                onClick={() => {
                  router.push(item.href);
                  setSidebarOpen(false);
                }}
              >
                <Icon className="h-5 w-5 mr-3" />
                {item.name}
              </Button>
            );
          })}
        </div>

        {/* Billing Category */}
        <div className="mb-4">
          <h3 className="px-2 py-1 text-xs font-semibold text-gray-500 uppercase tracking-wider">
            Billing
          </h3>
          {billingCategory.map((item) => {
            const Icon = item.icon;
            const isActive =
              pathname === item.href ||
              (item.href !== "/dashboard" && pathname.startsWith(item.href));
            return (
              <Button
                key={item.name}
                variant={isActive ? "secondary" : "ghost"}
                className={`w-full justify-start pl-8 ${isActive ? "bg-blue-50 border-l-4 border-blue-500" : ""}`}
                onClick={() => {
                  router.push(item.href);
                  setSidebarOpen(false);
                }}
              >
                <Icon className="h-5 w-5 mr-3" />
                {item.name}
              </Button>
            );
          })}
        </div>

        {/* Payments (Inflow) Category */}
        <div className="mb-4">
          <h3 className="px-2 py-1 text-xs font-semibold text-gray-500 uppercase tracking-wider">
            Payments (Inflow)
          </h3>
          {paymentsCategory.map((item) => {
            const Icon = item.icon;
            const isActive =
              pathname === item.href ||
              (item.href !== "/dashboard" && pathname.startsWith(item.href));
            return (
              <Button
                key={item.name}
                variant={isActive ? "secondary" : "ghost"}
                className={`w-full justify-start pl-8 ${isActive ? "bg-blue-50 border-l-4 border-blue-500" : ""}`}
                onClick={() => {
                  router.push(item.href);
                  setSidebarOpen(false);
                }}
              >
                <Icon className="h-5 w-5 mr-3" />
                {item.name}
              </Button>
            );
          })}
        </div>

        {/* Expenses (Outflow) Category */}
        <div className="mb-4">
          <h3 className="px-2 py-1 text-xs font-semibold text-gray-500 uppercase tracking-wider">
            Expenses (Outflow)
          </h3>
          {expensesCategory.map((item) => {
            const Icon = item.icon;
            const isActive =
              pathname === item.href ||
              (item.href !== "/dashboard" && pathname.startsWith(item.href));
            return (
              <Button
                key={item.name}
                variant={isActive ? "secondary" : "ghost"}
                className={`w-full justify-start pl-8 ${isActive ? "bg-blue-50 border-l-4 border-blue-500" : ""}`}
                onClick={() => {
                  router.push(item.href);
                  setSidebarOpen(false);
                }}
              >
                <Icon className="h-5 w-5 mr-3" />
                {item.name}
              </Button>
            );
          })}
        </div>

        {/* Subscription Navigation Items */}
        {subscriptionNavigationItems.map((item) => (
          <div key={`subscription-${item.name}`} className="mb-4">
            <h3 className="px-2 py-1 text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Analytics
            </h3>
            <SubscriptionGuard
              key={item.name}
              hideable={true}
              feature={item.feature}
            >
              <Button
                variant={pathname.startsWith(item.href) ? "secondary" : "ghost"}
                className={`w-full justify-start pl-8 ${pathname.startsWith(item.href) ? "bg-blue-50 border-l-4 border-blue-500" : ""}`}
                onClick={() => {
                  router.push(item.href);
                  setSidebarOpen(false);
                }}
              >
                <item.icon className="h-5 w-5 mr-3" />
                {item.name}
              </Button>
            </SubscriptionGuard>
          </div>
        ))}

        {/* Admin Section */}
        {/*{isSuperUserMode && (
          <div className="mb-4">
            <h3 className="px-2 py-1 text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Admin
            </h3>
            <Button
              variant={pathname.startsWith("/admin") ? "secondary" : "ghost"}
              className={`w-full justify-start pl-8 ${pathname.startsWith("/admin") ? "bg-blue-50 border-l-4 border-blue-500" : ""}`}
              onClick={() => {
                router.push("/admin");
                setSidebarOpen(false);
              }}
            >
              <Shield className="h-5 w-5 mr-3" />
              Admin
            </Button>
          </div>
        )}*/}
      </nav>
    </div>
  );

  const renderTopNavigation = () => (
    <nav className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden mr-2"
            >
              <Menu className="h-6 w-6" />
            </Button>
            {/* <div className="hidden lg:flex items-center">
              <FileText className="h-8 w-8 text-blue-600" />
              <span className="ml-2 text-xl font-bold text-gray-900">
                Invoxa
              </span>
              <Badge className="ml-2 bg-blue-100 text-blue-800 text-xs">
                SaaS
              </Badge>
            </div> */}
          </div>
          <div className="flex items-center space-x-4">
            <NotificationBell />

            <SignedIn>
              <UserButton />
            </SignedIn>

            {/*{isSuperUserMode && (
              <Button
                variant={pathname.startsWith("/admin") ? "default" : "ghost"}
                onClick={() => router.push("/admin")}
                className="flex items-center text-red-600 hover:text-red-700 hidden lg:flex"
              >
                <Shield className="h-4 w-4 mr-2" />
                Admin
              </Button>
            )}*/}
            {/* <Button
              variant={pathname.startsWith("/settings") ? "default" : "ghost"}
              onClick={() => router.push("/settings")}
              className="flex items-center hidden lg:flex"
            >
              <Settings className="h-4 w-4 mr-2" />
              Settings
            </Button> */}
            {/*{!isSuperUserMode && (
              <Button
                variant="ghost"
                onClick={() => setShowSuperuserLogin(true)}
                className="text-xs text-gray-500 hover:text-gray-700 hidden lg:flex"
              >
                <Shield className="h-3 w-3 mr-1" />
                Admin
              </Button>
            )}*/}
          </div>
        </div>
      </div>
    </nav>
  );

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar overlay for mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        ></div>
      )}

      {renderSidebar()}

      <div className="flex-1 flex flex-col overflow-hidden">
        {renderTopNavigation()}

        <main className="flex-1 overflow-y-auto py-6 px-4 sm:px-6 lg:px-8">
          {/* <LicenseBanner /> */}

          {/* Organization Context Banner */}
          {organization && (
            <div className="mb-6">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center">
                  <Building className="h-5 w-5 text-blue-600 mr-2" />
                  <h2 className="text-lg font-semibold text-blue-800">
                    Working in: {organization.name}
                  </h2>
                </div>
                <p className="text-sm text-blue-600 mt-1">
                  All data shown belongs to this organization
                </p>
              </div>
            </div>
          )}

          {/* Render children with organization guard if needed */}
          {children}
        </main>
      </div>

      {/*<SuperuserLogin
        isOpen={showSuperuserLogin}
        onClose={() => setShowSuperuserLogin(false)}
        onLogin={(success) => {
          if (success) {
            setIsSuperuser(true);
            router.push("/admin");
          }
        }}
      />*/}
    </div>
  );
}

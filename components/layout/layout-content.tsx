"use client";

import { usePathname, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  FileText,
  Settings,
  Building,
  Home,
  Users,
  CreditCard,
  Receipt,
  BarChart3,
  Bell,
  TrendingUp,
  DollarSign,
  Shield,
  Menu,
  X,
  ChevronDown,
  LayoutDashboard,
  Crown,
  Mail,
  ChevronRight,
} from "lucide-react";
import { Select, SelectTrigger, SelectItem, SelectContent } from "../ui/select";
import { FEATURES } from "@/hooks/use-subscription-access";
import { useEffect, useState } from "react";
import { SubscriptionGuard } from "../subscription/subscription-guard";
import { SignedIn, UserButton } from "@clerk/nextjs";
import { NotificationBell } from "../notifications/notification-bell";
import { useInvoices } from "@/hooks/use-invoices";
import { SelectValue } from "@radix-ui/react-select";
import { useOrganization } from "@/hooks/use-organization";
import {
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
} from "@radix-ui/react-collapsible";
import { Tooltip, TooltipContent, TooltipTrigger } from "../ui/tooltip";
import { TooltipArrow, TooltipPortal } from "@radix-ui/react-tooltip";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import { StatusBadge } from "@/components/ui/status-badge";
import { cn } from "@/lib/utils";

interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

function NavLink({
  item,
  pathname,
  onNavigate,
  sub,
}: {
  item: NavItem;
  pathname: string;
  onNavigate: () => void;
  sub?: boolean;
}) {
  const Icon = item.icon;
  const isActive =
    pathname === item.href ||
    (item.href === "/" ? false : pathname.startsWith(item.href));
  return (
    <Button
      variant={isActive ? "secondary" : "ghost"}
      className={cn(
        "w-full justify-start gap-3 font-normal",
        sub ? "pl-11" : "pl-3",
        isActive && "bg-muted font-medium text-foreground hover:bg-muted",
      )}
      onClick={onNavigate}
    >
      <Icon className="h-[18px] w-[18px] shrink-0 text-muted-foreground" />
      {item.name}
    </Button>
  );
}

function RoleChip({ role }: { role: string }) {
  if (role === "owner") {
    return (
      <StatusBadge tone="violet" dot label="Owner" />
    );
  }
  return (
    <StatusBadge tone="blue" dot label="Member" />
  );
}

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

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [collaborationOpen, setCollaborationOpen] = useState(
    pathname.startsWith("/organization/"),
  );

  useEffect(() => {
    if (organization) {
      setSelectedOrganization(organization);
    } else if (memberOrganizations.length > 0) {
      setSelectedOrganization(memberOrganizations[0].organization);
    }
  }, [organization, memberOrganizations]);

  const navigate = (href: string) => {
    router.push(href);
    setSidebarOpen(false);
  };

  const organizationCategory: NavItem[] = [
    { name: "Members", href: "/members", icon: Users },
    { name: "Settings", href: "/settings", icon: Settings },
  ];

  const overviewCategory: NavItem[] = [
    { name: "Dashboard", href: "/dashboard", icon: Home },
    { name: "Insights", href: "/insights", icon: TrendingUp },
  ];

  const salesCategory: NavItem[] = [
    { name: "Clients", href: "/clients", icon: Users },
  ];

  const billingCategory: NavItem[] = [
    { name: "Invoices", href: "/invoices", icon: FileText },
  ];

  const paymentsCategory: NavItem[] = [
    { name: "Payments", href: "/payments", icon: CreditCard },
    { name: "Ledger", href: "/ledger/payments", icon: DollarSign },
  ];

  const expensesCategory: NavItem[] = [
    { name: "Expenses", href: "/expenses", icon: Receipt },
  ];

  const reportsItem: NavItem = {
    name: "Reports",
    href: "/reports",
    icon: BarChart3,
  };

  const pageTitle = usePageTitle(pathname);

  function NavGroup({
    label,
    items,
  }: {
    label: string;
    items: NavItem[];
  }) {
    return (
      <div className="space-y-0.5">
        <p className="px-3 pb-1 pt-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {label}
        </p>
        {items.map((item) => (
          <NavLink key={item.href} item={item} pathname={pathname} onNavigate={() => navigate(item.href)} />
        ))}
      </div>
    );
  }

  const sidebar = (
    <div
      className={cn(
        "fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r bg-card transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static",
        sidebarOpen ? "translate-x-0" : "-translate-x-full",
      )}
    >
      {/* Brand */}
      <div className="flex h-16 items-center justify-between border-b px-4">
        <button
          className="flex items-center gap-2.5"
          onClick={() => navigate("/dashboard")}
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <FileText className="h-4 w-4" />
          </div>
          <span className="text-lg font-semibold tracking-tight">Invoxa</span>
        </button>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setSidebarOpen(false)}
          className="lg:hidden"
        >
          <X className="h-5 w-5" />
        </Button>
      </div>

      {/* Org switcher */}
      <div className="border-b px-4 py-4">
        <p className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Organization
        </p>
        <Select
          value={organization?.id || ""}
          onValueChange={(value) => {
            const orgToSelect = organizations.find((org) => org.id === value);
            if (orgToSelect) {
              setSelectedOrganization(orgToSelect);
              router.refresh();
            }
          }}
        >
          <SelectTrigger className="w-full">
            <SelectValue>
              {organization ? (
                <div className="flex items-center gap-2">
                  <Building className="h-4 w-4 shrink-0 text-muted-foreground" />
                  <span className="truncate font-medium">
                    {organization.name}
                  </span>
                </div>
              ) : memberOrganizations.length > 0 ? (
                <div className="flex items-center gap-2">
                  <Building className="h-4 w-4 shrink-0 text-muted-foreground" />
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
              <SelectItem key={org.id} value={org.id}>
                <div className="flex items-center justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-2">
                    <Building className="h-4 w-4 shrink-0 text-muted-foreground" />
                    <span className="truncate">{org.name}</span>
                  </div>
                  {org.userRole === "owner" ? (
                    <span className="flex items-center gap-1 rounded-md bg-violet-50 px-1.5 py-0.5 text-[10px] font-medium text-violet-700">
                      <Crown className="h-3 w-3" /> Owner
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 rounded-md bg-blue-50 px-1.5 py-0.5 text-[10px] font-medium text-blue-700">
                      <Users className="h-3 w-3" /> Member
                    </span>
                  )}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 pb-6">
        <NavGroup label="Organization" items={organizationCategory} />

        {/* Collaboration */}
        {organizations.length > 0 &&
          organization &&
          (() => {
            const baseHref = `/organization/${organization.id}/collaboration`;
            return (
              <Collapsible
                open={collaborationOpen}
                onOpenChange={setCollaborationOpen}
              >
                <CollapsibleTrigger asChild>
                  <Button
                    variant="ghost"
                    className="w-full justify-start gap-3 pl-3 font-normal"
                  >
                    <Building className="h-[18px] w-[18px] shrink-0 text-muted-foreground" />
                    Collaboration
                    <ChevronDown
                      className={cn(
                        "ml-auto h-4 w-4 transition-transform duration-200",
                        collaborationOpen ? "rotate-0" : "-rotate-90",
                      )}
                    />
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="space-y-0.5">
                  {[
                    { name: "Dashboard", href: baseHref, icon: LayoutDashboard },
                    { name: "Clients", href: `${baseHref}/clients`, icon: Users },
                    { name: "Invoices", href: `${baseHref}/invoice`, icon: FileText },
                    { name: "Expenses", href: `${baseHref}/expenses`, icon: Receipt },
                    { name: "Payments", href: `${baseHref}/payments`, icon: CreditCard },
                  ].map((sub) => (
                    <NavLink
                      key={sub.href}
                      item={sub}
                      pathname={pathname}
                      onNavigate={() => navigate(sub.href)}
                      sub
                    />
                  ))}
                </CollapsibleContent>
              </Collapsible>
            );
          })()}

        {/* Member: single Collaborations link */}
        {memberOrganizations.length > 0 && (
            <Button
              variant={
                pathname.startsWith("/organization/") ? "secondary" : "ghost"
              }
              className={cn(
                "w-full justify-start gap-3 pl-3 font-normal",
                pathname.startsWith("/organization/") &&
                  "bg-muted font-medium text-foreground",
              )}
              onClick={() => {
                const firstOrgId =
                  memberOrganizations[0]?.org_id ||
                  memberOrganizations[0]?.organization?.id;
                if (firstOrgId) navigate(`/organization/${firstOrgId}/collaboration`);
              }}
            >
              <Building className="h-[18px] w-[18px] shrink-0 text-muted-foreground" />
              Collaborations
            </Button>
          )}

        <div className="mt-2 border-t pt-1">
          <NavGroup label="Overview" items={overviewCategory} />
          <NavGroup label="Customers" items={salesCategory} />
        </div>
        <div className="mt-2 space-y-0.5">
          <p className="px-3 pb-1 pt-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Billing
          </p>
          <div className="space-y-0.5">
            {billingCategory.map((item) => (
              <NavLink key={item.href} item={item} pathname={pathname} onNavigate={() => navigate(item.href)} />
            ))}
          </div>
        </div>
        <div className="mt-2 space-y-0.5">
          <p className="px-3 pb-1 pt-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Money in
          </p>
          <div className="space-y-0.5">
            {paymentsCategory.map((item) => (
              <NavLink key={item.href} item={item} pathname={pathname} onNavigate={() => navigate(item.href)} />
            ))}
          </div>
        </div>
        <div className="mt-2 space-y-0.5">
          <p className="px-3 pb-1 pt-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Money out
          </p>
          <div className="space-y-0.5">
            {expensesCategory.map((item) => (
              <NavLink key={item.href} item={item} pathname={pathname} onNavigate={() => navigate(item.href)} />
            ))}
          </div>
        </div>
        <div className="mt-2 space-y-0.5">
          <p className="px-3 pb-1 pt-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Analytics
          </p>
          <SubscriptionGuard hideable feature={FEATURES.REPORTS_ANALYTICS}>
            <NavLink item={reportsItem} pathname={pathname} onNavigate={() => navigate(reportsItem.href)} />
          </SubscriptionGuard>
        </div>
      </nav>

      {/* Footer */}
      <div className="border-t p-3">
        <button
          onClick={() => navigate("/settings")}
          className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <Settings className="h-4 w-4" />
          Settings
          <ChevronRight className="ml-auto h-4 w-4" />
        </button>
      </div>
    </div>
  );

  const topbar = (
    <header className="flex h-16 shrink-0 items-center justify-between border-b bg-card px-4 sm:px-6 lg:px-8">
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setSidebarOpen(true)}
          className="lg:hidden"
        >
          <Menu className="h-5 w-5" />
        </Button>
        <div>
          <p className="text-sm font-semibold text-foreground">{pageTitle}</p>
          <p className="hidden text-xs text-muted-foreground sm:block">
            Invoxa workspace
          </p>
        </div>
      </div>

      <div className="flex items-center gap-1 sm:gap-2">
        <NotificationBell />

        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="text-muted-foreground"
              title="Contact Support"
            >
              <Mail className="h-5 w-5" />
            </Button>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-64">
            <div className="space-y-3">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Contact Support
              </h4>
              <a
                href="mailto:ahsanmg1998@gmail.com"
                className="flex items-center gap-3 text-sm text-foreground transition-colors hover:text-primary"
              >
                <Mail className="h-4 w-4" />
                ahsanmg1998@gmail.com
              </a>
            </div>
          </PopoverContent>
        </Popover>

        <SignedIn>
          <UserButton />
        </SignedIn>
      </div>
    </header>
  );

  const orgContextBar = organization ? (
    <div className="flex items-center gap-2 border-b bg-white px-4 py-2 sm:px-6 lg:px-8">
      <Building className="h-4 w-4 shrink-0 text-muted-foreground" />
      <span className="truncate text-sm font-medium text-foreground">
        {organization.name}
      </span>
      <RoleChip role={organization.userRole || "member"} />
      <span className="hidden text-xs text-muted-foreground sm:inline">
        · All data shown belongs to this organization
      </span>
      <Tooltip delayDuration={300}>
        <TooltipTrigger asChild>
          <Shield className="h-3.5 w-3.5 text-muted-foreground" />
        </TooltipTrigger>
        <TooltipPortal>
          <TooltipContent className="bg-popover text-popover-foreground shadow-md" sideOffset={5}>
            This tag refers to ownership since you can be an owner or member of
            an organization.
            <TooltipArrow className="fill-popover" />
          </TooltipContent>
        </TooltipPortal>
      </Tooltip>
    </div>
  ) : null;

  return (
    <div className="flex min-h-screen bg-muted/40">
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {sidebar}

      <div className="flex min-w-0 flex-1 flex-col">
        {topbar}
        {orgContextBar}
        <main className="flex-1 overflow-y-auto px-4 py-6 sm:px-6 lg:px-8">
          <div className="mx-auto w-full max-w-6xl">{children}</div>
        </main>
      </div>
    </div>
  );
}

function usePageTitle(pathname: string): string {
  const segments = pathname.split("/").filter(Boolean);
  if (segments.length === 0) return "Dashboard";
  const map: Record<string, string> = {
    dashboard: "Dashboard",
    insights: "Insights",
    clients: "Clients",
    invoices: "Invoices",
    payments: "Payments",
    expenses: "Expenses",
    ledger: "Ledger",
    reports: "Reports",
    members: "Members",
    settings: "Settings",
    notifications: "Notifications",
    admin: "Admin",
    organization: "Collaboration",
    invite: "Invitations",
  };
  const key = segments[0];
  if (key === "settings") {
    if (segments[1] === "organization") {
      return segments[2] === "create"
        ? "Create Organization"
        : "Organization Settings";
    }
    if (segments[1] === "company") return "Company Settings";
    if (segments[1] === "members") return "Team Members";
    if (segments[1] === "templates") return "Templates";
    if (segments[1] === "user") return "Account";
    return "Settings";
  }
  return map[key] || "Invoxa";
}
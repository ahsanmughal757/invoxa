"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

import {
  Building,
  Palette,
  User,
  Download,
  Users,
  Settings2,
  Crown,
  CreditCard,
  Calendar,
  Zap,
  CheckCircle,
  AlertTriangle,
  Infinity,
  Clock,
  Gift
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useInvoiceContext } from "@/context/InvoiceContext";
import { useClients } from "@/hooks/use-clients";
import { usePayments } from "@/hooks/use-payments";
import { useOrganization } from "@/hooks/use-organization";
import { useExpenses } from "@/hooks/use-expenses";
import { useSubscriptionAccess } from "@/hooks/use-subscription-access";
import { useState } from "react";
import { UpgradeModal } from "@/components/subscription/upgrade-modal";

export default function SettingsPage() {
  const router = useRouter();
  const { invoices, settings } = useInvoiceContext();
  const { selectedOrganization: organization } = useOrganization();
  const { clients } = useClients();
  const { payments } = usePayments();
  const { expenses } = useExpenses();

  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  const {
    subscriptionPlan,
    currentSubscription,
    isTrialActive,
    isSubscriptionExpired,
    trialDaysRemaining,
    trialTimeRemainingSeconds,
    trialType,
    isLifetime,
    isLoading,
    trialDisplayTime
  } = useSubscriptionAccess({ fetchFromServer: true });

  const getStatusColor = () => {
    if (isLifetime) return "bg-green-100 text-green-800";
    if (isSubscriptionExpired) return "bg-red-100 text-red-800";
    if (trialType === '3min') return "bg-orange-100 text-orange-800";
    if (isTrialActive) return "bg-blue-100 text-blue-800";
    return "bg-gray-100 text-gray-800";
  };

  const getStatusIcon = () => {
    if (isLifetime) return <Infinity className="h-4 w-4" />;
    if (isSubscriptionExpired) return <AlertTriangle className="h-4 w-4" />;
    if (trialType === '3min') return <Clock className="h-4 w-4" />;
    if (isTrialActive) return <Gift className="h-4 w-4" />;
    return <User className="h-4 w-4" />;
  };

  const getStatusText = () => {
    if (isLifetime) return "Lifetime Access";
    if (isSubscriptionExpired) return "Expired";
    if (trialType === '3min' && isTrialActive) return `3-Min Trial (${trialDisplayTime})`;
    if (isTrialActive) return `14-Day Trial (${trialDaysRemaining} days left)`;
    return "No Active Plan";
  };

  const getPlanDescription = () => {
    if (isLifetime) return "Unlimited access to all features, forever";
    if (trialType === '3min' && isTrialActive) return "Quick test drive with unlimited access";
    if (isTrialActive) return "Full-featured trial with unlimited access";
    if (isSubscriptionExpired) return "Trial expired - upgrade to continue";
    return "Limited access";
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-900">Settings</h1>

      {/* Subscription Status Card */}
      <Card className={`border-2 ${isLifetime ? 'border-green-300 bg-gradient-to-r from-green-50 to-emerald-50' : 'border-purple-200 bg-gradient-to-r from-purple-50 to-pink-50'}`}>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${isLifetime ? 'bg-green-100' : 'bg-purple-100'}`}>
                {isLifetime ? (
                  <Infinity className="h-6 w-6 text-green-600" />
                ) : (
                  <Crown className="h-6 w-6 text-purple-600" />
                )}
              </div>
              <div>
                <CardTitle>Subscription & Billing</CardTitle>
                <CardDescription>
                  {getPlanDescription()}
                </CardDescription>
              </div>
            </div>
            <Badge className={getStatusColor()}>
              {getStatusIcon()}
              <span className="ml-1">{getStatusText()}</span>
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          {/* Plan Details Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <p className="text-sm text-gray-600">Current Plan</p>
              <p className="font-semibold text-lg">
                {subscriptionPlan?.name || "No Plan"}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Invoices</p>
              <p className="font-semibold text-lg">
                {subscriptionPlan?.invoiceLimit === -1 ? "∞ Unlimited" : subscriptionPlan?.invoiceLimit || "Limited"}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Clients</p>
              <p className="font-semibold text-lg">
                {subscriptionPlan?.clientLimit === -1 ? "∞ Unlimited" : subscriptionPlan?.clientLimit || "Limited"}
              </p>
            </div>
          </div>

          {/* Trial Timer for 3-minute trial */}
          {trialType === '3min' && isTrialActive && (
            <div className="mb-4 p-4 bg-orange-50 border border-orange-200 rounded-lg">
              <div className="flex items-center gap-3">
                <Clock className="h-5 w-5 text-orange-600" />
                <div className="flex-1">
                  <p className="font-medium text-orange-900">Trial Time Remaining</p>
                  <p className="text-2xl font-bold text-orange-600 font-mono">
                    {trialDisplayTime}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Trial Timer for 14-day trial */}
          {trialType === '14day' && isTrialActive && (
            <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center gap-3">
                <Calendar className="h-5 w-5 text-blue-600" />
                <div className="flex-1">
                  <p className="font-medium text-blue-900">Trial Days Remaining</p>
                  <p className="text-xl font-bold text-blue-600">
                    {trialDaysRemaining} day{trialDaysRemaining !== 1 ? 's' : ''}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Lifetime Access Badge */}
          {isLifetime && (
            <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center gap-3">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <div className="flex-1">
                  <p className="font-medium text-green-900">Lifetime Access Active</p>
                  <p className="text-sm text-green-700">
                    Thank you for your support! Enjoy unlimited access forever.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-2">
            {!isLifetime && !isSubscriptionExpired && (
              <Button
                onClick={() => setShowUpgradeModal(true)}
                className="bg-purple-600 hover:bg-purple-700"
              >
                <Crown className="h-4 w-4 mr-2" />
                Upgrade to Lifetime - $287
              </Button>
            )}
            
            {(isSubscriptionExpired || (!isLifetime && !isTrialActive)) && (
              <Button
                onClick={() => setShowUpgradeModal(true)}
                className="bg-purple-600 hover:bg-purple-700"
              >
                <Crown className="h-4 w-4 mr-2" />
                {isSubscriptionExpired ? "Renew Access" : "Get Lifetime Access"} - $287
              </Button>
            )}

            {isLifetime && (
              <Button
                variant="outline"
                disabled
                className="bg-green-50 text-green-700 border-green-300"
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Lifetime Access Active
              </Button>
            )}
          </div>

          {/* Features List */}
          <div className="mt-6 pt-4 border-t border-gray-200">
            <p className="text-sm font-medium text-gray-700 mb-3">All Plans Include:</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {[
                "Unlimited Invoices",
                "Unlimited Clients",
                "All Templates",
                "Payment Tracking",
                "Expense Tracking",
                "Reports",
                "Auto Reminders",
                "Multi-Currency"
              ].map((feature, idx) => (
                <div key={idx} className="flex items-center gap-1 text-xs text-gray-600">
                  <CheckCircle className="h-3 w-3 text-green-600 flex-shrink-0" />
                  <span>{feature}</span>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Settings Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Button
          variant="outline"
          onClick={() => router.push("/settings/company")}
          className="flex items-center justify-center p-6 h-auto"
        >
          <div className="text-center">
            <Building className="h-8 w-8 mx-auto mb-2" />
            <div className="font-medium">Company</div>
            <div className="text-sm text-gray-600">Business details</div>
          </div>
        </Button>

        <Button
          variant="outline"
          onClick={() => router.push("/settings/templates")}
          className="flex items-center justify-center p-6 h-auto"
        >
          <div className="text-center">
            <Palette className="h-8 w-8 mx-auto mb-2" />
            <div className="font-medium">Templates</div>
            <div className="text-sm text-gray-600">Invoice designs</div>
          </div>
        </Button>

        <Button
          variant="outline"
          onClick={() => router.push("/settings/user")}
          className="flex items-center justify-center p-6 h-auto"
        >
          <div className="text-center">
            <User className="h-8 w-8 mx-auto mb-2" />
            <div className="font-medium">Preferences</div>
            <div className="text-sm text-gray-600">User settings</div>
          </div>
        </Button>

        <Button
          variant="outline"
          onClick={() => router.push("/settings/members")}
          className="flex items-center justify-center p-6 h-auto"
        >
          <div className="text-center">
            <Users className="h-8 w-8 mx-auto mb-2" />
            <div className="font-medium">Members</div>
            <div className="text-sm text-gray-600">Manage team</div>
          </div>
        </Button>

        <Button
          variant="outline"
          onClick={() => router.push("/settings/organization")}
          className="flex items-center justify-center p-6 h-auto"
        >
          <div className="text-center">
            <Settings2 className="h-8 w-8 mx-auto mb-2" />
            <div className="font-medium">Organization</div>
            <div className="text-sm text-gray-600">Org settings</div>
          </div>
        </Button>

        <Button
          variant="outline"
          onClick={() => {
            const data = {
              invoices,
              clients,
              payments,
              expenses,
              organization,
              settings,
            };
            const blob = new Blob([JSON.stringify(data, null, 2)], {
              type: "application/json",
            });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `invoice-data-backup-${new Date().toISOString().split("T")[0]}.json`;
            a.click();
            URL.revokeObjectURL(url);
          }}
          className="flex items-center justify-center p-6 h-auto"
        >
          <div className="text-center">
            <Download className="h-8 w-8 mx-auto mb-2" />
            <div className="font-medium">Backup</div>
            <div className="text-sm text-gray-600">Export data</div>
          </div>
        </Button>
      </div>

      <UpgradeModal
        open={showUpgradeModal}
        onOpenChange={setShowUpgradeModal}
        onUpgradeSuccess={() => {
          setShowUpgradeModal(false);
        }}
      />
    </div>
  );
}

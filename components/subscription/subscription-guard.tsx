"use client";

import { ReactNode, useState } from "react";
import {
  useSubscriptionAccess,
  FeatureKey,
} from "@/hooks/use-subscription-access";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Lock, Crown, Zap, AlertTriangle } from "lucide-react";
import { UpgradeModal } from "./upgrade-modal";

interface SubscriptionGuardProps {
  feature: FeatureKey;
  children: ReactNode;
  fallback?: ReactNode;
  hideable?: boolean;
  showUpgradePrompt?: boolean;
  onUpgrade?: () => void;
}

export function SubscriptionGuard({
  feature,
  children,
  hideable,
  fallback,
  showUpgradePrompt = true,
  onUpgrade,
}: SubscriptionGuardProps) {
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const {
    hasFeature,
    getUpgradeMessage,
    subscriptionPlan,
    isTrialActive,
    isSubscriptionExpired,
    shouldBlockAccess,
  } = useSubscriptionAccess({ fetchFromServer: true });

  // Block access if subscription/trial is expired
  if (isSubscriptionExpired || shouldBlockAccess) {
    if (hideable) {
      return null;
    }

    return (
      <Card className="border-red-200 bg-red-50">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center text-red-900">
            <AlertTriangle className="h-5 w-5 mr-2" />
            Subscription Expired
            <Badge className="ml-2 bg-red-100 text-red-800">
              Action Required
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-red-700 mb-4">
            Your trial has expired. Upgrade to a paid plan to continue using
            this feature.
          </p>
          <div className="flex items-center space-x-2">
            <Button
              onClick={() => setShowUpgradeModal(true)}
              className="flex items-center"
            >
              <Crown className="h-4 w-4 mr-2" />
              Upgrade Plan
            </Button>
          </div>
        </CardContent>
        <UpgradeModal
          open={showUpgradeModal}
          onOpenChange={setShowUpgradeModal}
          onUpgradeSuccess={() => {
            setShowUpgradeModal(false);
            onUpgrade?.();
          }}
        />
      </Card>
    );
  }

  if (hideable && !hasFeature(feature)) {
    return null;
  }

  if (hasFeature(feature)) {
    return <>{children}</>;
  }

  if (fallback) {
    return <>{fallback}</>;
  }

  if (!showUpgradePrompt) {
    return null;
  }

  return (
    <Card className="border-orange-200 bg-orange-50">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center text-orange-900">
          <Lock className="h-5 w-5 mr-2" />
          Feature Locked
          <Badge className="ml-2 bg-orange-100 text-orange-800">
            {subscriptionPlan?.name || "Free"} Plan
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-orange-700 mb-4">{getUpgradeMessage(feature)}</p>
        {isTrialActive && (
          <div className="flex items-center mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <Zap className="h-4 w-4 text-blue-600 mr-2" />
            <span className="text-sm text-blue-700">
              You're currently on a trial. This feature will be available after
              upgrading.
            </span>
          </div>
        )}
        <div className="flex items-center space-x-2">
          <Button
            onClick={() => setShowUpgradeModal(true)}
            className="flex items-center"
          >
            <Crown className="h-4 w-4 mr-2" />
            Upgrade Plan
          </Button>
          <Button variant="outline" size="sm">
            Learn More
          </Button>
        </div>
      </CardContent>
      <UpgradeModal
        open={showUpgradeModal}
        onOpenChange={setShowUpgradeModal}
        onUpgradeSuccess={() => {
          setShowUpgradeModal(false);
          onUpgrade?.();
        }}
      />
    </Card>
  );
}

interface LimitGuardProps {
  type: "invoice" | "client";
  current: number;
  children: ReactNode;
  onUpgrade?: () => void;
}

export function LimitGuard({
  type,
  current,
  children,
  onUpgrade,
}: LimitGuardProps) {
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const {
    subscriptionPlan,
    canCreateInvoice,
    canAddClient,
    remainingInvoices,
    remainingClients,
    isSubscriptionExpired,
    shouldBlockAccess,
  } = useSubscriptionAccess({
    invoiceCount: type === "invoice" ? current : 0,
    clientCount: type === "client" ? current : 0,
    fetchFromServer: true,
  });

  // Block if subscription expired
  if (isSubscriptionExpired || shouldBlockAccess) {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center text-red-900">
            <AlertTriangle className="h-5 w-5 mr-2" />
            Subscription Expired
            <Badge className="ml-2 bg-red-100 text-red-800">
              Action Required
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-red-700 mb-4">
            Your trial has expired. Upgrade to continue creating{" "}
            {type === "invoice" ? "invoices" : "clients"}.
          </p>
          <div className="flex items-center space-x-2">
            <Button
              onClick={() => setShowUpgradeModal(true)}
              className="flex items-center"
            >
              <Crown className="h-4 w-4 mr-2" />
              Upgrade Plan
            </Button>
          </div>
        </CardContent>
        <UpgradeModal
          open={showUpgradeModal}
          onOpenChange={setShowUpgradeModal}
          onUpgradeSuccess={() => {
            setShowUpgradeModal(false);
            onUpgrade?.();
          }}
        />
      </Card>
    );
  }

  const canProceed = type === "invoice" ? canCreateInvoice : canAddClient;
  const remaining = type === "invoice" ? remainingInvoices : remainingClients;
  const limit =
    type === "invoice"
      ? subscriptionPlan?.invoiceLimit
      : subscriptionPlan?.clientLimit;

  if (canProceed) {
    return <>{children}</>;
  }

  const itemName = type === "invoice" ? "invoice" : "client";
  const itemNamePlural = type === "invoice" ? "invoices" : "clients";

  return (
    <Card className="border-red-200 bg-red-50">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center text-red-900">
          <AlertTriangle className="h-5 w-5 mr-2" />
          {type === "invoice" ? "Invoice" : "Client"} Limit Reached
          <Badge className="ml-2 bg-red-100 text-red-800">
            {current}/{limit === -1 ? "∞" : limit}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-red-700 mb-4">
          You've reached your {itemName} limit of{" "}
          {limit === -1 ? "unlimited" : limit} {itemNamePlural}
          on the {subscriptionPlan?.name || "Free"} plan. Upgrade to create more{" "}
          {itemNamePlural}.
        </p>
        <div className="flex items-center space-x-2">
          <Button
            onClick={() => setShowUpgradeModal(true)}
            className="flex items-center"
          >
            <Crown className="h-4 w-4 mr-2" />
            Upgrade Plan
          </Button>
          <Button variant="outline" size="sm">
            Manage {itemNamePlural}
          </Button>
        </div>
      </CardContent>
      <UpgradeModal
        open={showUpgradeModal}
        onOpenChange={setShowUpgradeModal}
        onUpgradeSuccess={() => {
          setShowUpgradeModal(false);
          onUpgrade?.();
        }}
      />
    </Card>
  );
}

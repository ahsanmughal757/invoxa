"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { TrialBanner } from "./trial-banner";
import { UpgradeModal } from "./upgrade-modal";
import { useSubscriptionAccess } from "@/hooks/use-subscription-access";
import { Loader2, Infinity, Crown } from "lucide-react";

interface SubscriptionWrapperProps {
  children: React.ReactNode;
}

const SubscriptionWrapper = ({ children }: SubscriptionWrapperProps) => {
  const router = useRouter();
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [isBannerDismissed, setIsBannerDismissed] = useState(false);

  const {
    isTrialActive,
    isSubscriptionExpired,
    shouldBlockAccess,
    isLoading,
    isLifetime,
    trialType,
  } = useSubscriptionAccess({ fetchFromServer: true });

  // Show upgrade modal automatically if subscription is expired
  useEffect(() => {
    if (isSubscriptionExpired || shouldBlockAccess) {
      setShowUpgradeModal(true);
    }
  }, [isSubscriptionExpired, shouldBlockAccess]);

  // Show loading state while checking subscription
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Checking subscription...</p>
        </div>
      </div>
    );
  }

  // Block access if trial expired and not lifetime
  const shouldBlock =
    (isSubscriptionExpired || shouldBlockAccess) && !isLifetime;

  return (
    <>
      {/* Trial/Expiration Banner */}
      {!isBannerDismissed && (
        <TrialBanner
          onUpgrade={() => setShowUpgradeModal(true)}
          onDismiss={() => setIsBannerDismissed(true)}
        />
      )}
      {/* Upgrade Modal */}
      <UpgradeModal
        open={showUpgradeModal}
        onOpenChange={setShowUpgradeModal}
        onUpgradeSuccess={() => {
          setShowUpgradeModal(false);
          // Refresh the page to update subscription status
          router.refresh();
        }}
      />

      {/* Content */}
      <div className={shouldBlock ? "pointer-events-none select-none" : ""}>
        {children}
      </div>

      {/* Blocking Overlay for Expired Trial */}
      {shouldBlock && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-lg shadow-xl p-8 max-w-md mx-4 text-center">
            <div className="mb-4">
              <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                <svg
                  className="w-8 h-8 text-red-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                  />
                </svg>
              </div>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              {trialType === "3min" ? "3-Minute" : "Trial"} Period Expired
            </h2>
            <p className="text-gray-600 mb-6">
              Your trial has ended. Upgrade to Lifetime Access to continue using
              the app.
            </p>
            <button
              onClick={() => setShowUpgradeModal(true)}
              className="w-full bg-purple-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-purple-700 transition-colors flex items-center justify-center gap-2"
            >
              <Crown className="h-5 w-5" />
              Upgrade to Lifetime - $287
            </button>
            <p className="text-xs text-gray-500 mt-4">
              Your data is safe and will be accessible after upgrading
            </p>
          </div>
        </div>
      )}

      {/* Lifetime Access Badge (optional overlay) */}
      {isLifetime && (
        <div className="fixed bottom-4 right-4 z-[99]">
          <div className="bg-gradient-to-r from-green-600 to-emerald-600 text-white px-4 py-2 rounded-full shadow-lg flex items-center gap-2 text-sm font-medium">
            <Infinity className="h-4 w-4" />
            Lifetime Access
          </div>
        </div>
      )}
    </>
  );
};

export default SubscriptionWrapper;

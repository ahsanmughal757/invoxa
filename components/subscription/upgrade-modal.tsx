"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Check, CheckCircle, Crown, Loader2, Infinity, Zap, Heart } from "lucide-react";
import { useSubscriptionAccess } from "@/hooks/use-subscription-access";
import { upgradeToLifetimeAction } from "@/lib/actions/subscription.actions";
import toast from "react-hot-toast";

interface UpgradeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpgradeSuccess?: () => void;
}

export function UpgradeModal({ 
  open, 
  onOpenChange, 
  onUpgradeSuccess 
}: UpgradeModalProps) {
  const [isUpgrading, setIsUpgrading] = useState(false);
  const { isLifetime, trialType, isTrialActive } = useSubscriptionAccess({ fetchFromServer: true });

  const handleUpgrade = async () => {
    try {
      setIsUpgrading(true);
      const result = await upgradeToLifetimeAction();
      
      if (result.success) {
        toast.success(`Successfully upgraded to Lifetime Access!`);
        onOpenChange(false);
        onUpgradeSuccess?.();
      } else {
        toast.error(result.error || "Failed to upgrade subscription");
      }
    } catch (error) {
      console.error("Upgrade error:", error);
      toast.error("An unexpected error occurred");
    } finally {
      setIsUpgrading(false);
    }
  };

  // Already lifetime user
  if (isLifetime) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold flex items-center gap-2">
              <Infinity className="h-6 w-6 text-green-600" />
              Lifetime Access
            </DialogTitle>
            <DialogDescription>
              You already have lifetime access to all features.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-center py-8">
            <div className="text-center">
              <CheckCircle className="h-16 w-16 text-green-600 mx-auto mb-4" />
              <p className="text-lg font-semibold text-gray-900">Thank you for your support!</p>
              <p className="text-gray-600 mt-2">Enjoy unlimited access forever.</p>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => onOpenChange(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">
            {trialType === '3min' && isTrialActive 
              ? "Upgrade Before Trial Ends!" 
              : "Upgrade to Lifetime Access"}
          </DialogTitle>
          <DialogDescription>
            {trialType === '3min' && isTrialActive
              ? "Your 3-minute trial is running out. Upgrade now to keep unlimited access."
              : "One-time payment for unlimited access forever."}
          </DialogDescription>
        </DialogHeader>

        {/* Lifetime Plan Card */}
        <Card className="border-purple-500 bg-gradient-to-br from-purple-50 to-pink-50 ring-2 ring-purple-500 my-4">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Crown className="h-8 w-8 text-purple-600" />
                </div>
                <div>
                  <CardTitle className="text-2xl">Lifetime Access</CardTitle>
                  <CardDescription>One payment, unlimited forever</CardDescription>
                </div>
              </div>
              <Badge className="bg-purple-600 text-white px-3 py-1">
                Best Value
              </Badge>
            </div>
          </CardHeader>
          
          <CardContent className="space-y-6">
            {/* Price */}
            <div className="flex items-baseline gap-2">
              <span className="text-5xl font-bold text-purple-900">$287</span>
              <span className="text-lg text-gray-600">one-time payment</span>
            </div>

            {/* Features */}
            <div className="space-y-3">
              <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                <Heart className="h-5 w-5 text-purple-600" />
                Everything Included:
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {[
                  "Unlimited Invoices",
                  "Unlimited Clients",
                  "All Invoice Templates",
                  "Payment Tracking",
                  "Expense Tracking",
                  "Reports & Analytics",
                  "Automated Reminders",
                  "Recurring Invoices",
                  "Multi-Currency Support",
                  "PDF Customization",
                  "Team Collaboration",
                  "Priority Support",
                  "API Access",
                  "White Label Option",
                  "Bulk Operations",
                  "Backup & Restore"
                ].map((feature, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-600 flex-shrink-0" />
                    <span className="text-sm text-gray-700">{feature}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Value Proposition */}
            <div className="bg-white rounded-lg p-4 border border-purple-200">
              <div className="flex items-start gap-3">
                <Zap className="h-5 w-5 text-purple-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-gray-900">Why Lifetime?</p>
                  <p className="text-sm text-gray-600 mt-1">
                    Save money in the long run with a single payment. No monthly fees, no surprises. 
                    Access all features forever with one affordable payment.
                  </p>
                </div>
              </div>
            </div>

            {/* Upgrade Button */}
            <Button
              className="w-full h-14 text-lg bg-purple-600 hover:bg-purple-700"
              onClick={handleUpgrade}
              disabled={isUpgrading}
            >
              {isUpgrading ? (
                <>
                  <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Crown className="h-5 w-5 mr-2" />
                  Get Lifetime Access - $287
                </>
              )}
            </Button>

            {/* Guarantee */}
            <div className="text-center">
              <p className="text-sm text-gray-500">
                🔒 Secure payment • Instant activation • Lifetime guarantee
              </p>
            </div>
          </CardContent>
        </Card>

        <DialogFooter className="border-t pt-4">
          <div className="text-sm text-gray-500 text-center w-full">
            Questions? Contact our support team for assistance.
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

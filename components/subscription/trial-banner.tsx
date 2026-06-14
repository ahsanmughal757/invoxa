"use client";

import { useEffect, useState } from "react";
import { useSubscriptionAccess } from "@/hooks/use-subscription-access";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  AlertTriangle, 
  Gift, 
  Clock, 
  X,
  Crown,
  Zap,
  CheckCircle,
  Infinity
} from "lucide-react";
import { cn } from "@/lib/utils";

interface TrialBannerProps {
  onUpgrade?: () => void;
  onDismiss?: () => void;
  className?: string;
}

export function TrialBanner({ 
  onUpgrade, 
  onDismiss,
  className 
}: TrialBannerProps) {
  const [isDismissed, setIsDismissed] = useState(false);
  const [seconds, setSeconds] = useState(0);
  
  const {
    isTrialActive,
    trialDaysRemaining,
    trialTimeRemainingSeconds,
    trialType,
    isSubscriptionExpired,
    shouldBlockAccess,
    isLifetime,
    subscriptionPlan
  } = useSubscriptionAccess({ fetchFromServer: true });

  // Countdown timer for 3-minute trial
  useEffect(() => {
    if (trialType === '3min' && isTrialActive) {
      const timer = setInterval(() => {
        setSeconds(prev => Math.max(0, prev - 1));
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [trialType, isTrialActive]);

  // Initialize seconds from server
  useEffect(() => {
    if (trialType === '3min') {
      setSeconds(trialTimeRemainingSeconds);
    }
  }, [trialType, trialTimeRemainingSeconds]);

  useEffect(() => {
    // Reset dismissed state when component unmounts
    return () => setIsDismissed(false);
  }, []);

  // Don't show banner if dismissed
  if (isDismissed) {
    return null;
  }

  // Lifetime Access Banner (optional, can be dismissed)
  if (isLifetime) {
    return (
      <div 
        className={cn(
          "fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-green-600 to-emerald-600 text-white px-4 py-3 shadow-lg",
          className
        )}
      >
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 flex-1">
            <div className="p-1.5 bg-white/20 rounded-full">
              <Infinity className="h-4 w-4" />
            </div>
            <div>
              <p className="font-medium text-sm">
                Lifetime Access
              </p>
              <p className="text-xs text-green-100">
                Unlimited access to all features, forever
              </p>
            </div>
          </div>
          {onDismiss && (
            <Button
              size="sm"
              variant="ghost"
              className="text-white hover:bg-white/20"
              onClick={() => {
                setIsDismissed(true);
                onDismiss?.();
              }}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    );
  }

  // Expired subscription/trial banner
  if (isSubscriptionExpired || shouldBlockAccess) {
    return (
      <div 
        className={cn(
          "fixed top-0 left-0 right-0 z-50 bg-red-600 text-white px-4 py-3 shadow-lg",
          className
        )}
      >
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 flex-1">
            <AlertTriangle className="h-5 w-5 flex-shrink-0" />
            <div>
              <p className="font-medium text-sm">
                {trialType === '3min' ? '3-Minute Trial' : 'Trial'} Expired
              </p>
              <p className="text-xs text-red-100">
                Upgrade to Lifetime Access to continue using the app
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <Button 
              size="sm" 
              variant="secondary"
              onClick={onUpgrade}
              className="bg-white text-red-600 hover:bg-red-50"
            >
              <Crown className="h-4 w-4 mr-1" />
              Upgrade - $287
            </Button>
            {onDismiss && (
              <Button
                size="sm"
                variant="ghost"
                className="text-white hover:bg-red-700"
                onClick={() => {
                  setIsDismissed(true);
                  onDismiss?.();
                }}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // 3-Minute Trial Warning (< 1 minute)
  if (trialType === '3min' && isTrialActive && trialTimeRemainingSeconds <= 60 && trialTimeRemainingSeconds > 0) {
    const mins = Math.floor(trialTimeRemainingSeconds / 60);
    const secs = trialTimeRemainingSeconds % 60;
    const timeLeft = `${mins}:${secs.toString().padStart(2, '0')}`;
    
    return (
      <div 
        className={cn(
          "fixed top-0 left-0 right-0 z-50 bg-orange-500 text-white px-4 py-3 shadow-lg animate-pulse",
          className
        )}
      >
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 flex-1">
            <Clock className="h-5 w-5 flex-shrink-0" />
            <div>
              <p className="font-medium text-sm">
                {timeLeft} remaining in trial
              </p>
              <p className="text-xs text-orange-100">
                Upgrade now to avoid losing access
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <Button 
              size="sm" 
              variant="secondary"
              onClick={onUpgrade}
              className="bg-white text-orange-600 hover:bg-orange-50"
            >
              <Crown className="h-4 w-4 mr-1" />
              Upgrade - $287
            </Button>
            {onDismiss && (
              <Button
                size="sm"
                variant="ghost"
                className="text-white hover:bg-orange-600"
                onClick={() => {
                  setIsDismissed(true);
                  onDismiss?.();
                }}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // 3-Minute Trial Active (> 1 minute)
  if (trialType === '3min' && isTrialActive && trialTimeRemainingSeconds > 0) {
    const mins = Math.floor(trialTimeRemainingSeconds / 60);
    const secs = trialTimeRemainingSeconds % 60;
    const timeLeft = `${mins}:${secs.toString().padStart(2, '0')}`;
    
    return (
      <div 
        className={cn(
          "fixed top-0 left-0 right-0 z-50 bg-blue-600 text-white px-4 py-3 shadow-lg",
          className
        )}
      >
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 flex-1">
            <Gift className="h-5 w-5 flex-shrink-0" />
            <div>
              <p className="font-medium text-sm">
                {timeLeft} left in trial
              </p>
              <p className="text-xs text-blue-100">
                Unlimited access to all features
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <Button 
              size="sm" 
              variant="secondary"
              onClick={onUpgrade}
              className="bg-white text-blue-600 hover:bg-blue-50"
            >
              <Crown className="h-4 w-4 mr-1" />
              Upgrade - $287
            </Button>
            {onDismiss && (
              <Button
                size="sm"
                variant="ghost"
                className="text-white hover:bg-blue-700"
                onClick={() => {
                  setIsDismissed(true);
                  onDismiss?.();
                }}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // 14-Day Trial warning (< 3 days)
  if (trialType === '14day' && isTrialActive && trialDaysRemaining <= 3 && trialDaysRemaining > 0) {
    return (
      <div 
        className={cn(
          "fixed top-0 left-0 right-0 z-50 bg-orange-500 text-white px-4 py-3 shadow-lg",
          className
        )}
      >
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 flex-1">
            <Clock className="h-5 w-5 flex-shrink-0" />
            <div>
              <p className="font-medium text-sm">
                {trialDaysRemaining} {trialDaysRemaining === 1 ? 'day' : 'days'} left in trial
              </p>
              <p className="text-xs text-orange-100">
                Upgrade to Lifetime Access to avoid losing access
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <Button 
              size="sm" 
              variant="secondary"
              onClick={onUpgrade}
              className="bg-white text-orange-600 hover:bg-orange-50"
            >
              <Crown className="h-4 w-4 mr-1" />
              Upgrade - $287
            </Button>
            {onDismiss && (
              <Button
                size="sm"
                variant="ghost"
                className="text-white hover:bg-orange-600"
                onClick={() => {
                  setIsDismissed(true);
                  onDismiss?.();
                }}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // 14-Day Trial Active (> 3 days)
  if (trialType === '14day' && isTrialActive && trialDaysRemaining > 0) {
    return (
      <div 
        className={cn(
          "fixed top-0 left-0 right-0 z-50 bg-blue-600 text-white px-4 py-3 shadow-lg",
          className
        )}
      >
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 flex-1">
            <Gift className="h-5 w-5 flex-shrink-0" />
            <div>
              <p className="font-medium text-sm">
                {trialDaysRemaining} {trialDaysRemaining === 1 ? 'day' : 'days'} left in trial
              </p>
              <p className="text-xs text-blue-100">
                Unlimited access to all features
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <Button 
              size="sm" 
              variant="secondary"
              onClick={onUpgrade}
              className="bg-white text-blue-600 hover:bg-blue-50"
            >
              <Zap className="h-4 w-4 mr-1" />
              Upgrade Early - $287
            </Button>
            {onDismiss && (
              <Button
                size="sm"
                variant="ghost"
                className="text-white hover:bg-blue-700"
                onClick={() => {
                  setIsDismissed(true);
                  onDismiss?.();
                }}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return null;
}

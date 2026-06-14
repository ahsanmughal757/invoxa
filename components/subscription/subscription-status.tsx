"use client"

import { useSubscriptionAccess } from '@/hooks/use-subscription-access'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { 
  Crown, 
  Calendar, 
  Users, 
  FileText, 
  AlertTriangle, 
  CheckCircle,
  Gift,
  Zap
} from 'lucide-react'

interface SubscriptionStatusProps {
  invoiceCount: number
  clientCount: number
  onUpgrade?: () => void
  onManageSubscription?: () => void
}

export function SubscriptionStatus({ 
  invoiceCount, 
  clientCount, 
  onUpgrade, 
  onManageSubscription 
}: SubscriptionStatusProps) {
  const {
    subscriptionPlan,
    currentSubscription,
    isTrialActive,
    isSubscriptionExpired,
    trialDaysRemaining,
    remainingInvoices,
    remainingClients
  } = useSubscriptionAccess({ invoiceCount, clientCount })

  if (!subscriptionPlan) return null

  const getStatusColor = () => {
    if (isSubscriptionExpired) return 'bg-red-100 text-red-800'
    if (isTrialActive) return 'bg-blue-100 text-blue-800'
    if (subscriptionPlan.id === 'free') return 'bg-gray-100 text-gray-800'
    return 'bg-green-100 text-green-800'
  }

  const getStatusIcon = () => {
    if (isSubscriptionExpired) return <AlertTriangle className="h-4 w-4" />
    if (isTrialActive) return <Gift className="h-4 w-4" />
    if (subscriptionPlan.id === 'free') return <Zap className="h-4 w-4" />
    return <CheckCircle className="h-4 w-4" />
  }

  const getStatusText = () => {
    if (isSubscriptionExpired) return 'Expired'
    if (isTrialActive) return `Trial (${trialDaysRemaining} days left)`
    return subscriptionPlan.name
  }

  const invoiceUsagePercent = subscriptionPlan.invoiceLimit === -1 ? 0 : 
    (invoiceCount / subscriptionPlan.invoiceLimit) * 100

  const clientUsagePercent = subscriptionPlan.clientLimit === -1 ? 0 : 
    (clientCount / subscriptionPlan.clientLimit) * 100

  return (
    <Card className="mb-4">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center">
            <Crown className="h-5 w-5 mr-2 text-blue-600" />
            Subscription Status
          </CardTitle>
          <Badge className={getStatusColor()}>
            {getStatusIcon()}
            <span className="ml-1">{getStatusText()}</span>
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Plan Information */}
        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
          <div>
            <div className="font-medium">{subscriptionPlan.name} Plan</div>
            <div className="text-sm text-gray-600">
              ${subscriptionPlan.price}/{subscriptionPlan.billingCycle}
            </div>
          </div>
          {currentSubscription && (
            <div className="text-right text-sm text-gray-600">
              <div className="flex items-center">
                <Calendar className="h-3 w-3 mr-1" />
                Renews: {new Date(currentSubscription.currentPeriodEnd).toLocaleDateString()}
              </div>
            </div>
          )}
        </div>

        {/* Trial Warning */}
        {isTrialActive && (
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center">
              <Gift className="h-4 w-4 text-blue-600 mr-2" />
              <div>
                <div className="font-medium text-blue-900">Trial Active</div>
                <div className="text-sm text-blue-700">
                  {trialDaysRemaining} days remaining. Upgrade to continue using all features.
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Expiration Warning */}
        {isSubscriptionExpired && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center">
              <AlertTriangle className="h-4 w-4 text-red-600 mr-2" />
              <div>
                <div className="font-medium text-red-900">Subscription Expired</div>
                <div className="text-sm text-red-700">
                  Your subscription expired. Renew to continue using premium features.
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Usage Limits */}
        <div className="space-y-3">
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center text-sm">
                <FileText className="h-4 w-4 mr-1" />
                Invoices
              </div>
              <div className="text-sm text-gray-600">
                {invoiceCount}/{subscriptionPlan.invoiceLimit === -1 ? '∞' : subscriptionPlan.invoiceLimit}
              </div>
            </div>
            {subscriptionPlan.invoiceLimit !== -1 && (
              <Progress value={invoiceUsagePercent} className="h-2" />
            )}
            {remainingInvoices !== -1 && remainingInvoices <= 5 && (
              <div className="text-xs text-orange-600 mt-1">
                {remainingInvoices} invoices remaining
              </div>
            )}
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center text-sm">
                <Users className="h-4 w-4 mr-1" />
                Clients
              </div>
              <div className="text-sm text-gray-600">
                {clientCount}/{subscriptionPlan.clientLimit === -1 ? '∞' : subscriptionPlan.clientLimit}
              </div>
            </div>
            {subscriptionPlan.clientLimit !== -1 && (
              <Progress value={clientUsagePercent} className="h-2" />
            )}
            {remainingClients !== -1 && remainingClients <= 2 && (
              <div className="text-xs text-orange-600 mt-1">
                {remainingClients} clients remaining
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex space-x-2 pt-2">
          {(subscriptionPlan.id === 'free' || isTrialActive || isSubscriptionExpired) && (
            <Button onClick={onUpgrade} className="flex-1">
              <Crown className="h-4 w-4 mr-2" />
              Upgrade Plan
            </Button>
          )}
          {currentSubscription && !isTrialActive && (
            <Button variant="outline" onClick={onManageSubscription} className="flex-1">
              Manage Subscription
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
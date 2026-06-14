import { useState, useEffect, useMemo, useCallback } from 'react'
import { ClientSubscription, SubscriptionPlan } from '@/types/invoice'
import { getSubscriptionStatusAction } from '@/lib/actions/subscription.actions'

// Define available features (all features included in all plans)
export const FEATURES = {
  BASIC_INVOICING: 'basic_invoicing',
  CLIENT_MANAGEMENT: 'client_management',
  PAYMENT_TRACKING: 'payment_tracking',
  EXPENSE_TRACKING: 'expense_tracking',
  CUSTOM_TEMPLATES: 'custom_templates',
  REPORTS_ANALYTICS: 'reports_analytics',
  MULTI_CURRENCY: 'multi_currency',
  EMAIL_SUPPORT: 'email_support',
  PRIORITY_SUPPORT: 'priority_support',
  API_ACCESS: 'api_access',
  WHITE_LABEL: 'white_label',
  BULK_OPERATIONS: 'bulk_operations',
  ADVANCED_REPORTING: 'advanced_reporting',
  TEAM_COLLABORATION: 'team_collaboration',
  AUTOMATED_REMINDERS: 'automated_reminders',
  RECURRING_INVOICES: 'recurring_invoices',
  PDF_CUSTOMIZATION: 'pdf_customization',
  BACKUP_RESTORE: 'backup_restore'
} as const

export type FeatureKey = typeof FEATURES[keyof typeof FEATURES]

// All features array
const ALL_FEATURES = Object.values(FEATURES)

// Subscription plans - Three Tier System
// 1. 3-Minute Trial - Unlimited everything, expires in 3 minutes
// 2. 14-Day Trial - Unlimited everything, expires in 14 days
// 3. Lifetime Access - $287 one-time payment, unlimited forever
export const SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
  {
    id: '3min-trial',
    name: '3-Minute Trial',
    price: 0,
    currency: 'USD',
    billingCycle: 'one-time',
    invoiceLimit: -1,  // Unlimited
    clientLimit: -1,   // Unlimited
    features: ALL_FEATURES,
    description: 'Quick test drive with unlimited access'
  },
  {
    id: '14day-trial',
    name: '14-Day Trial',
    price: 0,
    currency: 'USD',
    billingCycle: 'one-time',
    invoiceLimit: -1,  // Unlimited
    clientLimit: -1,   // Unlimited
    features: ALL_FEATURES,
    description: 'Full-featured trial for 14 days',
    isPopular: true
  },
  {
    id: 'lifetime',
    name: 'Lifetime Access',
    price: 287,
    currency: 'USD',
    billingCycle: 'one-time',
    invoiceLimit: -1,  // Unlimited
    clientLimit: -1,   // Unlimited
    features: ALL_FEATURES,
    description: 'One-time payment, unlimited access forever'
  }
]

interface UseSubscriptionAccessProps {
  currentSubscription?: ClientSubscription | null
  invoiceCount?: number
  clientCount?: number
  fetchFromServer?: boolean
}

export function useSubscriptionAccess({
  currentSubscription,
  invoiceCount = 0,
  clientCount = 0,
  fetchFromServer = false
}: UseSubscriptionAccessProps = {}) {
  const [isLoading, setIsLoading] = useState(fetchFromServer)
  const [serverSubscription, setServerSubscription] = useState<ClientSubscription | null>(null)
  const [serverIsTrialActive, setServerIsTrialActive] = useState(false)
  const [serverTrialDaysRemaining, setServerTrialDaysRemaining] = useState(0)
  const [serverTrialTimeRemainingSeconds, setServerTrialTimeRemainingSeconds] = useState(0)
  const [serverTrialType, setServerTrialType] = useState<"3min" | "14day" | null>(null)
  const [serverIsLifetime, setServerIsLifetime] = useState(false)
  const [serverIsExpired, setServerIsExpired] = useState(false)
  const [serverHasUsedTrial, setServerHasUsedTrial] = useState(false)

  // Fetch subscription from server if requested
  useEffect(() => {
    if (!fetchFromServer) {
      setIsLoading(false)
      return
    }

    async function fetchSubscription() {
      try {
        const result = await getSubscriptionStatusAction()
        if (result.subscription) {
          // Convert server subscription to ClientSubscription format
          const converted: ClientSubscription = {
            id: result.subscription.id,
            clientId: result.subscription.user_id,
            clientName: '',
            clientEmail: '',
            plan: result.subscription.plan,
            status: result.subscription.status,
            startDate: new Date(result.subscription.start_date),
            currentPeriodEnd: new Date(result.subscription.end_date),
            trialEnd: result.subscription.trial_end_date ? new Date(result.subscription.trial_end_date) : undefined,
            isTrialActive: result.subscription.is_trial && result.subscription.status === 'trial',
            trialType: result.subscription.trial_type,
            isLifetime: result.subscription.is_lifetime,
            invoiceLimit: result.subscription.invoice_limit,
            clientLimit: result.subscription.client_limit,
            features: result.subscription.features || [],
            autoRenew: true,
            createdAt: new Date(result.subscription.start_date),
            updatedAt: new Date()
          }
          setServerSubscription(converted)
        }
        setServerIsTrialActive(result.isTrialActive)
        setServerTrialDaysRemaining(result.trialDaysRemaining)
        setServerTrialTimeRemainingSeconds(result.trialTimeRemainingSeconds)
        setServerTrialType(result.trialType)
        setServerIsLifetime(result.isLifetime)
        setServerIsExpired(result.isExpired)
        setServerHasUsedTrial(result.hasUsedTrial)
      } catch (error) {
        console.error('Error fetching subscription:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchSubscription()
  }, [fetchFromServer])

  // Use server subscription if fetching from server, otherwise use prop
  const effectiveSubscription = fetchFromServer ? serverSubscription : currentSubscription

  useEffect(() => {
    if (!fetchFromServer) {
      const timer = setTimeout(() => setIsLoading(false), 100)
      return () => clearTimeout(timer)
    }
  }, [fetchFromServer, effectiveSubscription])

  const subscriptionPlan = useMemo(() => {
    if (!effectiveSubscription) {
      return SUBSCRIPTION_PLANS.find(plan => plan.id === '3min-trial')
    }
    return SUBSCRIPTION_PLANS.find(plan => plan.id === effectiveSubscription.plan)
  }, [effectiveSubscription])

  const hasFeature = useCallback((feature: FeatureKey): boolean => {
    // All plans include all features
    return true
  }, [])

  const canCreateInvoice = useCallback((): boolean => {
    // All plans have unlimited invoices
    return true
  }, [])

  const canAddClient = useCallback((): boolean => {
    // All plans have unlimited clients
    return true
  }, [])

  const getRemainingInvoices = useCallback((): number => {
    // All plans have unlimited invoices
    return -1
  }, [])

  const getRemainingClients = useCallback((): number => {
    // All plans have unlimited clients
    return -1
  }, [])

  const isTrialActive = useCallback((): boolean => {
    if (fetchFromServer) {
      return serverIsTrialActive
    }
    if (!effectiveSubscription) return false
    const { isTrialActive: trialActive, trialEnd } = effectiveSubscription
    if (!trialActive || !trialEnd) return false
    return new Date(trialEnd).getTime() > Date.now()
  }, [fetchFromServer, serverIsTrialActive, effectiveSubscription])

  const getTrialDaysRemaining = useCallback((): number => {
    if (fetchFromServer) {
      return serverTrialDaysRemaining
    }
    if (!effectiveSubscription?.trialEnd) return 0
    const now = new Date()
    const trialEnd = new Date(effectiveSubscription.trialEnd)
    const diffTime = trialEnd.getTime() - now.getTime()
    return Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)))
  }, [fetchFromServer, serverTrialDaysRemaining, effectiveSubscription])

  const getTrialTimeRemainingSeconds = useCallback((): number => {
    if (fetchFromServer) {
      return serverTrialTimeRemainingSeconds
    }
    if (!effectiveSubscription?.trialEnd) return 0
    const now = new Date()
    const trialEnd = new Date(effectiveSubscription.trialEnd)
    const diffTime = trialEnd.getTime() - now.getTime()
    return Math.max(0, Math.floor(diffTime / 1000))
  }, [fetchFromServer, serverTrialTimeRemainingSeconds, effectiveSubscription])

  const getTrialType = useCallback((): "3min" | "14day" | null => {
    if (fetchFromServer) {
      return serverTrialType
    }
    return effectiveSubscription?.trialType || null
  }, [fetchFromServer, serverTrialType, effectiveSubscription])

  const isLifetime = useCallback((): boolean => {
    if (fetchFromServer) {
      return serverIsLifetime
    }
    return effectiveSubscription?.isLifetime || false
  }, [fetchFromServer, serverIsLifetime, effectiveSubscription])

  const isSubscriptionExpired = useCallback((): boolean => {
    if (fetchFromServer) {
      return serverIsExpired
    }
    if (!effectiveSubscription) return false
    // Lifetime subscriptions never expire
    if (effectiveSubscription.isLifetime) return false
    return new Date(effectiveSubscription.currentPeriodEnd) < new Date()
  }, [fetchFromServer, serverIsExpired, effectiveSubscription])

  const hasUsedTrial = useCallback((): boolean => {
    if (fetchFromServer) {
      return serverHasUsedTrial
    }
    return false
  }, [fetchFromServer, serverHasUsedTrial])

  const getUpgradeMessage = useCallback((feature: FeatureKey): string => {
    // All features are included in all plans
    return `${feature.replace(/_/g, ' ')} is included in all plans.`
  }, [])

  const shouldBlockAccess = useCallback((): boolean => {
    // Don't block lifetime users
    if (isLifetime()) {
      return false
    }
    
    // Block if trial is expired
    if (fetchFromServer && serverIsExpired) {
      return true
    }
    if (effectiveSubscription && isSubscriptionExpired() && !isTrialActive()) {
      return true
    }
    return false
  }, [fetchFromServer, serverIsExpired, effectiveSubscription, isSubscriptionExpired, isTrialActive, isLifetime])

  const getTrialDisplayTime = useCallback((): string => {
    const trialType = getTrialType()
    
    if (trialType === '3min') {
      const seconds = getTrialTimeRemainingSeconds()
      const mins = Math.floor(seconds / 60)
      const secs = seconds % 60
      return `${mins}:${secs.toString().padStart(2, '0')}`
    } else if (trialType === '14day') {
      const days = getTrialDaysRemaining()
      return `${days} day${days !== 1 ? 's' : ''} remaining`
    }
    
    return ''
  }, [getTrialType, getTrialTimeRemainingSeconds, getTrialDaysRemaining])

  return {
    // Subscription info
    subscriptionPlan,
    currentSubscription: effectiveSubscription,
    isLoading,
    isTrialActive: isTrialActive(),
    isSubscriptionExpired: isSubscriptionExpired(),
    trialDaysRemaining: getTrialDaysRemaining(),
    trialTimeRemainingSeconds: getTrialTimeRemainingSeconds(),
    trialType: getTrialType(),
    isLifetime: isLifetime(),
    hasUsedTrial: hasUsedTrial(),
    shouldBlockAccess: shouldBlockAccess(),
    trialDisplayTime: getTrialDisplayTime(),

    // Feature access (all features included in all plans)
    hasFeature,

    // Limits (all unlimited)
    canCreateInvoice: canCreateInvoice(),
    canAddClient: canAddClient(),
    remainingInvoices: getRemainingInvoices(),
    remainingClients: getRemainingClients(),

    // Utility
    getUpgradeMessage,

    // Constants
    FEATURES,
    SUBSCRIPTION_PLANS
  }
}

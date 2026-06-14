"use client"

import { useState } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { ClientSubscription, TrialSettings, SubscriptionPlan } from '@/types/invoice'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { formatDate } from '@/lib/utils'
import { 
  Users, 
  Plus, 
  Edit, 
  X, 
  Calendar, 
  CreditCard, 
  Gift,
  Settings,
  AlertTriangle,
  CheckCircle,
  Clock,
  Ban
} from 'lucide-react'

// Zod Schemas
const subscriptionSchema = z.object({
  clientName: z.string().min(1, "Client name is required"),
  clientEmail: z.string().email("Invalid email address"),
  plan: z.enum(['free', 'starter', 'professional', 'enterprise', '3min-trial', '14day-trial', 'lifetime']),
  status: z.enum(['active', 'trial', 'cancelled', 'expired', 'past_due']),
  startDate: z.date(),
  currentPeriodEnd: z.date(),
  autoRenew: z.boolean(),
});

const trialSchema = z.object({
  clientName: z.string().min(1, "Client name is required"),
  clientEmail: z.string().email("Invalid email address"),
  trialDays: z.number().min(1, "Trial must be at least 1 day").max(90, "Trial cannot exceed 90 days"),
});

const trialSettingsSchema = z.object({
  defaultTrialDays: z.number().min(1).max(90),
  maxTrialsPerClient: z.number().min(1).max(5),
  autoConvertToFree: z.boolean(),
  trialFeatures: z.array(z.string().min(1, "Feature cannot be empty")),
});


interface SubscriptionManagementProps {
  subscriptions: ClientSubscription[]
  trialSettings: TrialSettings
  onCreateSubscription: (subscription: Partial<ClientSubscription>) => void
  onUpdateSubscription: (id: string, updates: Partial<ClientSubscription>) => void
  onCancelSubscription: (id: string) => void
  onCreateTrial: (clientData: { clientName: string; clientEmail: string; trialDays?: number }) => void
  onUpdateTrialSettings: (settings: TrialSettings) => void
}

const SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
  {
    id: 'free',
    name: 'Free',
    price: 0,
    currency: 'USD',
    billingCycle: 'monthly',
    invoiceLimit: 5,
    clientLimit: 3,
    features: ['Basic Invoicing', 'PDF Export']
  },
  {
    id: 'starter',
    name: 'Starter',
    price: 19,
    currency: 'USD',
    billingCycle: 'monthly',
    invoiceLimit: 25,
    clientLimit: 10,
    features: ['Basic Invoicing', 'Client Management', 'Payment Tracking', 'Email Support']
  },
  {
    id: 'professional',
    name: 'Professional',
    price: 49,
    currency: 'USD',
    billingCycle: 'monthly',
    invoiceLimit: 100,
    clientLimit: 50,
    features: ['All Starter Features', 'Custom Templates', 'Reports & Analytics', 'Priority Support'],
    isPopular: true
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: 99,
    currency: 'USD',
    billingCycle: 'monthly',
    invoiceLimit: -1, // Unlimited
    clientLimit: -1, // Unlimited
    features: ['All Professional Features', 'API Access', 'White Label', 'Dedicated Support']
  }
]

export function SubscriptionManagement({
  subscriptions,
  trialSettings,
  onCreateSubscription,
  onUpdateSubscription,
  onCancelSubscription,
  onCreateTrial,
  onUpdateTrialSettings
}: SubscriptionManagementProps) {
  const [activeTab, setActiveTab] = useState<'subscriptions' | 'trials' | 'settings'>('subscriptions')
  const [editingSubscription, setEditingSubscription] = useState<ClientSubscription | null>(null)
  const [isSubscriptionDialogOpen, setIsSubscriptionDialogOpen] = useState(false)
  const [isTrialDialogOpen, setIsTrialDialogOpen] = useState(false)

  const activeSubscriptions = subscriptions.filter(sub => sub.status === 'active')
  const trialSubscriptions = subscriptions.filter(sub => sub.status === 'trial')
  const expiredSubscriptions = subscriptions.filter(sub => sub.status === 'expired')

  const getStatusBadge = (status: ClientSubscription['status']) => {
    const colors = {
      active: 'bg-green-100 text-green-800',
      trial: 'bg-blue-100 text-blue-800',
      cancelled: 'bg-red-100 text-red-800',
      expired: 'bg-gray-100 text-gray-800',
      past_due: 'bg-orange-100 text-orange-800'
    }

    const icons = {
      active: <CheckCircle className="h-3 w-3 mr-1" />,
      trial: <Gift className="h-3 w-3 mr-1" />,
      cancelled: <Ban className="h-3 w-3 mr-1" />,
      expired: <Clock className="h-3 w-3 mr-1" />,
      past_due: <AlertTriangle className="h-3 w-3 mr-1" />
    }

    return (
      <Badge className={colors[status]}>
        {icons[status]}
        {status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' ')}
      </Badge>
    )
  }

  const getPlanBadge = (plan: string) => {
    const colors = {
      free: 'bg-gray-100 text-gray-800',
      starter: 'bg-blue-100 text-blue-800',
      professional: 'bg-purple-100 text-purple-800',
      enterprise: 'bg-orange-100 text-orange-800'
    }

    return (
      <Badge className={colors[plan as keyof typeof colors] || 'bg-gray-100 text-gray-800'}>
        {plan.charAt(0).toUpperCase() + plan.slice(1)}
      </Badge>
    )
  }

  const openSubscriptionDialog = (subscription?: ClientSubscription) => {
    setEditingSubscription(subscription || null)
    setIsSubscriptionDialogOpen(true)
  }

  const handleCancelSubscription = (id: string) => {
    if (confirm('Are you sure you want to cancel this subscription? This action cannot be undone.')) {
      onCancelSubscription(id)
    }
  }

  const renderSubscriptionsTab = () => (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Active Subscriptions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{activeSubscriptions.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Active Trials</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{trialSubscriptions.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Expired</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-600">{expiredSubscriptions.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              ${activeSubscriptions.reduce((sum, sub) => {
                const plan = SUBSCRIPTION_PLANS.find(p => p.id === sub.plan)
                return sum + (plan?.price || 0)
              }, 0).toLocaleString()}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Subscriptions Table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>All Subscriptions</CardTitle>
          <div className="flex gap-2">
            <Dialog open={isTrialDialogOpen} onOpenChange={setIsTrialDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline">
                  <Gift className="h-4 w-4 mr-2" />
                  Start Trial
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Start New Trial</DialogTitle>
                </DialogHeader>
                <TrialForm
                  trialSettings={trialSettings}
                  onSave={(data) => {
                    onCreateTrial(data)
                    setIsTrialDialogOpen(false)
                  }}
                  onCancel={() => setIsTrialDialogOpen(false)}
                />
              </DialogContent>
            </Dialog>
            <Dialog open={isSubscriptionDialogOpen} onOpenChange={setIsSubscriptionDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => openSubscriptionDialog()}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Subscription
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>
                    {editingSubscription ? 'Edit Subscription' : 'Create New Subscription'}
                  </DialogTitle>
                </DialogHeader>
                <SubscriptionForm
                  subscription={editingSubscription}
                  plans={SUBSCRIPTION_PLANS}
                  onSave={(data) => {
                    if (editingSubscription) {
                      onUpdateSubscription(editingSubscription.id, data)
                    } else {
                      onCreateSubscription(data)
                    }
                    setIsSubscriptionDialogOpen(false)
                    setEditingSubscription(null)
                  }}
                  onCancel={() => {
                    setIsSubscriptionDialogOpen(false)
                    setEditingSubscription(null)
                  }}
                />
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Client</TableHead>
                <TableHead>Plan</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Start Date</TableHead>
                <TableHead>End Date</TableHead>
                <TableHead>Limits</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {subscriptions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                    No subscriptions found. Create your first subscription to get started.
                  </TableCell>
                </TableRow>
              ) : (
                subscriptions.map((subscription) => (
                  <TableRow key={subscription.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{subscription.clientName}</div>
                        <div className="text-sm text-gray-600">{subscription.clientEmail}</div>
                      </div>
                    </TableCell>
                    <TableCell>{getPlanBadge(subscription.plan)}</TableCell>
                    <TableCell>{getStatusBadge(subscription.status)}</TableCell>
                    <TableCell>{formatDate(subscription.startDate)}</TableCell>
                    <TableCell>
                      <div>
                        {formatDate(subscription.currentPeriodEnd)}
                        {subscription.isTrialActive && subscription.trialEnd && (
                          <div className="text-xs text-blue-600">
                            Trial ends: {formatDate(subscription.trialEnd)}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div>Invoices: {subscription.invoiceLimit === -1 ? 'Unlimited' : subscription.invoiceLimit}</div>
                        <div>Clients: {subscription.clientLimit === -1 ? 'Unlimited' : subscription.clientLimit}</div>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openSubscriptionDialog(subscription)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        {subscription.status === 'active' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleCancelSubscription(subscription.id)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )

  const renderTrialsTab = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Trial Settings</CardTitle>
        </CardHeader>
        <CardContent>
          <TrialSettingsForm
            settings={trialSettings}
            onSave={onUpdateTrialSettings}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Active Trials</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Client</TableHead>
                <TableHead>Started</TableHead>
                <TableHead>Expires</TableHead>
                <TableHead>Days Left</TableHead>
                <TableHead>Features</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {trialSubscriptions.map((trial) => {
                const daysLeft = trial.trialEnd ? Math.ceil((new Date(trial.trialEnd).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)) : 0
                return (
                  <TableRow key={trial.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{trial.clientName}</div>
                        <div className="text-sm text-gray-600">{trial.clientEmail}</div>
                      </div>
                    </TableCell>
                    <TableCell>{formatDate(trial.startDate)}</TableCell>
                    <TableCell>{trial.trialEnd ? formatDate(trial.trialEnd) : 'N/A'}</TableCell>
                    <TableCell>
                      <Badge className={daysLeft > 7 ? 'bg-green-100 text-green-800' : daysLeft > 3 ? 'bg-orange-100 text-orange-800' : 'bg-red-100 text-red-800'}>
                        {daysLeft > 0 ? `${daysLeft} days` : 'Expired'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {trial.features.slice(0, 2).map((feature, index) => (
                          <div key={index}>{feature}</div>
                        ))}
                        {trial.features.length > 2 && (
                          <div className="text-gray-500">+{trial.features.length - 2} more</div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openSubscriptionDialog(trial)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900 flex items-center">
          <Users className="h-6 w-6 mr-2" />
          Subscription Management
        </h2>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'subscriptions', label: 'Subscriptions', icon: CreditCard },
            { id: 'trials', label: 'Trials', icon: Gift },
            { id: 'settings', label: 'Settings', icon: Settings }
          ].map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id as any)}
              className={`flex items-center py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Icon className="h-4 w-4 mr-2" />
              {label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'subscriptions' && renderSubscriptionsTab()}
      {activeTab === 'trials' && renderTrialsTab()}
      {activeTab === 'settings' && (
        <Card>
          <CardHeader>
            <CardTitle>Subscription Plans</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {SUBSCRIPTION_PLANS.map((plan) => (
                <Card key={plan.id} className={plan.isPopular ? 'border-blue-500' : ''}>
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{plan.name}</CardTitle>
                      {plan.isPopular && (
                        <Badge className="bg-blue-100 text-blue-800">Popular</Badge>
                      )}
                    </div>
                    <div className="text-2xl font-bold">
                      ${plan.price}
                      <span className="text-sm font-normal text-gray-600">/{plan.billingCycle}</span>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 text-sm">
                      <div>Invoices: {plan.invoiceLimit === -1 ? 'Unlimited' : plan.invoiceLimit}</div>
                      <div>Clients: {plan.clientLimit === -1 ? 'Unlimited' : plan.clientLimit}</div>
                      <div className="pt-2">
                        <div className="font-medium mb-1">Features:</div>
                        {plan.features.map((feature, index) => (
                          <div key={index} className="text-gray-600">• {feature}</div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

interface SubscriptionFormProps {
  subscription: ClientSubscription | null
  plans: SubscriptionPlan[]
  onSave: (subscription: Partial<ClientSubscription>) => void
  onCancel: () => void
}

function SubscriptionForm({ subscription, plans, onSave, onCancel }: SubscriptionFormProps) {
  const { register, handleSubmit, control, watch, formState: { errors } } = useForm<z.infer<typeof subscriptionSchema>>({
    resolver: zodResolver(subscriptionSchema),
    defaultValues: {
      clientName: subscription?.clientName || '',
      clientEmail: subscription?.clientEmail || '',
      plan: subscription?.plan || 'starter',
      status: subscription?.status || 'active',
      startDate: subscription?.startDate ? new Date(subscription.startDate) : new Date(),
      currentPeriodEnd: subscription?.currentPeriodEnd ? new Date(subscription.currentPeriodEnd) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      autoRenew: subscription?.autoRenew ?? true,
    }
  });

  const selectedPlanId = watch("plan");
  const selectedPlan = plans.find(p => p.id === selectedPlanId);

  const handleSave = (data: z.infer<typeof subscriptionSchema>) => {
    const subscriptionData = {
      ...data,
      invoiceLimit: selectedPlan?.invoiceLimit ?? 10,
      clientLimit: selectedPlan?.clientLimit ?? 5,
      features: selectedPlan?.features ?? [],
    };
    onSave(subscriptionData);
  };

  return (
    <form onSubmit={handleSubmit(handleSave)} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="clientName">Client Name *</Label>
          <Input id="clientName" {...register("clientName")} />
          {errors.clientName && <p className="text-red-500 text-xs mt-1">{errors.clientName.message}</p>}
        </div>
        <div>
          <Label htmlFor="clientEmail">Client Email *</Label>
          <Input id="clientEmail" type="email" {...register("clientEmail")} />
          {errors.clientEmail && <p className="text-red-500 text-xs mt-1">{errors.clientEmail.message}</p>}
        </div>
        <div>
          <Label htmlFor="plan">Subscription Plan *</Label>
          <Controller
            name="plan"
            control={control}
            render={({ field }) => (
              <Select onValueChange={field.onChange} value={field.value}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {plans.map(plan => (
                    <SelectItem key={plan.id} value={plan.id}>
                      {plan.name} - ${plan.price}/{plan.billingCycle}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        </div>
        <div>
          <Label htmlFor="status">Status</Label>
          <Controller
            name="status"
            control={control}
            render={({ field }) => (
              <Select onValueChange={field.onChange} value={field.value}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="trial">Trial</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                  <SelectItem value="expired">Expired</SelectItem>
                  <SelectItem value="past_due">Past Due</SelectItem>
                </SelectContent>
              </Select>
            )}
          />
        </div>
        <div>
          <Label htmlFor="startDate">Start Date</Label>
          <Controller
            name="startDate"
            control={control}
            render={({ field }) => (
              <Input
                type="date"
                value={field.value ? new Date(field.value).toISOString().split('T')[0] : ''}
                onChange={(e) => field.onChange(new Date(e.target.value))}
              />
            )}
          />
        </div>
        <div>
          <Label htmlFor="endDate">End Date</Label>
          <Controller
            name="currentPeriodEnd"
            control={control}
            render={({ field }) => (
              <Input
                type="date"
                value={field.value ? new Date(field.value).toISOString().split('T')[0] : ''}
                onChange={(e) => field.onChange(new Date(e.target.value))}
              />
            )}
          />
        </div>
      </div>

      {selectedPlan && (
        <div className="p-4 bg-gray-50 rounded-lg">
          <h3 className="font-medium mb-2">Plan Details</h3>
          <div className="text-sm space-y-1">
            <div>Price: ${selectedPlan.price}/{selectedPlan.billingCycle}</div>
            <div>Invoice Limit: {selectedPlan.invoiceLimit === -1 ? 'Unlimited' : selectedPlan.invoiceLimit}</div>
            <div>Client Limit: {selectedPlan.clientLimit === -1 ? 'Unlimited' : selectedPlan.clientLimit}</div>
            <div>Features: {selectedPlan.features.join(', ')}</div>
          </div>
        </div>
      )}

      <div className="flex items-center space-x-2">
        <Controller
          name="autoRenew"
          control={control}
          render={({ field }) => (
            <input
              type="checkbox"
              id="autoRenew"
              checked={field.value}
              onChange={field.onChange}
              className="rounded"
            />
          )}
        />
        <Label htmlFor="autoRenew">Auto-renew subscription</Label>
      </div>

      <div className="flex justify-end space-x-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">
          {subscription ? 'Update Subscription' : 'Create Subscription'}
        </Button>
      </div>
    </form>
  )
}

interface TrialFormProps {
  trialSettings: TrialSettings
  onSave: (data: { clientName: string; clientEmail: string; trialDays?: number }) => void
  onCancel: () => void
}

function TrialForm({ trialSettings, onSave, onCancel }: TrialFormProps) {
  const { register, handleSubmit, formState: { errors } } = useForm<z.infer<typeof trialSchema>>({
    resolver: zodResolver(trialSchema),
    defaultValues: {
      clientName: '',
      clientEmail: '',
      trialDays: trialSettings.defaultTrialDays,
    }
  });

  return (
    <form onSubmit={handleSubmit(onSave)} className="space-y-4">
      <div>
        <Label htmlFor="clientName">Client Name *</Label>
        <Input id="clientName" {...register("clientName")} />
        {errors.clientName && <p className="text-red-500 text-xs mt-1">{errors.clientName.message}</p>}
      </div>
      <div>
        <Label htmlFor="clientEmail">Client Email *</Label>
        <Input id="clientEmail" type="email" {...register("clientEmail")} />
        {errors.clientEmail && <p className="text-red-500 text-xs mt-1">{errors.clientEmail.message}</p>}
      </div>
      <div>
        <Label htmlFor="trialDays">Trial Duration (days)</Label>
        <Input id="trialDays" type="number" {...register("trialDays", { valueAsNumber: true })} min="1" max="90" />
        {errors.trialDays && <p className="text-red-500 text-xs mt-1">{errors.trialDays.message}</p>}
      </div>

      <div className="p-4 bg-blue-50 rounded-lg">
        <h3 className="font-medium mb-2">Trial Features</h3>
        <div className="text-sm space-y-1">
          {trialSettings.trialFeatures.map((feature, index) => (
            <div key={index}>• {feature}</div>
          ))}
        </div>
      </div>

      <div className="flex justify-end space-x-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">
          Start Trial
        </Button>
      </div>
    </form>
  )
}

interface TrialSettingsFormProps {
  settings: TrialSettings
  onSave: (settings: TrialSettings) => void
}

function TrialSettingsForm({ settings, onSave }: TrialSettingsFormProps) {
  const { register, handleSubmit, control, formState: { errors } } = useForm<z.infer<typeof trialSettingsSchema>>({
    resolver: zodResolver(trialSettingsSchema),
    defaultValues: settings,
  });

  return (
    <form onSubmit={handleSubmit(onSave)} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="defaultTrialDays">Default Trial Days</Label>
          <Input id="defaultTrialDays" type="number" {...register("defaultTrialDays", { valueAsNumber: true })} min="1" max="90" />
          {errors.defaultTrialDays && <p className="text-red-500 text-xs mt-1">{errors.defaultTrialDays.message}</p>}
        </div>
        <div>
          <Label htmlFor="maxTrialsPerClient">Max Trials Per Client</Label>
          <Input id="maxTrialsPerClient" type="number" {...register("maxTrialsPerClient", { valueAsNumber: true })} min="1" max="5" />
          {errors.maxTrialsPerClient && <p className="text-red-500 text-xs mt-1">{errors.maxTrialsPerClient.message}</p>}
        </div>
      </div>

      <div className="flex items-center space-x-2">
        <Controller
          name="autoConvertToFree"
          control={control}
          render={({ field }) => (
            <input
              type="checkbox"
              id="autoConvertToFree"
              checked={field.value}
              onChange={field.onChange}
              className="rounded"
            />
          )}
        />
        <Label htmlFor="autoConvertToFree">Auto-convert expired trials to free plan</Label>
      </div>

      <div>
        <Label>Trial Features</Label>
        {/* This part is complex with useFieldArray, skipping for now to keep it simple */}
        <div className="text-sm text-gray-500 mt-1">Feature list editing is not yet implemented in this form.</div>
      </div>

      <Button type="submit">
        Save Trial Settings
      </Button>
    </form>
  )
}
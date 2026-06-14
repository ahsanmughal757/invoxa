"use client"

import { useState } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Expense } from '@/types/invoice'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { formatCurrency, formatDate } from '@/lib/utils'
import { Plus, Receipt, Search, Filter, DollarSign, TrendingDown, Calendar, Edit, Trash2, AlertCircle } from 'lucide-react'

// Zod schema for expense form
const expenseSchema = z.object({
  description: z.string().min(1, { message: "Description is required" }),
  amount: z.number().min(0.01, { message: "Amount must be positive" }),
  date: z.string(), // ISO 8601 date string
  category: z.string().optional(),
  vendor: z.string().optional(),
  tax_deductible: z.boolean(),
  notes: z.string().optional(),
});

type ExpenseFormData = z.infer<typeof expenseSchema>;

interface ExpenseTrackingProps {
  expenses: Expense[]
  onCreateExpense: (expense: Partial<Expense>) => void
  onUpdateExpense: (id: string, updates: Partial<Expense>) => void
  onDeleteExpense: (id: string) => void
}

export function ExpenseTracking({ expenses, onCreateExpense, onUpdateExpense, onDeleteExpense }: ExpenseTrackingProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  const categories = [
    'Office Supplies',
    'Travel',
    'Meals & Entertainment',
    'Software & Subscriptions',
    'Marketing',
    'Professional Services',
    'Utilities',
    'Rent',
    'Insurance',
    'Equipment',
    'Other'
  ]

  const filteredExpenses = expenses
    .filter(expense => {
      const matchesSearch =
        expense.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        expense.vendor?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        expense.category?.toLowerCase().includes(searchTerm.toLowerCase())
      
      const matchesCategory = categoryFilter === 'all' || expense.category === categoryFilter
      
      return matchesSearch && matchesCategory
    })
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

  const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0)
  const thisMonthExpenses = expenses
    .filter(expense => {
      const expenseDate = new Date(expense.date)
      const now = new Date()
      return expenseDate.getMonth() === now.getMonth() && expenseDate.getFullYear() === now.getFullYear()
    })
    .reduce((sum, expense) => sum + expense.amount, 0)

  const taxDeductibleExpenses = expenses
    .filter(expense => expense.tax_deductible)
    .reduce((sum, expense) => sum + expense.amount, 0)

  const handleSaveExpense = (expenseData: Partial<Expense>) => {
    if (editingExpense) {
      onUpdateExpense(editingExpense.id, expenseData)
    } else {
      onCreateExpense(expenseData)
    }
    setIsDialogOpen(false)
    setEditingExpense(null)
  }

  const openEditDialog = (expense?: Expense) => {
    setEditingExpense(expense || null)
    setIsDialogOpen(true)
  }

  const handleDeleteExpense = (id: string) => {
    if (confirm('Are you sure you want to delete this expense?')) {
      onDeleteExpense(id)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center">
            <Receipt className="h-8 w-8 mr-3 text-red-600" />
            Expense Tracking
          </h1>
          <p className="text-gray-600 mt-1">
            Track business expenses - money going out of your organization
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => openEditDialog()} className="flex items-center bg-red-600 hover:bg-red-700">
              <Plus className="h-4 w-4 mr-2" />
              Add Expense
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingExpense ? 'Edit Expense' : 'Add New Expense'}
              </DialogTitle>
            </DialogHeader>
            <ExpenseForm
              expense={editingExpense}
              categories={categories}
              onSave={handleSaveExpense}
              onCancel={() => setIsDialogOpen(false)}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center">
              <DollarSign className="h-4 w-4 mr-2 text-red-500" />
              Total Money Out
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{formatCurrency(totalExpenses)}</div>
            <p className="text-xs text-gray-500 mt-1">Business expenses total</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center">
              <Calendar className="h-4 w-4 mr-2 text-red-500" />
              This Month Outflow
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{formatCurrency(thisMonthExpenses)}</div>
            <p className="text-xs text-gray-500 mt-1">Expenses this month</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center">
              <TrendingDown className="h-4 w-4 mr-2 text-green-500" />
              Tax Deductible
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{formatCurrency(taxDeductibleExpenses)}</div>
            <p className="text-xs text-gray-500 mt-1">Potential tax savings</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardHeader>
          <CardTitle>Organization Expense History</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search expenses..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map(category => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Expenses Table */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Vendor</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Tax Deductible</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredExpenses.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                      No expenses found. Add your first expense to get started.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredExpenses.map((expense) => (
                    <TableRow key={expense.id}>
                      <TableCell>{formatDate(expense.date)}</TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{expense.description}</div>
                          {expense.notes && (
                            <div className="text-sm text-gray-600 max-w-48 truncate" title={expense.notes}>
                              {expense.notes}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{expense.category || 'Uncategorized'}</Badge>
                      </TableCell>
                      <TableCell>{expense.vendor || '-'}</TableCell>
                      <TableCell>
                        <span className="font-medium text-red-600">
                          {formatCurrency(expense.amount)}
                        </span>
                      </TableCell>
                      <TableCell>
                        {expense.tax_deductible ? (
                          <Badge className="bg-green-100 text-green-800">Yes</Badge>
                        ) : (
                          <Badge variant="outline">No</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openEditDialog(expense)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteExpense(expense.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

interface ExpenseFormProps {
  expense: Expense | null
  categories: string[]
  onSave: (expense: Partial<Expense>) => void
  onCancel: () => void
}

function ExpenseForm({ expense, categories, onSave, onCancel }: ExpenseFormProps) {
  const { register, handleSubmit, control, formState: { errors } } = useForm<ExpenseFormData>({
    resolver: zodResolver(expenseSchema),
    defaultValues: {
      description: expense?.description || '',
      amount: expense?.amount || 0,
      date: expense?.date || new Date().toISOString().split('T')[0],
      category: expense?.category || '',
      vendor: expense?.vendor || '',
      tax_deductible: expense?.tax_deductible || false,
      notes: expense?.notes || '',
    }
  });

  return (
    <form onSubmit={handleSubmit(onSave)} className="space-y-4">
      <div className="p-4 bg-red-50 rounded-lg border border-red-200">
        <div className="flex items-start">
          <AlertCircle className="h-5 w-5 text-red-600 mt-0.5 mr-2 flex-shrink-0" />
          <div>
            <h3 className="font-medium text-red-800">Expense Recording Process</h3>
            <p className="text-sm text-red-700 mt-1">
              This form records business expenses (money going OUT).
              Expenses are costs incurred by your business (office supplies, travel, etc.).
            </p>
            <p className="text-sm text-red-600 mt-2">
              <strong>Tip:</strong> Expenses differ from payments. Payments are money coming IN from clients.
            </p>
          </div>
        </div>
      </div>

      <div>
        <Label htmlFor="description">Description *</Label>
        <Input id="description" {...register("description")} placeholder="Enter expense description" />
        {errors.description && <p className="text-red-500 text-xs mt-1">{errors.description.message}</p>}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="amount">Amount *</Label>
          <Input id="amount" type="number" {...register("amount", { valueAsNumber: true })} min="0" step="0.01" />
          {errors.amount && <p className="text-red-500 text-xs mt-1">{errors.amount.message}</p>}
        </div>
        <div>
          <Label htmlFor="date">Date *</Label>
          <Controller
            name="date"
            control={control}
            render={({ field }) => (
              <Input
                type="date"
                value={field.value}
                onChange={(e) => field.onChange(e.target.value)}
              />
            )}
          />
          {errors.date && <p className="text-red-500 text-xs mt-1">{errors.date.message}</p>}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="category">Category *</Label>
          <Controller
            name="category"
            control={control}
            render={({ field }) => (
              <Select onValueChange={field.onChange} value={field.value || ''}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map(category => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
          {errors.category && <p className="text-red-500 text-xs mt-1">{errors.category.message}</p>}
        </div>
        <div>
          <Label htmlFor="vendor">Vendor</Label>
          <Input id="vendor" {...register("vendor")} placeholder="Vendor name" />
        </div>
      </div>

      <div className="flex items-center space-x-2">
        <Controller
          name="tax_deductible"
          control={control}
          render={({ field }) => (
            <input
              type="checkbox"
              id="taxDeductible"
              checked={field.value}
              onChange={field.onChange}
              className="rounded"
            />
          )}
        />
        <Label htmlFor="taxDeductible">Tax Deductible</Label>
      </div>

      <div>
        <Label htmlFor="notes">Notes</Label>
        <Textarea id="notes" {...register("notes")} placeholder="Additional notes about this expense" rows={3} />
      </div>

      <div className="flex justify-end space-x-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">
          {expense ? 'Update Expense' : 'Add Expense'}
        </Button>
      </div>
    </form>
  )
}
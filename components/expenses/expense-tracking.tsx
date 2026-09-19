"use client";

import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Expense } from "@/types/invoice";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/ui/page-header";
import { StatCard } from "@/components/ui/stats-card";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { formatCurrency, formatDate } from "@/lib/utils";
import {
  Plus,
  Receipt,
  Search,
  Filter,
  DollarSign,
  TrendingDown,
  Calendar,
  Edit,
  Trash2,
  AlertCircle,
  Loader2,
} from "lucide-react";
import toast from "react-hot-toast";

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
  expenses: Expense[];
  onCreateExpense: (expense: Partial<Expense>) => Promise<unknown> | unknown;
  onUpdateExpense: (
    id: string,
    updates: Partial<Expense>,
  ) => Promise<unknown> | unknown;
  onDeleteExpense: (id: string) => Promise<unknown> | unknown;
}

export function ExpenseTracking({
  expenses,
  onCreateExpense,
  onUpdateExpense,
  onDeleteExpense,
}: ExpenseTrackingProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [expenseToDelete, setExpenseToDelete] = useState<Expense | null>(null);

  const categories = [
    "Office Supplies",
    "Travel",
    "Meals & Entertainment",
    "Software & Subscriptions",
    "Marketing",
    "Professional Services",
    "Utilities",
    "Rent",
    "Insurance",
    "Equipment",
    "Other",
  ];

  const filteredExpenses = expenses
    .filter((expense) => {
      const matchesSearch =
        expense.description
          .toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        expense.vendor?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        expense.category?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesCategory =
        categoryFilter === "all" || expense.category === categoryFilter;

      return matchesSearch && matchesCategory;
    })
    .sort(
      (a, b) =>
        new Date(b.date).getTime() - new Date(a.date).getTime(),
    );

  const totalExpenses = expenses.reduce(
    (sum, expense) => sum + expense.amount,
    0,
  );

  const thisMonthExpenses = expenses
    .filter((expense) => {
      const expenseDate = new Date(expense.date);
      const now = new Date();
      return (
        expenseDate.getMonth() === now.getMonth() &&
        expenseDate.getFullYear() === now.getFullYear()
      );
    })
    .reduce((sum, expense) => sum + expense.amount, 0);

  const taxDeductibleExpenses = expenses
    .filter((expense) => expense.tax_deductible)
    .reduce((sum, expense) => sum + expense.amount, 0);

  const handleSaveExpense = async (expenseData: Partial<Expense>) => {
    setIsSaving(true);
    try {
      if (editingExpense) {
        await onUpdateExpense(editingExpense.id, expenseData);
      } else {
        await onCreateExpense(expenseData);
      }
      setIsDialogOpen(false);
      setEditingExpense(null);
      toast.success(
        editingExpense
          ? "Expense updated successfully"
          : "Expense created successfully",
      );
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to save expense. Please try again.",
      );
    } finally {
      setIsSaving(false);
    }
  };

  const openEditDialog = (expense?: Expense) => {
    setEditingExpense(expense || null);
    setIsDialogOpen(true);
  };

  const handleDeleteExpense = async () => {
    if (!expenseToDelete) return;
    try {
      await onDeleteExpense(expenseToDelete.id);
      setExpenseToDelete(null);
      toast.success("Expense deleted successfully");
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to delete expense. Please try again.",
      );
      throw error;
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Expense Tracking"
        description="Track business expenses - money going out of your organization"
        actions={[
          <Button
            key="add-expense"
            onClick={() => openEditDialog()}
            variant="default"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Expense
          </Button>,
        ]}
      />

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingExpense ? "Edit Expense" : "Add New Expense"}
            </DialogTitle>
          </DialogHeader>
          <ExpenseForm
            expense={editingExpense}
            categories={categories}
            isSaving={isSaving}
            onSave={handleSaveExpense}
            onCancel={() => setIsDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <StatCard
          label="Total Money Out"
          value={formatCurrency(totalExpenses)}
          sublabel="Business expenses total"
          tone="danger"
          icon={<DollarSign className="h-4 w-4" />}
        />
        <StatCard
          label="This Month Outflow"
          value={formatCurrency(thisMonthExpenses)}
          sublabel="Expenses this month"
          tone="danger"
          icon={<Calendar className="h-4 w-4" />}
        />
        <StatCard
          label="Tax Deductible"
          value={formatCurrency(taxDeductibleExpenses)}
          sublabel="Potential tax savings"
          tone="success"
          icon={<TrendingDown className="h-4 w-4" />}
        />
      </div>

      {/* Filters and Search */}
      <Card>
        <CardHeader>
          <CardTitle>Organization Expense History</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4 mb-6 sm:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
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
                {categories.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Expenses Table */}
          <div className="rounded-lg border">
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
                    <TableCell
                      colSpan={7}
                      className="py-8 text-center text-muted-foreground"
                    >
                      No expenses found. Add your first expense to get started.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredExpenses.map((expense) => (
                    <TableRow key={expense.id}>
                      <TableCell>{formatDate(expense.date)}</TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">
                            {expense.description}
                          </div>
                          {expense.notes && (
                            <div
                              className="max-w-48 truncate text-sm text-muted-foreground"
                              title={expense.notes}
                            >
                              {expense.notes}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {expense.category || "Uncategorized"}
                        </Badge>
                      </TableCell>
                      <TableCell>{expense.vendor || "-"}</TableCell>
                      <TableCell>
                        <span className="font-medium text-destructive">
                          {formatCurrency(expense.amount)}
                        </span>
                      </TableCell>
                      <TableCell>
                        {expense.tax_deductible ? (
                          <Badge className="border-transparent bg-success text-white">
                            Yes
                          </Badge>
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
                            onClick={() => setExpenseToDelete(expense)}
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

      <ConfirmDialog
        open={!!expenseToDelete}
        onOpenChange={(open) => {
          if (!open) setExpenseToDelete(null);
        }}
        title="Delete Expense"
        description={`Are you sure you want to delete the expense "${expenseToDelete?.description || ""}"? This action cannot be undone.`}
        confirmLabel="Delete"
        cancelLabel="Cancel"
        destructive
        onConfirm={handleDeleteExpense}
      />
    </div>
  );
}

interface ExpenseFormProps {
  expense: Expense | null;
  categories: string[];
  isSaving?: boolean;
  onSave: (expense: Partial<Expense>) => Promise<unknown> | unknown;
  onCancel: () => void;
}

function ExpenseForm({
  expense,
  categories,
  isSaving = false,
  onSave,
  onCancel,
}: ExpenseFormProps) {
  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<ExpenseFormData>({
    resolver: zodResolver(expenseSchema),
    defaultValues: {
      description: expense?.description || "",
      amount: expense?.amount || 0,
      date: expense?.date || new Date().toISOString().split("T")[0],
      category: expense?.category || "",
      vendor: expense?.vendor || "",
      tax_deductible: expense?.tax_deductible || false,
      notes: expense?.notes || "",
    },
  });

  const onFormSubmit = async (data: ExpenseFormData) => {
    await onSave(data);
  };

  return (
    <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-4">
      <div className="rounded-lg border border-red-200 bg-destructive/5 p-4">
        <div className="flex items-start">
          <AlertCircle className="mt-0.5 mr-2 h-5 w-5 shrink-0 text-destructive" />
          <div>
            <h3 className="font-medium text-destructive">
              Expense Recording Process
            </h3>
            <p className="mt-1 text-sm text-destructive/80">
              This form records business expenses (money going OUT). Expenses
              are costs incurred by your business (office supplies, travel,
              etc.).
            </p>
            <p className="mt-2 text-sm text-destructive/70">
              <strong>Tip:</strong> Expenses differ from payments. Payments are
              money coming IN from clients.
            </p>
          </div>
        </div>
      </div>

      <div>
        <Label htmlFor="description">Description *</Label>
        <Input
          id="description"
          {...register("description")}
          placeholder="Enter expense description"
        />
        {errors.description && (
          <p className="mt-1 text-xs text-destructive">
            {errors.description.message}
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div>
          <Label htmlFor="amount">Amount *</Label>
          <Input
            id="amount"
            type="number"
            {...register("amount", { valueAsNumber: true })}
            min="0"
            step="0.01"
          />
          {errors.amount && (
            <p className="mt-1 text-xs text-destructive">
              {errors.amount.message}
            </p>
          )}
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
          {errors.date && (
            <p className="mt-1 text-xs text-destructive">
              {errors.date.message}
            </p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div>
          <Label htmlFor="category">Category *</Label>
          <Controller
            name="category"
            control={control}
            render={({ field }) => (
              <Select
                onValueChange={field.onChange}
                value={field.value || ""}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
          {errors.category && (
            <p className="mt-1 text-xs text-destructive">
              {errors.category.message}
            </p>
          )}
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
        <Textarea
          id="notes"
          {...register("notes")}
          placeholder="Additional notes about this expense"
          rows={3}
        />
      </div>

      <div className="flex justify-end space-x-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSaving}>
          {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isSaving
            ? expense
              ? "Updating..."
              : "Adding..."
            : expense
              ? "Update Expense"
              : "Add Expense"}
        </Button>
      </div>
    </form>
  );
}
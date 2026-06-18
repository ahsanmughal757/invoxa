"use client";

import { useState, useEffect, useCallback, Suspense, useMemo } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";
import {
  FileText,
  Receipt,
  DollarSign,
  Users,
  Activity,
  BarChart3,
  TrendingUp,
  Building,
  Plus,
  Search,
  Edit,
  Trash2,
  Calendar,
  Mail,
  Phone,
  MapPin,
  LayoutDashboard,
  UserCheck,
} from "lucide-react";
import { useInvoices } from "@/hooks/use-invoices";
import { useAuth } from "@clerk/nextjs";
import {
  Organization,
  Invoice,
  Expense,
  PaymentRecord,
  Client,
} from "@/types/invoice";
import { formatCurrency, formatDate } from "@/lib/utils";
import { useOrganization } from "@/hooks/use-organization";
import { useExpenses } from "@/hooks/use-expenses";
import { usePayments } from "@/hooks/use-payments";
import { useClients } from "@/hooks/use-clients";
import { InvoiceList } from "@/components/invoice/invoice-list";
import { InvoiceForm } from "@/components/invoice/invoice-form";
import { CollaborationGuard } from "@/components/guards/collaboration-guard";
import toast from "react-hot-toast";

type TabId = "dashboard" | "clients" | "invoices" | "expenses" | "payments";

function CollaborationDashboardContent() {
  const { orgId } = useParams<{ orgId: string }>();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { userId } = useAuth();
  const { invoices, isLoading: invoicesLoading, createInvoice, updateInvoice, deleteInvoice } = useInvoices();
  const { expenses, isLoading: expensesLoading, createExpense, updateExpense, deleteExpense } = useExpenses();
  const { payments, isLoading: paymentsLoading, recordPayment, updatePayment, deletePayment } = usePayments();
  const { clients, isLoading: clientsLoading, createClient, updateClient, deleteClient } = useClients();
  const { organizations = [], memberOrganizations = [], members = [], getMembers } = useOrganization();

  const isLoading = invoicesLoading;

  const activeTab = (searchParams.get("tab") || "dashboard") as TabId;

  const isOwner = organizations.some((org: any) => org.id === orgId);
  const isMember = memberOrganizations.some((m: any) => m.org_id === orgId);
  const role = isOwner ? "owner" : isMember ? "member" : null;

  // Member org selector state
  const [selectedMemberOrgId, setSelectedMemberOrgId] = useState(orgId);

  // Member-specific: track current org's member info
  const currentMemberOrg = memberOrganizations.find(
    (m: any) => m.org_id === orgId,
  );

  // Fetch members for owner dashboard
  useEffect(() => {
    if (isOwner && orgId) {
      getMembers(orgId);
    }
  }, [isOwner, orgId, getMembers]);

  // Calculate organization statistics
  const orgStats = useMemo(() => {
    if (isLoading) {
      return {
        totalInvoices: 0,
        totalExpenses: 0,
        totalPayments: 0,
        totalClients: 0,
        totalRevenue: 0,
        pendingInvoices: 0,
        overdueInvoices: 0,
      };
    }

    const orgInvoices = invoices.filter(
      (inv: Invoice) => inv.org_id === orgId,
    );
    const orgExpenses = expenses.filter((exp) => exp.org_id === orgId);
    const orgPayments = payments.filter((pay) => {
      const invoice = invoices.find(
        (inv: Invoice) => inv.id === pay.invoice_id,
      );
      return invoice && invoice.org_id === orgId;
    });
    const orgClients = clients.filter((client) => client.org_id === orgId);

    const totalRevenue = orgPayments.reduce(
      (sum, payment) => sum + payment.amount,
      0,
    );
    const pendingInvoices = orgInvoices.filter(
      (inv: Invoice) => inv.status === "sent",
    ).length;
    const overdueInvoices = orgInvoices.filter(
      (inv: Invoice) =>
        inv.status === "overdue" && new Date(inv.due_date) < new Date(),
    ).length;

    return {
      totalInvoices: orgInvoices.length,
      totalExpenses: orgExpenses.length,
      totalPayments: orgPayments.length,
      totalClients: orgClients.length,
      totalRevenue,
      pendingInvoices,
      overdueInvoices,
    };
  }, [invoices, expenses, payments, clients, isLoading, orgId]);

  const handleTabChange = (tab: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", tab);
    router.push(`/organization/${orgId}/collaboration?${params.toString()}`);
  };

  const handleMemberOrgSwitch = (newOrgId: string) => {
    if (newOrgId !== orgId) {
      router.push(`/organization/${newOrgId}/collaboration`);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <p>Loading collaboration dashboard...</p>
      </div>
    );
  }

  return (
    <CollaborationGuard orgId={orgId}>
      <div className="space-y-6">
        {/* Org Selector for Members */}
        {memberOrganizations.length > 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center gap-4 flex-wrap">
              <div className="flex items-center gap-2">
                <Building className="h-5 w-5 text-blue-600" />
                <span className="text-sm font-medium text-blue-800">
                  {isOwner ? "Your Organization:" : "Member Organization:"}
                </span>
              </div>
              <Select
                value={orgId}
                onValueChange={handleMemberOrgSwitch}
              >
                <SelectTrigger className="w-auto min-w-[200px] bg-white">
                  <SelectValue placeholder="Select organization" />
                </SelectTrigger>
                <SelectContent>
                  {memberOrganizations.map((m: any) => {
                    const orgName =
                      m.organization?.name || m.name || "Unknown";
                    return (
                      <SelectItem key={m.org_id || m.id} value={m.org_id || m.id}>
                        <div className="flex items-center">
                          <Building className="h-4 w-4 mr-2 text-gray-500" />
                          <span>{orgName}</span>
                          {m.role && (
                            <Badge variant="outline" className="ml-2 text-xs capitalize">
                              {m.role}
                            </Badge>
                          )}
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
              {currentMemberOrg && (
                <Badge variant="secondary" className="capitalize">
                  {currentMemberOrg.role || "member"}
                </Badge>
              )}
            </div>
          </div>
        )}

        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            {isOwner ? "Collaboration Dashboard" : "Organization Dashboard"}
          </h1>
          <p className="text-gray-600 mt-1">
            {isOwner
              ? "Manage your organization and monitor member activity"
              : "View and manage data for this organization"}
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={handleTabChange}>
          <TabsList className="w-full justify-start overflow-x-auto">
            <TabsTrigger value="dashboard" className="flex items-center gap-2">
              <LayoutDashboard className="h-4 w-4" />
              Dashboard
            </TabsTrigger>
            <TabsTrigger value="clients" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Clients
            </TabsTrigger>
            <TabsTrigger value="invoices" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Invoices
            </TabsTrigger>
            <TabsTrigger value="expenses" className="flex items-center gap-2">
              <Receipt className="h-4 w-4" />
              Expenses
            </TabsTrigger>
            <TabsTrigger value="payments" className="flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Payments
            </TabsTrigger>
          </TabsList>

          {/* ───── Dashboard Tab ───── */}
          <TabsContent value="dashboard" className="space-y-6">
            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-4 flex items-center">
                  <div className="bg-blue-100 p-3 rounded-lg mr-4">
                    <FileText className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Total Invoices</p>
                    <p className="text-2xl font-bold">{orgStats.totalInvoices}</p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 flex items-center">
                  <div className="bg-green-100 p-3 rounded-lg mr-4">
                    <Receipt className="h-6 w-6 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Total Expenses</p>
                    <p className="text-2xl font-bold">{orgStats.totalExpenses}</p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 flex items-center">
                  <div className="bg-purple-100 p-3 rounded-lg mr-4">
                    <DollarSign className="h-6 w-6 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Total Revenue</p>
                    <p className="text-2xl font-bold">
                      {formatCurrency(orgStats.totalRevenue)}
                    </p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 flex items-center">
                  <div className="bg-orange-100 p-3 rounded-lg mr-4">
                    <Users className="h-6 w-6 text-orange-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Total Clients</p>
                    <p className="text-2xl font-bold">{orgStats.totalClients}</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <TrendingUp className="h-5 w-5 mr-2 text-blue-500" />
                    Invoice Status
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span>Pending</span>
                      <Badge variant="secondary">{orgStats.pendingInvoices}</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Overdue</span>
                      <Badge variant="destructive">{orgStats.overdueInvoices}</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Activity className="h-5 w-5 mr-2 text-green-500" />
                    Recent Activity
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span>Payments Received</span>
                      <span className="font-medium">{orgStats.totalPayments}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Expenses Recorded</span>
                      <span className="font-medium">{orgStats.totalExpenses}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Owner-specific: Members Section */}
            {isOwner && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <UserCheck className="h-5 w-5 mr-2 text-blue-500" />
                    Organization Members
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {(!members || members.length === 0) ? (
                    <p className="text-gray-500 text-sm">No members yet. Invite members to collaborate.</p>
                  ) : (
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>User ID</TableHead>
                            <TableHead>Role</TableHead>
                            <TableHead>Joined</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {(members || []).map((member: any) => (
                            <TableRow key={member.id}>
                              <TableCell className="font-mono text-sm">{member.user_id?.slice(0, 8)}...</TableCell>
                              <TableCell>
                                <Badge variant="secondary" className="capitalize">
                                  {member.role}
                                </Badge>
                              </TableCell>
                              <TableCell>{formatDate(member.created_at)}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Quick Actions */}
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h2>
              <div className="flex flex-wrap gap-3">
                <Button onClick={() => handleTabChange("invoices")}>
                  <FileText className="h-4 w-4 mr-2" />
                  Create Invoice
                </Button>
                <Button variant="outline" onClick={() => handleTabChange("expenses")}>
                  <Receipt className="h-4 w-4 mr-2" />
                  Add Expense
                </Button>
                <Button variant="outline" onClick={() => handleTabChange("clients")}>
                  <Users className="h-4 w-4 mr-2" />
                  Add Client
                </Button>
                <Button variant="outline" onClick={() => handleTabChange("payments")}>
                  <DollarSign className="h-4 w-4 mr-2" />
                  Record Payment
                </Button>
              </div>
            </div>
          </TabsContent>

          {/* ───── Clients Tab ───── */}
          <TabsContent value="clients" className="space-y-6">
            <ClientsTabContent
              clients={clients.filter((c: Client) => c.org_id === orgId)}
              orgId={orgId}
              createClient={createClient}
              updateClient={updateClient}
              deleteClient={deleteClient}
            />
          </TabsContent>

          {/* ───── Invoices Tab ───── */}
          <TabsContent value="invoices" className="space-y-6">
            <InvoicesTabContent
              invoices={invoices.filter((inv: Invoice) => inv.org_id === orgId)}
              clients={clients}
              orgId={orgId}
              isLoading={invoicesLoading}
              createInvoice={createInvoice}
              updateInvoice={updateInvoice}
              deleteInvoice={deleteInvoice}
              userId={userId}
              organization={organizations.find((o: any) => o.id === orgId) || null}
            />
          </TabsContent>

          {/* ───── Expenses Tab ───── */}
          <TabsContent value="expenses" className="space-y-6">
            <ExpensesTabContent
              expenses={expenses.filter((e: Expense) => e.org_id === orgId)}
              orgId={orgId}
              createExpense={createExpense}
              updateExpense={updateExpense}
              deleteExpense={deleteExpense}
            />
          </TabsContent>

          {/* ───── Payments Tab ───── */}
          <TabsContent value="payments" className="space-y-6">
            <PaymentsTabContent
              payments={payments.filter((p: PaymentRecord) => {
                const inv = invoices.find((i: Invoice) => i.id === p.invoice_id);
                return inv && inv.org_id === orgId;
              })}
              invoices={invoices.filter((inv: Invoice) => inv.org_id === orgId)}
              orgId={orgId}
              recordPayment={recordPayment}
              updatePayment={updatePayment}
              deletePayment={deletePayment}
            />
          </TabsContent>
        </Tabs>
      </div>
    </CollaborationGuard>
  );
}

export default function OrganizationCollaborationDashboard() {
  return (
    <Suspense fallback={<div className="flex justify-center items-center h-64"><p>Loading...</p></div>}>
      <CollaborationDashboardContent />
    </Suspense>
  );
}

/* ──────────────────────────────
   Clients Tab Content
   ────────────────────────────── */
function ClientsTabContent({
  clients,
  orgId,
  createClient,
  updateClient,
  deleteClient,
}: {
  clients: Client[];
  orgId: string;
  createClient: (data: any) => any;
  updateClient: (id: string, orgId: string, data: any) => any;
  deleteClient: (id: string) => any;
}) {
  const [isCreating, setIsCreating] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [formData, setFormData] = useState({
    name: "", email: "", company: "", phone: "",
    billing_address: { street: "", city: "", state: "", postal_code: "", country: "" },
    tax_id: "", payment_terms: 30, currency: "USD", notes: "",
  });

  const filtered = clients.filter(
    (c) =>
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.company?.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    if (name.startsWith("billing_address.")) {
      const field = name.split(".")[1] as keyof typeof formData.billing_address;
      setFormData((prev) => ({
        ...prev,
        billing_address: { ...prev.billing_address, [field]: value },
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: name === "payment_terms" ? parseInt(value) || 30 : value,
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingClient && editingClient.id) {
        await updateClient(editingClient.id, orgId, formData);
        toast.success("Client updated successfully");
      } else {
        await createClient({ ...formData, org_id: orgId });
        toast.success("Client created successfully");
      }
      resetForm();
    } catch (error: any) {
      toast.error(error.message || "Failed to save client");
    }
  };

  const handleEdit = (client: Client) => {
    setEditingClient(client);
    setFormData({
      name: client.name,
      email: client.email,
      company: client.company || "",
      phone: client.phone || "",
      billing_address: {
        street: client.billing_address?.street || "",
        city: client.billing_address?.city || "",
        state: client.billing_address?.state || "",
        postal_code: client.billing_address?.postal_code || "",
        country: client.billing_address?.country || "",
      },
      tax_id: client.tax_id || "",
      payment_terms: client.payment_terms || 30,
      currency: client.currency || "USD",
      notes: client.notes || "",
    });
    setIsCreating(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this client?")) return;
    try {
      await deleteClient(id);
      toast.success("Client deleted successfully");
    } catch (error: any) {
      toast.error(error.message || "Failed to delete client");
    }
  };

  const resetForm = () => {
    setFormData({
      name: "", email: "", company: "", phone: "",
      billing_address: { street: "", city: "", state: "", postal_code: "", country: "" },
      tax_id: "", payment_terms: 30, currency: "USD", notes: "",
    });
    setIsCreating(false);
    setEditingClient(null);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Clients</h2>
          <p className="text-gray-600 text-sm">Manage clients for this organization</p>
        </div>
        <Button onClick={() => { setEditingClient(null); setIsCreating(true); }}>
          <Plus className="h-4 w-4 mr-2" /> Add Client
        </Button>
      </div>
      <div className="relative flex-1 max-w-sm">
        <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
        <input
          type="text" placeholder="Search clients..."
          className="pl-8 w-full p-2 border rounded-md"
          value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>
      {isCreating ? (
        <Card>
          <CardHeader>
            <CardTitle>{editingClient ? "Edit Client" : "Add New Client"}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="c-name">Name *</Label>
                  <Input id="c-name" name="name" value={formData.name} onChange={handleInputChange} required />
                </div>
                <div>
                  <Label htmlFor="c-email">Email *</Label>
                  <div className="relative">
                    <Mail className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
                    <Input id="c-email" name="email" type="email" value={formData.email} onChange={handleInputChange} className="pl-8" required />
                  </div>
                </div>
                <div>
                  <Label htmlFor="c-company">Company</Label>
                  <Input id="c-company" name="company" value={formData.company} onChange={handleInputChange} />
                </div>
                <div>
                  <Label htmlFor="c-phone">Phone</Label>
                  <div className="relative">
                    <Phone className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
                    <Input id="c-phone" name="phone" value={formData.phone} onChange={handleInputChange} className="pl-8" />
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="c-tax_id">Tax ID</Label>
                  <Input id="c-tax_id" name="tax_id" value={formData.tax_id} onChange={handleInputChange} />
                </div>
                <div>
                  <Label htmlFor="c-payment_terms">Payment Terms (days)</Label>
                  <Input id="c-payment_terms" name="payment_terms" type="number" value={formData.payment_terms} onChange={handleInputChange} />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={resetForm}>Cancel</Button>
                <Button type="submit">{editingClient ? "Update Client" : "Create Client"}</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            {filtered.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Users className="h-12 w-12 mx-auto text-gray-300 mb-2" />
                <p>No clients found</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Company</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((client) => (
                    <TableRow key={client.id}>
                      <TableCell className="font-medium">{client.name}</TableCell>
                      <TableCell>{client.email}</TableCell>
                      <TableCell>{client.company || "-"}</TableCell>
                      <TableCell>{client.phone || "-"}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="outline" size="sm" onClick={() => handleEdit(client)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="destructive" size="sm" onClick={() => client.id && handleDelete(client.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

/* ──────────────────────────────
   Invoices Tab Content
   ────────────────────────────── */
function InvoicesTabContent({
  invoices,
  clients,
  orgId,
  isLoading,
  createInvoice,
  updateInvoice,
  deleteInvoice,
  userId,
  organization,
}: {
  invoices: Invoice[];
  clients: Client[];
  orgId: string;
  isLoading: boolean;
  createInvoice: (data: any, orgId: string) => any;
  updateInvoice: (id: string, updates: any) => any;
  deleteInvoice: (id: string) => any;
  userId: string | null | undefined;
  organization: Organization | null;
}) {
  const [isCreating, setIsCreating] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const filtered = invoices.filter(
    (inv) =>
      inv.number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      clients.some(
        (c) =>
          c.id === inv.client_id &&
          (c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            c.email.toLowerCase().includes(searchTerm.toLowerCase())),
      ),
  );

  const handleCreate = async (invoiceData: Partial<Invoice>) => {
    try {
      if (!userId) throw new Error("User not authenticated");
      if (!organization || !organization.id) throw new Error("Organization required");
      await createInvoice(invoiceData, organization.id);
      toast.success("Invoice created successfully");
      setIsCreating(false);
    } catch (error: any) {
      toast.error(error.message || "Failed to create invoice");
    }
  };

  const handleUpdate = async (id: string, updates: Partial<Invoice>) => {
    try {
      await updateInvoice(id, updates);
      toast.success("Invoice updated successfully");
    } catch (error: any) {
      toast.error(error.message || "Failed to update invoice");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this invoice?")) return;
    try {
      await deleteInvoice(id);
      toast.success("Invoice deleted successfully");
    } catch (error: any) {
      toast.error(error.message || "Failed to delete invoice");
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Invoices</h2>
          <p className="text-gray-600 text-sm">Manage invoices for this organization</p>
        </div>
        <Button onClick={() => setIsCreating(true)}>
          <Plus className="h-4 w-4 mr-2" /> Create Invoice
        </Button>
      </div>
      <div className="relative flex-1 max-w-sm">
        <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
        <input
          type="text" placeholder="Search invoices..."
          className="pl-8 w-full p-2 border rounded-md"
          value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>
      {isCreating ? (
        <Card>
          <CardHeader>
            <CardTitle>Create New Invoice</CardTitle>
          </CardHeader>
          <CardContent>
            <InvoiceForm
              clients={clients}
              onSave={handleCreate}
              onPreview={() => {}}
            />
            <div className="flex justify-end gap-2 mt-4">
              <Button variant="outline" onClick={() => setIsCreating(false)}>Cancel</Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <InvoiceList
          invoices={filtered}
          clients={clients}
          isLoading={isLoading}
          isEmpty={filtered.length === 0}
          isError={false}
          errorMessage={null}
          isReady={!isLoading}
          onCreateNew={() => setIsCreating(true)}
          onView={() => {}}
          onEdit={() => {}}
          onDelete={handleDelete}
          onRetry={() => window.location.reload()}
        />
      )}
    </div>
  );
}

/* ──────────────────────────────
   Expenses Tab Content
   ────────────────────────────── */
function ExpensesTabContent({
  expenses,
  orgId,
  createExpense,
  updateExpense,
  deleteExpense,
}: {
  expenses: Expense[];
  orgId: string;
  createExpense: (data: any) => any;
  updateExpense: (id: string, data: any) => any;
  deleteExpense: (id: string) => any;
}) {
  const [isCreating, setIsCreating] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [formData, setFormData] = useState({
    description: "", amount: 0, date: new Date().toISOString().split("T")[0],
    category: "", vendor: "", tax_deductible: false, notes: "",
  });

  const filtered = expenses.filter(
    (e) =>
      e.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.category?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.vendor?.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const checked = type === "checkbox" ? (e.target as HTMLInputElement).checked : undefined;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : name === "amount" ? parseFloat(value) || 0 : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingExpense) {
        await updateExpense(editingExpense.id, formData);
        toast.success("Expense updated successfully");
      } else {
        await createExpense(formData);
        toast.success("Expense created successfully");
      }
      setFormData({ description: "", amount: 0, date: new Date().toISOString().split("T")[0], category: "", vendor: "", tax_deductible: false, notes: "" });
      setIsCreating(false);
      setEditingExpense(null);
    } catch (error: any) {
      toast.error(error.message || "Failed to save expense");
    }
  };

  const handleEdit = (expense: Expense) => {
    setEditingExpense(expense);
    setFormData({
      description: expense.description,
      amount: expense.amount,
      date: expense.date.split("T")[0],
      category: expense.category || "",
      vendor: expense.vendor || "",
      tax_deductible: expense.tax_deductible,
      notes: expense.notes || "",
    });
    setIsCreating(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this expense?")) return;
    try {
      await deleteExpense(id);
      toast.success("Expense deleted successfully");
    } catch (error: any) {
      toast.error(error.message || "Failed to delete expense");
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Expenses</h2>
          <p className="text-gray-600 text-sm">Manage expenses for this organization</p>
        </div>
        <Button onClick={() => { setEditingExpense(null); setIsCreating(true); }}>
          <Plus className="h-4 w-4 mr-2" /> Add Expense
        </Button>
      </div>
      <div className="relative flex-1 max-w-sm">
        <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
        <input
          type="text" placeholder="Search expenses..."
          className="pl-8 w-full p-2 border rounded-md"
          value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>
      {isCreating ? (
        <Card>
          <CardHeader>
            <CardTitle>{editingExpense ? "Edit Expense" : "Add New Expense"}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="e-desc">Description *</Label>
                  <Input id="e-desc" name="description" value={formData.description} onChange={handleInputChange} required />
                </div>
                <div>
                  <Label htmlFor="e-amount">Amount *</Label>
                  <div className="relative">
                    <DollarSign className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
                    <Input id="e-amount" name="amount" type="number" value={formData.amount} onChange={handleInputChange} className="pl-8" min="0" step="0.01" required />
                  </div>
                </div>
                <div>
                  <Label htmlFor="e-date">Date *</Label>
                  <div className="relative">
                    <Calendar className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
                    <Input id="e-date" name="date" type="date" value={formData.date} onChange={handleInputChange} className="pl-8" required />
                  </div>
                </div>
                <div>
                  <Label htmlFor="e-category">Category</Label>
                  <Input id="e-category" name="category" value={formData.category} onChange={handleInputChange} />
                </div>
                <div>
                  <Label htmlFor="e-vendor">Vendor</Label>
                  <Input id="e-vendor" name="vendor" value={formData.vendor} onChange={handleInputChange} />
                </div>
                <div className="flex items-center pt-6">
                  <input type="checkbox" id="e-tax" name="tax_deductible" checked={formData.tax_deductible} onChange={handleInputChange} className="h-4 w-4 text-blue-600 rounded" />
                  <Label htmlFor="e-tax" className="ml-2">Tax Deductible</Label>
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => { setIsCreating(false); setEditingExpense(null); }}>Cancel</Button>
                <Button type="submit">{editingExpense ? "Update Expense" : "Create Expense"}</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            {filtered.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Receipt className="h-12 w-12 mx-auto text-gray-300 mb-2" />
                <p>No expenses found</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Description</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Vendor</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((expense) => (
                    <TableRow key={expense.id}>
                      <TableCell className="font-medium">{expense.description}</TableCell>
                      <TableCell>{expense.category || "-"}</TableCell>
                      <TableCell>{expense.vendor || "-"}</TableCell>
                      <TableCell>{formatDate(expense.date)}</TableCell>
                      <TableCell className="text-right">{formatCurrency(expense.amount)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="outline" size="sm" onClick={() => handleEdit(expense)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="destructive" size="sm" onClick={() => handleDelete(expense.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

/* ──────────────────────────────
   Payments Tab Content
   ────────────────────────────── */
function PaymentsTabContent({
  payments,
  invoices,
  orgId,
  recordPayment,
  updatePayment,
  deletePayment,
}: {
  payments: PaymentRecord[];
  invoices: Invoice[];
  orgId: string;
  recordPayment: (data: any) => any;
  updatePayment: (id: string, data: any) => any;
  deletePayment: (id: string) => any;
}) {
  const [isCreating, setIsCreating] = useState(false);
  const [editingPayment, setEditingPayment] = useState<PaymentRecord | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [formData, setFormData] = useState({
    amount: 0,
    method: "bank_transfer" as "cash" | "check" | "bank_transfer" | "credit_card" | "paypal" | "other",
    received_on: new Date().toISOString().split("T")[0],
    invoice_id: "",
    reference: "",
    notes: "",
  });

  const filtered = payments.filter(
    (p) =>
      p.reference?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.method.toLowerCase().includes(searchTerm.toLowerCase()) ||
      invoices.some(
        (inv) =>
          inv.id === p.invoice_id &&
          inv.number.toLowerCase().includes(searchTerm.toLowerCase()),
      ),
  );

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const checked = type === "checkbox" ? (e.target as HTMLInputElement).checked : undefined;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : name === "amount" ? parseFloat(value) || 0 : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingPayment) {
        await updatePayment(editingPayment.id, formData);
        toast.success("Payment updated successfully");
      } else {
        await recordPayment(formData);
        toast.success("Payment created successfully");
      }
      setFormData({ amount: 0, method: "bank_transfer", received_on: new Date().toISOString().split("T")[0], invoice_id: "", reference: "", notes: "" });
      setIsCreating(false);
      setEditingPayment(null);
    } catch (error: any) {
      toast.error(error.message || "Failed to save payment");
    }
  };

  const handleEdit = (payment: PaymentRecord) => {
    setEditingPayment(payment);
    setFormData({
      amount: payment.amount,
      method: payment.method,
      received_on: payment.received_on.split("T")[0],
      invoice_id: payment.invoice_id,
      reference: payment.reference || "",
      notes: payment.notes || "",
    });
    setIsCreating(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this payment?")) return;
    try {
      await deletePayment(id);
      toast.success("Payment deleted successfully");
    } catch (error: any) {
      toast.error(error.message || "Failed to delete payment");
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Payments</h2>
          <p className="text-gray-600 text-sm">Manage payments for this organization</p>
        </div>
        <Button onClick={() => { setEditingPayment(null); setIsCreating(true); }}>
          <Plus className="h-4 w-4 mr-2" /> Add Payment
        </Button>
      </div>
      <div className="relative flex-1 max-w-sm">
        <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
        <input
          type="text" placeholder="Search payments..."
          className="pl-8 w-full p-2 border rounded-md"
          value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>
      {isCreating ? (
        <Card>
          <CardHeader>
            <CardTitle>{editingPayment ? "Edit Payment" : "Add New Payment"}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="p-amount">Amount *</Label>
                  <div className="relative">
                    <DollarSign className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
                    <Input id="p-amount" name="amount" type="number" value={formData.amount} onChange={handleInputChange} className="pl-8" min="0" step="0.01" required />
                  </div>
                </div>
                <div>
                  <Label htmlFor="p-method">Payment Method *</Label>
                  <select id="p-method" name="method" value={formData.method} onChange={handleInputChange} className="w-full p-2 border rounded-md" required>
                    <option value="cash">Cash</option>
                    <option value="check">Check</option>
                    <option value="bank_transfer">Bank Transfer</option>
                    <option value="credit_card">Credit Card</option>
                    <option value="paypal">PayPal</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div>
                  <Label htmlFor="p-date">Received On *</Label>
                  <div className="relative">
                    <Calendar className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
                    <Input id="p-date" name="received_on" type="date" value={formData.received_on} onChange={handleInputChange} className="pl-8" required />
                  </div>
                </div>
                <div>
                  <Label htmlFor="p-invoice">Invoice *</Label>
                  <select id="p-invoice" name="invoice_id" value={formData.invoice_id} onChange={handleInputChange} className="w-full p-2 border rounded-md" required>
                    <option value="">Select an invoice</option>
                    {invoices.map((inv) => (
                      <option key={inv.id} value={inv.id}>
                        {inv.number} - {formatCurrency(inv.total)}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label htmlFor="p-reference">Reference</Label>
                  <Input id="p-reference" name="reference" value={formData.reference} onChange={handleInputChange} />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => { setIsCreating(false); setEditingPayment(null); }}>Cancel</Button>
                <Button type="submit">{editingPayment ? "Update Payment" : "Create Payment"}</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            {filtered.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <DollarSign className="h-12 w-12 mx-auto text-gray-300 mb-2" />
                <p>No payments found</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Invoice</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Method</TableHead>
                    <TableHead>Received On</TableHead>
                    <TableHead>Reference</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((payment) => {
                    const invoice = invoices.find((inv) => inv.id === payment.invoice_id);
                    return (
                      <TableRow key={payment.id}>
                        <TableCell className="font-medium">{invoice ? invoice.number : "N/A"}</TableCell>
                        <TableCell>{formatCurrency(payment.amount)}</TableCell>
                        <TableCell className="capitalize">{payment.method.replace("_", " ")}</TableCell>
                        <TableCell>{formatDate(payment.received_on)}</TableCell>
                        <TableCell>{payment.reference || "-"}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button variant="outline" size="sm" onClick={() => handleEdit(payment)}>
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button variant="destructive" size="sm" onClick={() => handleDelete(payment.id)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import Link from "next/link";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Client } from "@/types/invoice";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { formatCurrency, formatDate } from "@/lib/utils";
import {
  Plus,
  Edit,
  Trash2,
  Users,
  Search,
  Mail,
  Phone,
  Building,
  Eye,
  Loader2,
} from "lucide-react";
import { useOrganization } from "@/hooks/use-organization";

// Zod schema for client form, aligned with the new Client type
const clientSchema = z.object({
  name: z.string().min(1, { message: "Client name is required" }),
  email: z.string().email({ message: "Invalid email address" }),
  phone: z.string().optional(),
  billing_address: z
    .object({
      street: z.string().optional(),
      city: z.string().optional(),
      state: z.string().optional(),
      postal_code: z.string().optional(),
      country: z.string().optional(),
    })
    .optional(),
  company: z.string().optional(),
  tax_id: z.string().optional(),
  payment_terms: z.number().min(1).max(365),
  currency: z.string(),
  notes: z.string().optional(),
});

export type ClientFormData = z.infer<typeof clientSchema>;

interface ClientManagementProps {
  clients: Client[];
  onCreateClient: (client: ClientFormData) => Promise<void>;
  onUpdateClient: (
    id: string,
    orgId: string,
    updates: Partial<Client>,
  ) => Promise<void>;
  onDeleteClient: (id: string) => Promise<void>;
}

export function ClientManagement({
  clients,
  onCreateClient,
  onUpdateClient,
  onDeleteClient,
}: ClientManagementProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingClient, setDeletingClient] = useState<string | null>(null);
  const [inDeletion, setInDeletion] = useState(false);
  const { selectedOrganization } = useOrganization();

  const filteredClients = clients.filter(
    (client) =>
      client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.company?.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const handleSaveClient = async (clientData: ClientFormData) => {
    try {
      if (editingClient && selectedOrganization && selectedOrganization.id) {
        if (editingClient.id)
          await onUpdateClient(
            editingClient.id,
            selectedOrganization.id,
            clientData,
          );

        toast.success("Cliend Information Updated");
      } else {
        await onCreateClient(clientData);
        toast.success("Added New Client");
      }
      setIsDialogOpen(false);
      setEditingClient(null);
    } catch (error) {
      toast.error("An error occured during the operation");
    }
  };

  const openEditDialog = (client?: Client) => {
    setEditingClient(client || null);
    setIsDialogOpen(true);
  };

  const handleDeleteClient = async (id: string) => {
    setDeleteDialogOpen(true);
    setDeletingClient(id);
  };

  const handleConfirmDelete = async () => {
    try {
      setInDeletion(true);

      const id = deletingClient;
      if (id) await onDeleteClient(id);

      setDeletingClient(null);
      setInDeletion(false);
      setDeleteDialogOpen(false);
      toast.success("Client deleted");
    } catch (error) {
      setDeletingClient(null);
      setInDeletion(false);
      setDeleteDialogOpen(false);
      toast.error("Something went wrong! Error deleting client");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900 flex items-center">
          <Users className="h-8 w-8 mr-3 text-blue-600" />
          Client Management
        </h1>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button
              onClick={() => openEditDialog()}
              className="flex items-center"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Client
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingClient ? "Edit Client" : "Add New Client"}
              </DialogTitle>
            </DialogHeader>
            <ClientForm
              client={editingClient}
              onSave={handleSaveClient}
              onCancel={() => setIsDialogOpen(false)}
            />
          </DialogContent>
        </Dialog>

        <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          {/*<DialogTrigger asChild>*/}
          {/*<Button
              onClick={() => openEditDialog()}
              className="flex items-center"
            >
              <Plus className="h-4 w-4 mr-2" />

            </Button>*/}
          {/*</DialogTrigger>*/}
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Delete Client</DialogTitle>
            </DialogHeader>
            {/*<ClientForm
              client={editingClient}
              onSave={handleSaveClient}
              onCancel={() => setDeleteDialogOpen(false)}
            />*/}
            <div className="text-base font-normal">
              Are you sure you want to delete this client? This action cant be
              reversed!
            </div>
            <div className="flex justify-end">
              <Button
                variant={"destructive"}
                className="mr-4"
                onClick={handleConfirmDelete}
                disabled={inDeletion ? true : false}
              >
                {inDeletion ? "Deleting..." : "Confirm"}
              </Button>
              <Button
                variant={"outline"}
                onClick={() => setDeleteDialogOpen(false)}
              >
                Cancel
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Cards remain the same, but data source is now correct */}
      </div>

      {/* Search and Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Organization Clients</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search clients..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Clients Table */}
          {filteredClients.length === 0 ? (
            <div className="rounded-md border">
              <Table>
                <TableBody>
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-12">
                      <div className="flex flex-col items-center justify-center space-y-4">
                        <Users className="h-12 w-12 text-gray-400" />
                        <div className="text-center">
                          <h3 className="text-lg font-medium text-gray-900">
                            No clients
                          </h3>
                          <p className="text-gray-500 mt-1">
                            Get started by adding your first client.
                          </p>
                        </div>
                        <Dialog
                          open={isDialogOpen}
                          onOpenChange={setIsDialogOpen}
                        >
                          <DialogTrigger asChild>
                            <Button
                              onClick={() => openEditDialog()}
                              className="mt-2"
                            >
                              <Plus className="h-4 w-4 mr-2" />
                              Add Client
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-2xl">
                            <DialogHeader>
                              <DialogTitle>
                                {editingClient
                                  ? "Edit Client"
                                  : "Add New Client"}
                              </DialogTitle>
                            </DialogHeader>
                            <ClientForm
                              client={editingClient}
                              onSave={handleSaveClient}
                              onCancel={() => setIsDialogOpen(false)}
                            />
                          </DialogContent>
                        </Dialog>
                      </div>
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Client</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Outstanding</TableHead>
                    <TableHead>Last Invoice</TableHead>
                    <TableHead>Profile</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredClients.map((client) => (
                    <TableRow key={client.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{client.name}</div>
                          <div className="text-sm text-gray-600">
                            {client.email}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          {client.phone && (
                            <div className="flex items-center text-sm text-gray-600">
                              <Phone className="h-3 w-3 mr-1" />
                              {client.phone}
                            </div>
                          )}
                          {client.company && (
                            <div className="flex items-center text-sm">
                              <Building className="h-3 w-3 mr-1" />
                              {client.company}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <span
                          className={
                            client.outstanding_balance &&
                            client.outstanding_balance > 0
                              ? "text-orange-600 font-medium"
                              : "text-gray-600"
                          }
                        >
                          {formatCurrency(
                            client.outstanding_balance || 0,
                            client.currency,
                          )}
                        </span>
                      </TableCell>
                      <TableCell>
                        {client.last_invoice_date
                          ? formatDate(new Date(client.last_invoice_date))
                          : "Never"}
                      </TableCell>
                      <TableCell>
                        <Link href={`/clients/${client.id}`} passHref>
                          <Button variant="outline" size="sm">
                            <Eye className="h-4 w-4 mr-2" />
                            View Profile
                          </Button>
                        </Link>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openEditDialog(client)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              if (client.id) handleDeleteClient(client.id);
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

interface ClientFormProps {
  client: Client | null;
  onSave: (client: ClientFormData) => Promise<void>;
  onCancel: () => void;
}

function ClientForm({ client, onSave, onCancel }: ClientFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<ClientFormData>({
    resolver: zodResolver(clientSchema),
    // defaultValues: {
    //   name: client?.name || "",
    //   email: client?.email || "",
    //   phone: client?.phone || "",
    //   billing_address: client?.billing_address || {
    //     street: "",
    //     city: "",
    //     state: "",
    //     postal_code: "",
    //     country: "",
    //   },
    //   company: client?.company || "",
    //   tax_id: client?.tax_id || "",
    //   payment_terms: client?.payment_terms || 30,
    //   currency: client?.currency || "USD",
    //   notes: client?.notes || "",
    // },
    defaultValues: {
      name: "" || client?.name,
      email: "" || client?.email,
      phone: "" || client?.phone,
      billing_address: {
        street: "" || client?.billing_address?.street,
        city: "" || client?.billing_address?.city,
        state: "" || client?.billing_address?.state,
        postal_code: "" || client?.billing_address?.postal_code,
        country: "" || client?.billing_address?.country,
      },
      company: "" || client?.company,
      tax_id: "" || client?.tax_id,
      payment_terms: 0 || client?.payment_terms,
      currency: "USD" || client?.currency,
      notes: "" || client?.notes,
    },
  });

  const handleFormSubmit = async (data: ClientFormData) => {
    setIsSubmitting(true);
    await onSave(data);
    setIsSubmitting(false);
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input {...register("name")} placeholder="Client Name *" />
        <Input {...register("email")} placeholder="Email *" />
        <Input {...register("phone")} placeholder="Phone" />
        <Input {...register("company")} placeholder="Company" />
        <Input {...register("billing_address.street")} placeholder="Street" />
        <Input {...register("billing_address.city")} placeholder="City" />
        <Input {...register("billing_address.state")} placeholder="State" />
        <Input
          {...register("billing_address.postal_code")}
          placeholder="Postal Code"
        />
        <Input {...register("billing_address.country")} placeholder="Country" />
        <Input
          type="number"
          {...register("payment_terms", { valueAsNumber: true })}
          placeholder="Payment Terms (days)"
        />
        <Input {...register("tax_id")} placeholder="Tax ID" />
        <Controller
          name="currency"
          control={control}
          render={({ field }) => (
            <Select onValueChange={field.onChange} value={field.value}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="USD">USD</SelectItem>
                <SelectItem value="EUR">EUR</SelectItem>
              </SelectContent>
            </Select>
          )}
        />
      </div>
      <Textarea {...register("notes")} placeholder="Notes" />
      <div className="flex justify-end space-x-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {client ? "Update Client" : "Add Client"}
        </Button>
      </div>
    </form>
  );
}

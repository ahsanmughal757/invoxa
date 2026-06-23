"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { BackButton } from "@/components/ui/back-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  Plus,
  Search,
  Edit,
  Trash2,
  Phone,
  Mail,
  MapPin,
  Globe,
  Building,
} from "lucide-react";
import { Client } from "@/types/invoice";
import { useInvoices } from "@/hooks/use-invoices";
import toast from "react-hot-toast";
import { useClients } from "@/hooks/use-clients";

export default function ClientsCollaborationPage() {
  const { orgId } = useParams<{ orgId: string }>();
  const { clients, createClient, updateClient, deleteClient } = useClients();
  const [isCreating, setIsCreating] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    company: "",
    phone: "",
    billing_address: {
      street: "",
      city: "",
      state: "",
      postal_code: "",
      country: "",
    },
    tax_id: "",
    payment_terms: 30,
    currency: "USD",
    notes: "",
  });

  // Filter clients by organization
  const orgClients = clients.filter((client) => client.org_id === orgId);

  // Filter based on search term
  const filteredClients = orgClients.filter(
    (client) =>
      client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.company?.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => {
    const { name, value } = e.target;

    // Handle nested billing_address fields
    if (name.startsWith("billing_address.")) {
      const field = name.split(".")[1] as keyof typeof formData.billing_address;
      setFormData((prev) => ({
        ...prev,
        billing_address: {
          ...prev.billing_address,
          [field]: value,
        },
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
        // Update existing client
        await updateClient(editingClient.id, orgId, formData);
        toast.success("Client updated successfully");
      } else {
        // Create new client
        await createClient({ ...formData, org_id: orgId });
        toast.success("Client created successfully");
      }

      // Reset form and state
      setFormData({
        name: "",
        email: "",
        company: "",
        phone: "",
        billing_address: {
          street: "",
          city: "",
          state: "",
          postal_code: "",
          country: "",
        },
        tax_id: "",
        payment_terms: 30,
        currency: "USD",
        notes: "",
      });
      setIsCreating(false);
      setEditingClient(null);
    } catch (error: any) {
      console.error("Error saving client:", error);
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
    if (!confirm("Are you sure you want to delete this client?")) {
      return;
    }

    try {
      await deleteClient(id);
      toast.success("Client deleted successfully");
    } catch (error: any) {
      console.error("Error deleting client:", error);
      toast.error(error.message || "Failed to delete client");
    }
  };

  const handleCancel = () => {
    setIsCreating(false);
    setEditingClient(null);
    setFormData({
      name: "",
      email: "",
      company: "",
      phone: "",
      billing_address: {
        street: "",
        city: "",
        state: "",
        postal_code: "",
        country: "",
      },
      tax_id: "",
      payment_terms: 30,
      currency: "USD",
      notes: "",
    });
  };

  // if (isLoading) {
  //   return (
  //     <div className="flex justify-center items-center h-64">
  //       <p>Loading clients...</p>
  //     </div>
  //   );
  // }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Clients Collaboration
          </h1>
          <p className="text-gray-600 mt-1">
            Manage clients for your organization
          </p>
        </div>
        <div className="flex items-center gap-2">
          <BackButton href={`/organization/${orgId}/collaboration`}>Back to Collaboration Dashboard</BackButton>
          <Button
            onClick={() => {
              setEditingClient(null);
              setIsCreating(true);
            }}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Client
          </Button>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
          <input
            type="text"
            placeholder="Search clients..."
            className="pl-8 w-full p-2 border rounded-md"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {isCreating ? (
        <Card>
          <CardHeader>
            <CardTitle>
              {editingClient ? "Edit Client" : "Add New Client"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Name *</Label>
                  <Input
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email *</Label>
                  <div className="relative">
                    <Mail className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      className="pl-8 w-full p-2 border rounded-md"
                      required
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="company">Company</Label>
                  <Input
                    id="company"
                    name="company"
                    value={formData.company}
                    onChange={handleInputChange}
                  />
                </div>
                <div>
                  <Label htmlFor="phone">Phone</Label>
                  <div className="relative">
                    <Phone className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
                    <Input
                      id="phone"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      className="pl-8 w-full p-2 border rounded-md"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="tax_id">Tax ID</Label>
                  <Input
                    id="tax_id"
                    name="tax_id"
                    value={formData.tax_id}
                    onChange={handleInputChange}
                  />
                </div>
                <div>
                  <Label htmlFor="payment_terms">Payment Terms (days)</Label>
                  <Input
                    id="payment_terms"
                    name="payment_terms"
                    type="number"
                    value={formData.payment_terms}
                    onChange={handleInputChange}
                    min="0"
                  />
                </div>
                <div>
                  <Label htmlFor="currency">Currency</Label>
                  <select
                    id="currency"
                    name="currency"
                    value={formData.currency}
                    onChange={handleInputChange}
                    className="w-full p-2 border rounded-md"
                  >
                    <option value="USD">USD</option>
                    <option value="EUR">EUR</option>
                    <option value="GBP">GBP</option>
                    <option value="JPY">JPY</option>
                    <option value="CAD">CAD</option>
                    <option value="AUD">AUD</option>
                  </select>
                </div>
              </div>

              <div>
                <Label htmlFor="street">Street Address</Label>
                <Input
                  id="street"
                  name="billing_address.street"
                  value={formData.billing_address.street}
                  onChange={handleInputChange}
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="city">City</Label>
                  <Input
                    id="city"
                    name="billing_address.city"
                    value={formData.billing_address.city}
                    onChange={handleInputChange}
                  />
                </div>
                <div>
                  <Label htmlFor="state">State</Label>
                  <Input
                    id="state"
                    name="billing_address.state"
                    value={formData.billing_address.state}
                    onChange={handleInputChange}
                  />
                </div>
                <div>
                  <Label htmlFor="postal_code">Postal Code</Label>
                  <Input
                    id="postal_code"
                    name="billing_address.postal_code"
                    value={formData.billing_address.postal_code}
                    onChange={handleInputChange}
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="country">Country</Label>
                <Input
                  id="country"
                  name="billing_address.country"
                  value={formData.billing_address.country}
                  onChange={handleInputChange}
                />
              </div>

              <div>
                <Label htmlFor="notes">Notes</Label>
                <textarea
                  id="notes"
                  name="notes"
                  value={formData.notes}
                  onChange={handleInputChange}
                  className="w-full p-2 border rounded-md"
                  rows={3}
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={handleCancel}>
                  Cancel
                </Button>
                <Button type="submit">
                  {editingClient ? "Update Client" : "Create Client"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Clients</CardTitle>
          </CardHeader>
          <CardContent>
            {filteredClients.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Building className="h-12 w-12 mx-auto text-gray-300 mb-2" />
                <p>No clients found</p>
                <p className="text-sm mt-1">
                  Add your first client using the button above
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Company</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredClients.map((client) => (
                      <TableRow key={client.id}>
                        <TableCell className="font-medium">
                          {client.name}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center">
                            <Mail className="h-4 w-4 mr-1 text-gray-500" />
                            {client.email}
                          </div>
                        </TableCell>
                        <TableCell>{client.company || "-"}</TableCell>
                        <TableCell>
                          {client.phone ? (
                            <div className="flex items-center">
                              <Phone className="h-4 w-4 mr-1 text-gray-500" />
                              {client.phone}
                            </div>
                          ) : (
                            "-"
                          )}
                        </TableCell>
                        <TableCell>
                          {client.billing_address ? (
                            <div className="flex items-center">
                              <MapPin className="h-4 w-4 mr-1 text-gray-500" />
                              {client.billing_address.city},{" "}
                              {client.billing_address.country}
                            </div>
                          ) : (
                            "-"
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEdit(client)}
                            >
                              <Edit className="h-4 w-4 mr-2" />
                              Edit
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => {
                                if (client.id) handleDelete(client.id);
                              }}
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
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
      )}
    </div>
  );
}

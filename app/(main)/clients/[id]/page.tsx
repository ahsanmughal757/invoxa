import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Mail,
  Phone,
  MapPin,
  DollarSign,
  FileText,
  Calendar,
  CreditCard,
  Building,
  AlertCircle,
} from "lucide-react";
import { Client, Invoice, PaymentRecord } from "@/types/invoice";
import { formatCurrency } from "@/lib/utils";
import { getClientProfileData } from "@/lib/queries/client-profile";
import { getSupabaseUser } from "@/lib/auth";
import { getOrganizationsByOwnerId } from "@/lib/queries/organizations";
import ClientProfileWrapper from "@/components/clients/client-profile-wrapper";

type ClientProfilePageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function ClientProfilePage({
  params,
}: ClientProfilePageProps) {
  const { id } = await params;

  let client: Client | null = null;
  let clientInvoices: Invoice[] = [];
  let clientPayments: PaymentRecord[] = [];

  try {
    // Get the authenticated user
    const user = await getSupabaseUser();
    if (!user) {
      throw new Error("User not authenticated");
    }

    // Get the organization ID for the user
    const organization = await getOrganizationsByOwnerId(user.clerk_user_id);
    if (!organization || !organization.id) {
      throw new Error("Organization not found for user");
    }

    const orgId = organization.id;

    const data = await getClientProfileData(orgId, id);
    client = data.client;
    clientInvoices = data.invoices;
    clientPayments = data.payments;
  } catch (error) {
    console.error("Error fetching client data:", error);
    // Handle error appropriately
  }

  if (!client) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 mx-auto text-red-500 mb-2" />
          <p className="text-lg font-medium">Client not found</p>
          <p className="text-gray-500">
            The requested client could not be found
          </p>
        </div>
      </div>
    );
  }

  return (
    <ClientProfileWrapper
      initialClient={client}
      initialInvoices={clientInvoices}
      initialPayments={clientPayments}
    />
  );
}

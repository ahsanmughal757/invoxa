"use client";

import { useState, useEffect } from "react";
import { SignedIn, UserButton } from "@clerk/nextjs";
import { useInvoices } from "@/hooks/use-invoices";
import { useAuth } from "@clerk/nextjs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { RoleIndicator } from "@/components/ui/role-indicator";
import { Button } from "@/components/ui/button";

import {
  User,
  FileText,
  Receipt,
  Users,
  DollarSign,
  Activity,
  TriangleAlert,
  ArrowUpRight,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import {
  getOrganizationMembers,
  MemberActivity,
} from "@/lib/queries/members";
import {
  EmptyState,
  ErrorState,
  LoadingState,
} from "@/components/ui/state-components";
import { NoOrganizationState } from "@/components/empty-states/no-organization-state";
import { useRouter } from "next/navigation";
import { OrganizationGuard } from "@/components/guards/organization-guard";
import { useOrganization } from "@/hooks/use-organization";

export default function MembersManagementPage() {
  // const {
  //   // organization,
  //   // invoices,
  //   // expenses,
  //   // clients,
  //   // memberOrganizations,
  //   isLoading: hookLoading,
  //   isError: hookError,
  //   errorMessage: hookErrorMessage,
  // } = useInvoices();
  const {
    selectedOrganization: organization,
    memberOrganizations,
    isEmpty: orgIsEmpty,
  } = useOrganization();

  const router = useRouter();
  const { userId } = useAuth();
  const [members, setMembers] = useState<MemberActivity[]>([]);

  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch real data from API
  useEffect(() => {
    // if (!hookLoading) {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        if (!organization) {
          // if (memberOrganizations.length === 0) {
          //   setError("You are not a member of any organization.");
          //   setLoading(false);
          //   return;
          // } else if (memberOrganizations.length > 0) {
          //   const cleanedData = memberOrganizations.map((org: any) => ({
          //     ...org,
          //     ...org.organization,
          //   }));
          //   console.log("User belongs to multiple organizations:", cleanedData);
          //   org = cleanedData[0]; // Assuming the first organization is the one we want to display
          // }

          setError("You are not an owner of any organization");
          setLoading(false);
          return;
        }

        if (!organization.id) {
          setError("You have no organization to add members.");
          return;
        }
        const fetchedMembers = await getOrganizationMembers(organization.id);

        console.log("Fetched members:", fetchedMembers);
        setMembers(fetchedMembers ? fetchedMembers : []);
      } catch (err) {
        console.error("Error fetching member data:", err);
        setError("Failed to load member data. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    // }
  }, [organization, memberOrganizations]);



  // No Organization State
  if (orgIsEmpty) {
    return <NoOrganizationState />;
  }

  // Error State
  if (error) {
    return (
      <ErrorState
        title="Something went wrong!"
        description={
          error ||
          "There was an issue retrieving member page data. Please try again later."
        }
        onRetry={() => window.location.reload()}
      />
    );
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };



  if (loading) {
    return <LoadingState message="Loading member activity..." size="large" />;
  }

  // if (error) {
  //   return (
  //     <div className="flex justify-center items-center h-64">
  //       <div className="text-center">
  //         <p className="text-red-600 mb-4">{error}</p>
  //         <Button onClick={() => window.location.reload()}>Retry</Button>
  //       </div>
  //     </div>
  //   );
  // }

  return (
    <OrganizationGuard>
      <div className="space-y-6">
        {/* Development Warning Alert */}
        <div className="mb-6">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center">
              <TriangleAlert className="h-5 w-5 text-red-600 mr-2" />
              <h2 className="text-lg font-semibold text-red-800">
                Warning Under Development - (Experimental)
              </h2>
            </div>
            <p className="text-sm text-red-600 mt-1">
              This page is under development and things may break if not
              careful. It is for under development features.
            </p>
          </div>
        </div>

        <div>
          <h1 className="text-3xl font-bold text-gray-900">Member Activity</h1>
          <p className="text-gray-600 mt-1">
            Track activities performed by organization members
          </p>
        </div>

        <div className="flex justify-end">
          <Button onClick={() => router.push("members/manage")}>
            Manage Members <ArrowUpRight className="h-4 w-4 ml-2" />
          </Button>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4 flex items-center">
              <div className="bg-blue-100 p-3 rounded-lg mr-4">
                <User className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Members</p>
                <p className="text-2xl font-bold">{members.length}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 flex items-center">
              <div className="bg-green-100 p-3 rounded-lg mr-4">
                <FileText className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Invoices Created</p>
                <p className="text-2xl font-bold">
                  {members.reduce(
                    (sum: number, member: any) => sum + member.invoiceCount,
                    0,
                  )}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 flex items-center">
              <div className="bg-purple-100 p-3 rounded-lg mr-4">
                <Receipt className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Expenses Added</p>
                <p className="text-2xl font-bold">
                  {members.reduce(
                    (sum, member) => sum + member.expenseCount,
                    0,
                  )}
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
                <p className="text-sm text-gray-600">Clients Added</p>
                <p className="text-2xl font-bold">
                  {members.reduce((sum, member) => sum + member.clientCount, 0)}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Organization Members */}
        <Card>
          <CardHeader>
            <CardTitle>Organization Members</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="py-2 text-left">Member</th>
                    <th className="py-2 text-left">Role</th>
                    <th className="py-2 text-right">Invoices</th>
                    <th className="py-2 text-right">Expenses</th>
                    <th className="py-2 text-right">Clients</th>
                    <th className="py-2 text-right">Total Amount</th>
                    <th className="py-2 text-left">Last Activity</th>
                  </tr>
                </thead>
                <tbody>
                  {members.map((member) => (
                    <tr
                      key={member.id}
                      className="border-b hover:bg-gray-50"
                    >
                      <td className="py-3">
                        <div className="flex items-center">
                          <div className="bg-gray-200 border-2 border-dashed rounded-xl w-8 h-8 mr-2" />
                          <div>
                            <div className="font-medium">{member.name}</div>
                            <div className="text-sm text-gray-500">
                              {member.email}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3">
                        <RoleIndicator role={member.role} size="sm" />
                      </td>
                      <td className="py-3 text-right">
                        {member.invoiceCount}
                      </td>
                      <td className="py-3 text-right">
                        {member.expenseCount}
                      </td>
                      <td className="py-3 text-right">
                        {member.clientCount}
                      </td>
                      <td className="py-3 text-right font-medium">
                        {formatCurrency(member.totalInvoiceAmount)}
                      </td>
                      <td className="py-3">
                        {formatDate(member.lastActivity)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Member Activity Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {members.map((member) => (
            <Card key={member.id}>
              <CardHeader>
                <CardTitle className="flex items-center">
                  {/* <div className="bg-gray-200 border-2 border-dashed rounded-xl w-10 h-10 mr-3" /> */}
                  <img
                    src={member.avatarUrl}
                    className="bg-gray-200 border-2 border-dashed rounded-xl w-10 h-10 mr-3"
                  />
                  <div>
                    <div className="flex items-center gap-2">
                      {member.name}
                      <RoleIndicator role={member.role} size="sm" />
                    </div>
                    <div className="text-sm font-normal text-gray-500">
                      {member.email}
                    </div>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Invoices:</span>
                    <span className="font-medium">{member.invoiceCount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Expenses:</span>
                    <span className="font-medium">{member.expenseCount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Clients:</span>
                    <span className="font-medium">{member.clientCount}</span>
                  </div>
                  <div className="flex justify-between pt-2 border-t">
                    <span className="text-gray-600">Total:</span>
                    <span className="font-medium">
                      {formatCurrency(member.totalInvoiceAmount)}
                    </span>
                  </div>
                </div>
                <div className="mt-4 text-sm text-gray-500">
                  Last active: {formatDate(member.lastActivity)}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </OrganizationGuard>
  );
}

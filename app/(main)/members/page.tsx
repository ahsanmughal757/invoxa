"use client";

import { useState, useEffect } from "react";
import { SignedIn, UserButton } from "@clerk/nextjs";
import { useInvoices } from "@/hooks/use-invoices";
import { useAuth } from "@clerk/nextjs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { RoleIndicator } from "@/components/ui/role-indicator";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  User,
  FileText,
  Receipt,
  Users,
  Calendar,
  DollarSign,
  Activity,
  Search,
  Filter,
  TriangleAlert,
  ArrowUpRight,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import {
  getOrganizationMembers,
  getMemberActivityLogs,
  MemberActivity,
  ActivityLog,
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
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [filteredActivities, setFilteredActivities] = useState<ActivityLog[]>(
    [],
  );
  const [selectedMember, setSelectedMember] = useState<string>("all");
  const [dateRange, setDateRange] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState<string>("");
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
        // Fetch members and activities in parallel
        const fetchedMembers = await getOrganizationMembers(organization.id);
        const fetchedActivities = await getMemberActivityLogs(organization.id);

        console.log("Fetched members:", fetchedMembers);
        console.log("Fetched activities:", fetchedActivities);
        // debugger;
        setMembers(fetchedMembers ? fetchedMembers : []);
        setActivities(fetchedActivities);
        setFilteredActivities(fetchedActivities);
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

  // Filter activities based on selected filters
  useEffect(() => {
    let filtered = activities;

    // Filter by member
    if (selectedMember !== "all") {
      filtered = filtered.filter(
        (activity) => activity.memberId === selectedMember,
      );
    }

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(
        (activity) =>
          activity.memberName
            .toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          activity.entityName.toLowerCase().includes(searchTerm.toLowerCase()),
      );
    }

    setFilteredActivities(filtered);
  }, [selectedMember, searchTerm, activities]);

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

  const getActionText = (
    action: string,
    entityName: string,
    entityAmount?: number,
  ) => {
    switch (action) {
      case "created_invoice":
        return `created invoice ${entityName} for ${formatCurrency(entityAmount || 0)}`;
      case "created_expense":
        return `added expense ${entityName} for ${formatCurrency(entityAmount || 0)}`;
      case "added_client":
        return `added client ${entityName}`;
      case "made_payment":
        return `recorded payment for ${entityName} of ${formatCurrency(entityAmount || 0)}`;
      default:
        return `${action.replace("_", " ")} ${entityName}`;
    }
  };

  const getActivityIcon = (entityType: string) => {
    switch (entityType) {
      case "invoice":
        return <FileText className="h-4 w-4 text-blue-500" />;
      case "expense":
        return <Receipt className="h-4 w-4 text-red-500" />;
      case "client":
        return <Users className="h-4 w-4 text-green-500" />;
      case "payment":
        return <DollarSign className="h-4 w-4 text-yellow-500" />;
      default:
        return <Activity className="h-4 w-4 text-gray-500" />;
    }
  };

  const getActivityBadgeVariant = (entityType: string) => {
    switch (entityType) {
      case "invoice":
        return "default";
      case "expense":
        return "destructive";
      case "client":
        return "secondary";
      case "payment":
        return "outline";
      default:
        return "outline";
    }
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

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Activity Filters</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
                  <input
                    type="text"
                    placeholder="Search activities..."
                    className="pl-8 w-full p-2 border rounded-md"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <select
                  className="p-2 border rounded-md"
                  value={selectedMember}
                  onChange={(e) => setSelectedMember(e.target.value)}
                >
                  <option value="all">All Members</option>
                  {members.map((member) => (
                    <option key={member.id} value={member.id}>
                      {member.name}
                    </option>
                  ))}
                </select>
                <select
                  className="p-2 border rounded-md"
                  value={dateRange}
                  onChange={(e) => setDateRange(e.target.value)}
                >
                  <option value="all">All Time</option>
                  <option value="today">Today</option>
                  <option value="week">This Week</option>
                  <option value="month">This Month</option>
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Main Content */}
        <Tabs defaultValue="activity" className="space-y-4">
          <TabsList>
            <TabsTrigger value="activity">Activity Feed</TabsTrigger>
            <TabsTrigger value="members">Members</TabsTrigger>
          </TabsList>
          <TabsContent value="activity" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Recent Activities</CardTitle>
              </CardHeader>
              <CardContent>
                {filteredActivities.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Activity className="h-12 w-12 mx-auto text-gray-300 mb-2" />
                    <p>No activities found matching your filters</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {filteredActivities.map((activity) => (
                      <div
                        key={activity.id}
                        className="flex items-start p-4 border rounded-lg"
                      >
                        <div className="mr-4 mt-1">
                          {getActivityIcon(activity.entityType)}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <p className="font-medium">
                              <span className="font-semibold">
                                {activity.memberName}
                              </span>{" "}
                              {getActionText(
                                activity.action,
                                activity.entityName,
                                activity.entityAmount,
                              )}
                            </p>
                            <Badge
                              variant={getActivityBadgeVariant(
                                activity.entityType,
                              )}
                            >
                              {activity.entityType}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-500">
                            {formatDate(activity.created_at)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="members" className="space-y-4">
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
          </TabsContent>
        </Tabs>

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

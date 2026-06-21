"use server";

import { createAdminClient } from "@/lib/supabase/server";
import { clerkClient } from "@clerk/nextjs/server";
import { Logger } from "@/lib/utils/logger";
import { userAgent } from "next/server";

type OrgMemberWithProfile = {
  id: string;
  user_id: string;
  role: string;
  created_at: string;
  profiles: {
    id: string;
    name: string;
    email: string;
    clerk_user_id?: string;
  } | null;
};

type ActivityLogWithProfile = {
  id: string;
  actor_user_id: string;
  role: string;
  entity_id: string | null;
  entity_type: string | null;
  created_at: string;
  action: string;
  meta: any;
  profiles: {
    id: string;
    name: string;
    email: string;
    clerk_user_id?: string;
  } | null;
};
// Define interfaces for the data structures
export interface MemberActivity {
  id: string;
  name: string;
  email: string;
  role: string;
  joinDate: string;
  avatarUrl?: string;
  profiles?:
    | {
        id: string;
        name: string;
        email: string;
        clerk_user_id: string;
      }
    | {
        id: string;
        name: string;
        email: string;
        clerk_user_id: string;
      }[];
  invoiceCount: number;
  expenseCount: number;
  clientCount: number;
  totalInvoiceAmount: number;
  lastActivity: string;
}

export interface ActivityLog {
  id: string;
  memberId: string;
  memberName: string;
  action:
    | "created_invoice"
    | "updated_invoice"
    | "deleted_invoice"
    | "created_expense"
    | "updated_expense"
    | "deleted_expense"
    | "added_client"
    | "updated_client"
    | "deleted_client"
    | "made_payment"
    | "updated_payment"
    | "deleted_payment"
    | "none";
  entityName: string;
  entityAmount?: number;
  created_at: string;
  entityType: "invoice" | "expense" | "client" | "payment" | "none";
}

// Get all members of an organization with their activity statistics
export const getOrganizationMembers = async (orgId: string) => {
  const supabase = await createAdminClient();
  const client = await clerkClient();

  try {
    // First, get the members with their roles
    // const { data: membersData, error: membersError } = await supabase
    //   .from('org_members')
    //   .select(`
    //     id,
    //     user_id,
    //     role,
    //     created_at,
    //     profiles:profiles!user_id(id, name, email)
    //   `)
    //   .eq('org_id', orgId);
    const { data: membersData, error: membersError } = await supabase
      .from("org_members")
      .select(
        `
        id,
        user_id,
        role,
        created_at,
        profiles (
          id,
          name,
          email,
          clerk_user_id
        )
      `,
      )
      .eq("org_id", orgId)
      .returns<OrgMemberWithProfile[]>();

    console.log("orgId: ", orgId);
    console.log("Fetched members data:", membersData);

    if (membersError) {
      Logger.error(
        "GET_ORG_MEMBERS",
        "Error fetching organization members",
        membersError,
        { orgId },
      );
      throw membersError;
    }

    // Process the members data to add activity statistics
    const membersWithStats: MemberActivity[] = [];

    for (const member of membersData) {
      try {
        // Get invoice count and total amount for this organization
        const { count: invoiceCount, error: invoiceCountError } = await supabase
          .from("invoices")
          .select("*", { count: "exact", head: true })
          .eq("org_id", orgId);

        if (invoiceCountError) {
          Logger.error(
            "GET_INVOICE_COUNT",
            "Error counting invoices",
            invoiceCountError,
            { orgId, userId: member.user_id },
          );
        }

        // Get total invoice amount for this organization
        const { data: invoiceTotals, error: invoiceTotalError } = await supabase
          .from("invoices")
          .select("total")
          .eq("org_id", orgId)
          .filter(
            "additional_info->>created_by_profile_id",
            "eq",
            member.user_id,
          );

        if (invoiceTotalError) {
          Logger.error(
            "GET_INVOICE_TOTALS",
            "Error fetching invoice totals",
            invoiceTotalError,
            { orgId },
          );
        }

        const totalInvoiceAmount =
          invoiceTotals?.reduce((sum, inv) => sum + (inv.total || 0), 0) || 0;

        // Get expense count for this organization
        const { count: expenseCount, error: expenseCountError } = await supabase
          .from("expenses")
          .select("*", { count: "exact", head: true })
          .eq("org_id", orgId)
          .filter(
            "additional_info->>created_by_profile_id",
            "eq",
            member.user_id,
          );

        if (expenseCountError) {
          Logger.error(
            "GET_EXPENSE_COUNT",
            "Error counting expenses",
            expenseCountError,
            { orgId, userId: member.user_id },
          );
        }

        // Get client count for this organization
        const { count: clientCount, error: clientCountError } = await supabase
          .from("clients")
          .select("*", { count: "exact", head: true })
          .eq("org_id", orgId)
          .filter(
            "additional_info->>created_by_profile_id",
            "eq",
            member.user_id,
          );

        if (clientCountError) {
          Logger.error(
            "GET_CLIENT_COUNT",
            "Error counting clients",
            clientCountError,
            { orgId, userId: member.user_id },
          );
        }

        // Get last activity timestamp for this organization
        // Check invoices for most recent activity
        const { data: lastInvoiceActivity, error: lastInvoiceError } =
          await supabase
            .from("invoices")
            .select("created_at")
            .eq("org_id", orgId)
            .order("created_at", { ascending: false })
            .filter(
              "additional_info->>created_by_profile_id",
              "eq",
              member.user_id,
            )
            .limit(1);

        if (lastInvoiceError) {
          Logger.error(
            "GET_LAST_INVOICE_ACTIVITY",
            "Error fetching last invoice activity",
            lastInvoiceError,
            { orgId, userId: member.user_id },
          );
        }

        // Check expenses for more recent activity
        const { data: lastExpenseActivity, error: lastExpenseError } =
          await supabase
            .from("expenses")
            .select("created_at")
            .eq("org_id", orgId)
            .order("created_at", { ascending: false })
            .filter(
              "additional_info->>created_by_profile_id",
              "eq",
              member.user_id,
            )
            .limit(1);

        if (lastExpenseError) {
          Logger.error(
            "GET_LAST_EXPENSE_ACTIVITY",
            "Error fetching last expense activity",
            lastExpenseError,
            { orgId, userId: member.user_id },
          );
        }

        // Check clients for more recent activity
        const { data: lastClientActivity, error: lastClientError } =
          await supabase
            .from("clients")
            .select("created_at")
            .eq("org_id", orgId)
            .order("created_at", { ascending: false })
            .filter(
              "additional_info->>created_by_profile_id",
              "eq",
              member.user_id,
            )
            .limit(1);

        if (lastClientError) {
          Logger.error(
            "GET_LAST_CLIENT_ACTIVITY",
            "Error fetching last client activity",
            lastClientError,
            { orgId, userId: member.user_id },
          );
        }

        // Determine the most recent activity timestamp
        const activityTimestamps = [
          lastInvoiceActivity?.[0]?.created_at || null,
          lastExpenseActivity?.[0]?.created_at || null,
          lastClientActivity?.[0]?.created_at || null,
          member.created_at, // Member join date as fallback
        ].filter(Boolean) as string[];

        let lastActivityDate = member.created_at; // Default to join date
        if (activityTimestamps.length > 0) {
          // Find the most recent date
          lastActivityDate = activityTimestamps.reduce((latest, current) => {
            return new Date(current) > new Date(latest) ? current : latest;
          }, member.created_at);
        }

        // const membersFormatted = member as MemberActivity
        if (!member.profiles) return;

        let user = null;
        if (member.profiles?.clerk_user_id)
          user = await client.users.getUser(member.profiles?.clerk_user_id);
        // Create a clean, serializable object for the member
        const cleanMember: MemberActivity = {
          id: member.user_id,
          // name: member.profiles.length > 0 ? member.profiles[0]?.name : member.profiles?.name || 'Unknown User',
          // email: member.profiles.length > 0 ? member.profiles[0]?.email : member.profiles?.email || '',
          name: member.profiles?.name || "Unknown User",
          email: member.profiles?.email || "",
          avatarUrl: user?.imageUrl,
          role: member.role,
          joinDate: member.created_at,
          invoiceCount: invoiceCount || 0,
          expenseCount: expenseCount || 0,
          clientCount: clientCount || 0,
          totalInvoiceAmount,
          lastActivity: lastActivityDate,
        };

        // Ensure the object is properly serializable by converting to JSON and back
        membersWithStats.push(cleanMember);
      } catch (memberError) {
        Logger.error(
          "PROCESS_MEMBER_STATS",
          "Error processing member stats",
          memberError,
          { orgId, userId: member.user_id },
        );
        // Add a default entry for this member to maintain data integrity
        let user = null;
        if (member.profiles?.clerk_user_id)
          user = await client.users.getUser(member.profiles?.clerk_user_id);

        const defaultMember: MemberActivity = {
          id: member.user_id,
          // name: member.profiles.length > 0 ? member.profiles[0]?.name : member.profiles.name || 'Unknown User',
          // email: member.profiles.length > 0 ? member.profiles[0]?.email : member.profiles.email || '',
          name: member.profiles?.name || "Unknown User",
          email: member.profiles?.email || "",
          avatarUrl: user?.imageUrl,
          role: member.role,
          joinDate: member.created_at,
          invoiceCount: 0,
          expenseCount: 0,
          clientCount: 0,
          totalInvoiceAmount: 0,
          lastActivity: member.created_at,
        };

        // Ensure the default object is properly serializable
        // membersWithStats.push(JSON.parse(JSON.stringify(defaultMember)));
        membersWithStats.push(defaultMember);
      }
    }

    Logger.info(
      "GET_ORG_MEMBERS",
      "Organization members fetched successfully",
      {
        orgId,
        entityType: "org_members",
        details: { count: membersWithStats.length },
      },
    );
    console.log("Members with stats:", membersWithStats);
    return membersWithStats;
  } catch (error) {
    Logger.error(
      "GET_ORG_MEMBERS",
      "Unexpected error fetching organization members",
      error,
      { orgId },
    );
    throw error;
  }
}

// Get activity logs for all members in an organization
export const getMemberActivityLogs = async (
  orgId: string,
  filters?: { memberId?: string; dateFrom?: string; dateTo?: string },
) => {
  const supabase = await createAdminClient();

  try {
    // Build the query with proper joins to get member information
    // let query = supabase
    //   .from('activity_log')
    //   .select(`
    //     activity_log.id,
    //     activity_log.org_id,
    //     activity_log.actor_user_id,
    //     activity_log.entity_type,
    //     activity_log.entity_id,
    //     activity_log.action,
    //     activity_log.meta,
    //     activity_log.created_at,
    //     profiles!inner(id, name, email)
    //   `)
    //   .eq('activity_log.org_id', orgId)
    //   .eq('activity_log.actor_user_id', 'profiles.id')
    //   .order('activity_log.created_at', { ascending: false });

    let query = await supabase
      .from("activity_log")
      .select(
        `
        id,
        org_id,
        actor_user_id,
        entity_type,
        entity_id,
        action,
        meta,
        created_at,
        profiles!inner(id, name, email)
      `,
      )
      .eq("org_id", orgId)
      // .eq('user_id', 'profiles.id')
      .order("created_at", { ascending: false })
      .returns<ActivityLogWithProfile[]>();

    // Apply filters if provided

    let filterQuery = null;

    if (filters) {
      filterQuery = supabase
        .from("activity_log")
        .select(
          `
        id,
        org_id,
        actor_user_id,
        entity_type,
        entity_id,
        action,
        meta,
        created_at,
        profiles!inner(id, name, email)
      `,
        )
        .eq("org_id", orgId);

      if (filters?.memberId) {
        filterQuery = filterQuery.eq("actor_user_id", filters.memberId);
      }

      if (filters?.dateFrom) {
        filterQuery = filterQuery.gte("created_at", filters.dateFrom);
      }

      if (filters?.dateTo) {
        filterQuery = filterQuery.lte("created_at", filters.dateTo);
      }

      const { data: filteredData, error: filteredError } =
        await filterQuery.returns<ActivityLogWithProfile[]>();

      if (filteredError) {
        Logger.error(
          "GET_MEMBER_ACTIVITIES",
          "Error fetching member activities during filtering",
          filteredError,
          { orgId },
        );
        throw filteredError;
      }

      const activities: ActivityLog[] = filteredData.map((activity) => {
        // Get entity name based on entity type
        let entityName = activity.entity_type;
        if (activity.entity_type === "invoice") {
          entityName = `Invoice #${activity.meta?.number || activity.entity_id}`;
        } else if (activity.entity_type === "client") {
          entityName = activity.meta?.name || `Client ${activity.entity_id}`;
        } else if (activity.entity_type === "expense") {
          entityName =
            activity.meta?.description || `Expense ${activity.entity_id}`;
        } else if (activity.entity_type === "payment") {
          entityName = `Payment for ${activity.meta?.invoice_number || activity.entity_id}`;
        }

        const transformedActivity: ActivityLog = {
          id: activity.id,
          memberId: activity.actor_user_id,
          memberName:
            activity.profiles?.name ||
            activity.profiles?.email ||
            "Unknown User",
          action: mapActionToActivity(
            activity.action,
            activity.entity_type || "none",
          ),
          entityName: entityName || "Not Specified",
          entityAmount: activity.meta?.amount,
          created_at: activity.created_at,
          entityType: activity.entity_type as
            | "invoice"
            | "expense"
            | "client"
            | "payment"
            | "none",
        };

        // Ensure the object is properly serializable
        return JSON.parse(JSON.stringify(transformedActivity));
      });

      Logger.info(
        "GET_MEMBER_ACTIVITIES",
        "Member filtered activities fetched successfully",
        {
          orgId,
          entityType: "activity_logs",
          details: { count: activities.length },
        },
      );
      return activities;
    }

    const { data: activityData, error: activityError } = await query;

    if (activityError) {
      Logger.error(
        "GET_MEMBER_ACTIVITIES",
        "Error fetching member activities",
        activityError,
        { orgId },
      );
      throw activityError;
    }
    // Transform the data to match the ActivityLog interface
    const activities: ActivityLog[] = activityData.map((activity) => {
      // Get entity name based on entity type
      let entityName = activity.entity_type;
      if (activity.entity_type === "invoice") {
        entityName = `Invoice #${activity.meta?.number || activity.entity_id}`;
      } else if (activity.entity_type === "client") {
        entityName = activity.meta?.name || `Client ${activity.entity_id}`;
      } else if (activity.entity_type === "expense") {
        entityName =
          activity.meta?.description || `Expense ${activity.entity_id}`;
      } else if (activity.entity_type === "payment") {
        entityName = `Payment for ${activity.meta?.invoice_number || activity.entity_id}`;
      }

      const transformedActivity: ActivityLog = {
        id: activity.id,
        memberId: activity.actor_user_id,
        memberName:
          activity.profiles?.name || activity.profiles?.email || "Unknown User",
        action: mapActionToActivity(
          activity.action,
          activity.entity_type || "none",
        ),
        entityName: entityName || "Not Specified",
        entityAmount: activity.meta?.amount,
        created_at: activity.created_at,
        entityType: activity.entity_type as
          | "invoice"
          | "expense"
          | "client"
          | "payment"
          | "none",
      };

      // Ensure the object is properly serializable
      return JSON.parse(JSON.stringify(transformedActivity));
    });

    Logger.info(
      "GET_MEMBER_ACTIVITIES",
      "Member activities fetched successfully",
      {
        orgId,
        entityType: "activity_logs",
        details: { count: activities.length },
      },
    );
    return activities;
  } catch (error) {
    Logger.error(
      "GET_MEMBER_ACTIVITIES",
      "Unexpected error fetching member activities",
      error,
      { orgId },
    );
    throw error;
  }
}

// Helper function to map action to activity text based on entity type
const mapActionToActivity = (
  action: string,
  entityType: string,
):
  | "created_invoice"
  | "updated_invoice"
  | "deleted_invoice"
  | "created_expense"
  | "updated_expense"
  | "deleted_expense"
  | "added_client"
  | "updated_client"
  | "deleted_client"
  | "made_payment"
  | "updated_payment"
  | "deleted_payment"
  | "none" => {
  switch (entityType) {
    case "invoice":
      switch (action) {
        case "created":
          return "created_invoice";
        case "updated":
          return "updated_invoice";
        case "deleted":
          return "deleted_invoice";
        default:
          return "created_invoice";
      }
    case "expense":
      switch (action) {
        case "created":
          return "created_expense";
        case "updated":
          return "updated_expense";
        case "deleted":
          return "deleted_expense";
        default:
          return "created_expense";
      }
    case "client":
      switch (action) {
        case "created":
          return "added_client";
        case "updated":
          return "updated_client";
        case "deleted":
          return "deleted_client";
        default:
          return "added_client";
      }
    case "payment":
      switch (action) {
        case "created":
          return "made_payment";
        case "updated":
          return "updated_payment";
        case "deleted":
          return "deleted_payment";
        default:
          return "made_payment";
      }
    default:
      return "none";
  }
};

// Get aggregated statistics for members in an organization
export const getMemberStatistics = async (orgId: string) => {
  const supabase = await createAdminClient();

  try {
    // Since we don't have user attribution for activities in this schema,
    // we'll return basic organization-wide statistics
    const { data: membersData, error: membersError } = await supabase
      .from("org_members")
      .select(
        `
        user_id,
        role,
        profiles:profiles!user_id(id, name, email)
      `,
      )
      .eq("org_id", orgId);

    if (membersError) {
      Logger.error(
        "GET_MEMBERS_STATS",
        "Error fetching members for stats",
        membersError,
        { orgId },
      );
      throw membersError;
    }

    // Get organization-wide statistics
    const { count: invoiceCount, error: invoiceCountError } = await supabase
      .from("invoices")
      .select("*", { count: "exact", head: true })
      .eq("org_id", orgId);

    if (invoiceCountError) {
      Logger.error(
        "GET_INVOICE_COUNT_STATS",
        "Error counting invoices for stats",
        invoiceCountError,
        { orgId },
      );
    }

    const { data: invoiceTotals, error: invoiceTotalError } = await supabase
      .from("invoices")
      .select("total")
      .eq("org_id", orgId);

    if (invoiceTotalError) {
      Logger.error(
        "GET_INVOICE_TOTALS_STATS",
        "Error fetching invoice totals for stats",
        invoiceTotalError,
        { orgId },
      );
    }

    const totalInvoiceAmount =
      invoiceTotals?.reduce((sum, inv) => sum + (inv.total || 0), 0) || 0;

    const { count: expenseCount, error: expenseCountError } = await supabase
      .from("expenses")
      .select("*", { count: "exact", head: true })
      .eq("org_id", orgId);

    if (expenseCountError) {
      Logger.error(
        "GET_EXPENSE_COUNT_STATS",
        "Error counting expenses for stats",
        expenseCountError,
        { orgId },
      );
    }

    const { count: clientCount, error: clientCountError } = await supabase
      .from("clients")
      .select("*", { count: "exact", head: true })
      .eq("org_id", orgId);

    if (clientCountError) {
      Logger.error(
        "GET_CLIENT_COUNT_STATS",
        "Error counting clients for stats",
        clientCountError,
        { orgId },
      );
    }

    // Distribute stats among members (since we can't attribute to specific users)
    const stats = membersData.map((member) => {
      const cleanStat = {
        id: member.user_id,
        name: member.profiles[0]?.name || "Unknown User",
        email: member.profiles[0]?.email || "",
        role: member.role,
        invoiceCount: Math.ceil(
          (invoiceCount || 0) / Math.max(membersData.length, 1),
        ),
        expenseCount: Math.ceil(
          (expenseCount || 0) / Math.max(membersData.length, 1),
        ),
        clientCount: Math.ceil(
          (clientCount || 0) / Math.max(membersData.length, 1),
        ),
        totalInvoiceAmount:
          totalInvoiceAmount / Math.max(membersData.length, 1),
      };

      // Ensure the object is properly serializable
      return JSON.parse(JSON.stringify(cleanStat));
    });

    Logger.info("GET_MEMBER_STATS", "Member statistics fetched successfully", {
      orgId,
      entityType: "member_stats",
      details: { count: stats.length },
    });
    return stats;
  } catch (error) {
    Logger.error(
      "GET_MEMBER_STATS",
      "Unexpected error fetching member statistics",
      error,
      { orgId },
    );
    throw error;
  }
}

// Fallback function to calculate member stats manually if RPC is not available
const calculateMemberStatsFallback = async (orgId: string) => {
  const supabase = await createAdminClient();

  try {
    // Get all members first
    const { data: membersData, error: membersError } = await supabase
      .from("org_members")
      .select(
        `
        user_id,
        role,
        profiles:profiles!user_id(id, name, email)
      `,
      )
      .eq("org_id", orgId);

    if (membersError) {
      Logger.error(
        "GET_MEMBERS_FALLBACK",
        "Error fetching members for fallback stats",
        membersError,
        { orgId },
      );
      throw membersError;
    }

    // Get organization-wide statistics
    const { count: invoiceCount, error: invoiceCountError } = await supabase
      .from("invoices")
      .select("*", { count: "exact", head: true })
      .eq("org_id", orgId);

    if (invoiceCountError) {
      Logger.error(
        "GET_INVOICE_COUNT_FALLBACK",
        "Error counting invoices for fallback stats",
        invoiceCountError,
        { orgId },
      );
    }

    const { data: invoiceTotals, error: invoiceTotalError } = await supabase
      .from("invoices")
      .select("total")
      .eq("org_id", orgId);

    if (invoiceTotalError) {
      Logger.error(
        "GET_INVOICE_TOTALS_FALLBACK",
        "Error fetching invoice totals for fallback stats",
        invoiceTotalError,
        { orgId },
      );
    }

    const totalInvoiceAmount =
      invoiceTotals?.reduce((sum, inv) => sum + (inv.total || 0), 0) || 0;

    const { count: expenseCount, error: expenseCountError } = await supabase
      .from("expenses")
      .select("*", { count: "exact", head: true })
      .eq("org_id", orgId);

    if (expenseCountError) {
      Logger.error(
        "GET_EXPENSE_COUNT_FALLBACK",
        "Error counting expenses for fallback stats",
        expenseCountError,
        { orgId },
      );
    }

    const { count: clientCount, error: clientCountError } = await supabase
      .from("clients")
      .select("*", { count: "exact", head: true })
      .eq("org_id", orgId);

    if (clientCountError) {
      Logger.error(
        "GET_CLIENT_COUNT_FALLBACK",
        "Error counting clients for fallback stats",
        clientCountError,
        { orgId },
      );
    }

    // Distribute stats among members (since we can't attribute to specific users)
    const stats = membersData.map((member) => {
      const cleanStat = {
        id: member.user_id,
        name: member.profiles?.[0]?.name || "Unknown User",
        email: member.profiles?.[0]?.email || "",
        role: member.role,
        invoiceCount: Math.ceil(
          (invoiceCount || 0) / Math.max(membersData.length, 1),
        ),
        expenseCount: Math.ceil(
          (expenseCount || 0) / Math.max(membersData.length, 1),
        ),
        clientCount: Math.ceil(
          (clientCount || 0) / Math.max(membersData.length, 1),
        ),
        totalInvoiceAmount:
          totalInvoiceAmount / Math.max(membersData.length, 1),
      };

      // Ensure the object is properly serializable
      return JSON.parse(JSON.stringify(cleanStat));
    });

    return stats;
  } catch (error) {
    Logger.error(
      "CALCULATE_MEMBER_STATS_FALLBACK",
      "Error in fallback stats calculation",
      error,
      { orgId },
    );
    throw error;
  }
}

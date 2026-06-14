'use server';

import { getSupabaseUser } from '@/lib/auth';
import { auth } from '@clerk/nextjs/server';
import { Logger } from '@/lib/utils/logger';
import { createAdminClient } from '@/lib/supabase/server';

export async function getDashboardStatsAction() {
  try {
    const { userId } = await auth();
    if (!userId) {
      throw new Error('Unauthorized');
    }

    // Get user profile to get organization ID
    const userProfile = await getSupabaseUser();
    if (!userProfile) {
      throw new Error('User profile not found');
    }

    const ownerClerkId = userProfile.clerk_user_id;

    // Get organization ID from user profile
    const supabase = await createAdminClient();

    const { data: userOrganization, error: orgError } = await supabase
      .from('organizations')
      .select('id')
      .eq('owner_clerk_id', ownerClerkId)
      .single();

    if (orgError || !userOrganization) {
      // Return default empty stats for empty state
      return {
        org_id: null,
        revenue_ytd: 0,
        outstanding_total: 0,
        overdue_count: 0,
        total_invoices: 0,
        total_invoiced: 0,
        total_collected: 0,
        total_outstanding: 0
      };
    }

    const orgId = userOrganization.id as string;

    // Fetch dashboard stats from the materialized view
    const { data: dashboardStats, error: statsError } = await supabase
      .from('mv_dashboard_stats')
      .select('*')
      .eq('org_id', orgId)
      .single();

    // If no stats exist yet, return default values
    if (statsError || !dashboardStats) {
      return {
        org_id: orgId,
        revenue_ytd: 0,
        outstanding_total: 0,
        overdue_count: 0,
        total_invoices: 0,
        total_invoiced: 0,
        total_collected: 0,
        total_outstanding: 0
      };
    }

    return dashboardStats;
  } catch (error) {
    console.error('Error in getDashboardStatsAction:', error);
    Logger.error('GET_DASHBOARD_STATS_ACTION', 'Unexpected error occurred', {}, { details: { error } });
    // Return default empty stats instead of throwing for empty state
    return {
      org_id: null,
      revenue_ytd: 0,
      outstanding_total: 0,
      overdue_count: 0,
      total_invoices: 0,
      total_invoiced: 0,
      total_collected: 0,
      total_outstanding: 0
    };
  }
}
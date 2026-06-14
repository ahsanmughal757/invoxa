'use server';

import { createInviteFunc, acceptInvite as acceptInviteFunc, revokeInvite, getInviteByToken as getInviteByTokenFunc } from '@/lib/services/invite.service.func';

export async function createInvite(formData: FormData) {
  try {
    const inviteData = Object.fromEntries(formData.entries());

    const result = await createInviteFunc(
      inviteData.organization_id as string,
      inviteData.inviter_id as string,
      inviteData.email as string,
      inviteData.role as string
    );

    return { success: true, data: result };
  } catch (error) {
    console.error('Error creating invite:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Failed to create invite' };
  }
}

export async function acceptInvite(token: string, userId: string) {
  try {
    const result = await acceptInviteFunc(token, userId);
    return { success: true, data: result };
  } catch (error) {
    console.error('Error accepting invite:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Failed to accept invite' };
  }
}

export async function rejectInvite(token: string, userId: string) {
  try {
    // For rejecting invites, we'll treat it similar to revoking
    // Since there isn't a specific reject method in the service, we'll use revoke
    // Find the invite first
    const invite = await getInviteByTokenFunc(token);
    if (!invite) {
      throw new Error('Invite not found');
    }

    // Revoke the invite (which effectively rejects it)
    const result = await revokeInvite(invite.id, userId);
    return { success: true, data: result };
  } catch (error) {
    console.error('Error rejecting invite:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Failed to reject invite' };
  }
}

export async function revokeInviteAction(inviteId: string, revokerId: string) {
  try {
    const result = await revokeInvite(inviteId, revokerId);
    return { success: true, data: result };
  } catch (error) {
    console.error('Error revoking invite:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Failed to revoke invite' };
  }
}

export async function getInviteByToken(token: string) {
  try {
    const result = await getInviteByTokenFunc(token);
    return { success: true, data: result };
  } catch (error) {
    console.error('Error getting invite by token:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Failed to get invite' };
  }
}
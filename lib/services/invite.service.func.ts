import {
  createInvite,
  getInviteByToken as getInviteByTokenRepo,
  getInviteById,
  updateInvite,
  getInvitesByUserId as getInvitesByUserIdRepo,
  getInvitesByOrganizationId as getInvitesByOrgIdRepo,
  getReceivedInvitesByEmail
} from '@/lib/repositories/invites.repository.func';
import { getUserById, getUserByEmail } from '@/lib/repositories/users.repository.func';
import {
  getMemberByOrgAndUserId,
  createMember,
  getMembersByOrgId
} from '@/lib/repositories/members.repository.func';
import { getOrganizationById } from '@/lib/repositories/organizations.repository.func';

/**
 * Creates a new invitation for a user to join an organization
 */
export async function createInviteFunc(
  organizationId: string,
  inviterId: string,
  inviteeEmail: string,
  role: string = 'member'
): Promise<any> {
  // Verify that the organization exists and the inviter belongs to it
  const organization = await getOrganizationById(organizationId);
  if (!organization) {
    throw new Error('Organization not found');
  }

  // Verify that the inviter is a member of the organization
  const inviterProfile = await getUserById(inviterId);
  if (!inviterProfile) {
    throw new Error('Inviter profile not found');
  }

  // Check if user is already a member of the organization
  const existingMember = await getMemberByOrgAndUserId(organizationId, inviterId);
  if (!existingMember) {
    throw new Error('Only organization members can send invitations');
  }

  // Check if an invitation already exists for this email and organization
  const existingInvites = await getInvitesByOrgIdRepo(organizationId);
  const existingInvite = existingInvites.find(
    (invite: any) => invite.email.toLowerCase() === inviteeEmail.toLowerCase() && invite.status === 'pending'
  );

  if (existingInvite) {
    throw new Error('An invitation already exists for this email address');
  }

  // Generate a unique token for the invitation
  const crypto = require('crypto');
  const token = crypto.randomBytes(32).toString('hex');

  // Prepare the invitation data
  const inviteData = {
    organization_id: organizationId,
    inviter_id: inviterId,
    email: inviteeEmail.toLowerCase(),
    role: role,
    token: token,
    expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days from now
    status: 'pending'
  };

  // Create the invitation
  const newInvite = await createInvite(inviteData);

  return newInvite;
}

/**
 * Accepts an invitation to join an organization
 */
export async function acceptInvite(token: string, userId: string): Promise<any> {
  // Get the invite details
  const invite = await getInviteByTokenRepo(token);

  if (!invite) {
    throw new Error('Invalid invitation token');
  }

  // Validate the invite acceptance
  if (new Date(invite.expires_at) < new Date()) {
    // Update status to 'expired'
    try {
      await updateInvite(invite.id, { status: 'expired' });
    } catch (error) {
      // If the invite doesn't exist anymore, continue with the error
    }
    throw new Error('Invitation has expired');
  }

  if (invite.status !== 'pending') {
    throw new Error(`Invitation has already been ${invite.status}`);
  }

  // Get the user profile
  const profile = await getUserById(userId);
  if (!profile) {
    throw new Error('Profile not found');
  }

  // Add user to organization members
  const memberData = {
    org_id: invite.organization_id,
    user_id: profile.id,
    role: invite.role || 'member' // Use the role from the invite, default to 'member'
  };

  try {
    await createMember(memberData);
  } catch (memberError: any) {
    // Check if the error is due to duplicate (user already member)
    if (memberError.code === '23505') { // Unique violation
      throw new Error('You are already a member of this organization');
    }
    throw new Error('Failed to join organization');
  }

  // Update the invitation status to 'accepted'
  try {
    await updateInvite(invite.id, {
      status: 'accepted',
      accepted_at: new Date().toISOString(),
      accepted_by_user_id: profile.id,
    });
  } catch (error) {
    // If the invite doesn't exist anymore, continue anyway
  }

  return { message: 'Invitation accepted successfully' };
}

/**
 * Revokes an invitation
 */
export async function revokeInvite(inviteId: string, revokerId: string): Promise<any> {
  // Get the invite details
  const invite = await getInviteById(inviteId);
  if (!invite) {
    throw new Error('Invite not found');
  }

  // Check if the revoker is authorized to revoke this invite
  // Either the person who sent the invite or an admin/owner of the organization
  const revokerMember = await getMemberByOrgAndUserId(invite.organization_id, revokerId);
  const revokerProfile = await getUserById(revokerId);

  if (!revokerMember) {
    throw new Error('Only organization members can revoke invitations');
  }

  // Allow revocation if:
  // 1. The revoker is the one who sent the invite, OR
  // 2. The revoker is an admin/owner of the organization
  const isInviter = invite.inviter_id === revokerId;
  const isAdmin = revokerMember.role === 'admin' || revokerMember.role === 'owner';

  if (!isInviter && !isAdmin) {
    throw new Error('Not authorized to revoke this invitation');
  }

  // Update the invitation status to 'revoked'
  try {
    const updatedInvite = await updateInvite(inviteId, {
      status: 'revoked',
      revoked_at: new Date().toISOString(),
      revoked_by_user_id: revokerId,
    });

    return updatedInvite;
  } catch (error) {
    // If the invite doesn't exist anymore, return success anyway
    return { success: true };
  }
}

/**
 * Gets an invitation by its token
 */
export async function getInviteByToken(token: string): Promise<any> {
  return await getInviteByTokenRepo(token);
}

/**
 * Gets invitations sent by a specific user
 */
export async function getInvitesByUserId(userId: string): Promise<any[]> {
  return await getInvitesByUserIdRepo(userId);
}

/**
 * Gets invitations for a specific organization
 */
export async function getInvitesByOrganizationId(organizationId: string): Promise<any[]> {
  try {
    return await getInvitesByOrgIdRepo(organizationId);
  } catch (error) {
    // If there are no invites for the organization, return an empty array
    // This is an acceptable empty state, not an error condition
    return [];
  }
}

/**
 * Gets received invitations for a specific email
 */
export async function getReceivedInvitesByEmailFunc(email: string): Promise<any[]> {
  return await getReceivedInvitesByEmail(email);
}
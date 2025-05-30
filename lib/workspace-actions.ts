"use server";

import { currentUser } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import {
  createWorkspace as createWorkspaceCore,
  getUserWorkspaces as getUserWorkspacesCore,
  inviteToWorkspace as inviteToWorkspaceCore,
  acceptInvitation as acceptInvitationCore,
  declineInvitation as declineInvitationCore,
  getPendingInvitations as getPendingInvitationsCore,
  getWorkspaceById as getWorkspaceByIdCore,
  getWorkspaceMembers as getWorkspaceMembersCore,
  addReportToWorkspace as addReportToWorkspaceCore,
  getWorkspaceReports as getWorkspaceReportsCore,
  canAccessReport as canAccessReportCore,
  updateMemberRole as updateMemberRoleCore,
  removeMember as removeMemberCore,
  transferOwnership as transferOwnershipCore,
} from "./mongodb-workspace";

/**
 * Action serveur pour récupérer les espaces de travail d'un utilisateur
 */
export async function getUserWorkspaces() {
  const user = await currentUser();
  if (!user) throw new Error("Utilisateur non authentifié");

  return await getUserWorkspacesCore(user.id);
}

/**
 * Action serveur pour récupérer les invitations en attente pour un email
 */
export async function getPendingInvitations() {
  const user = await currentUser();
  if (!user) throw new Error("Utilisateur non authentifié");

  return await getPendingInvitationsCore(user.primaryEmailAddress?.emailAddress || "");
}

export async function createWorkspace(name: string) {
  const user = await currentUser();
  if (!user) throw new Error("Utilisateur non authentifié");

  const workspace = await createWorkspaceCore(name, user.id);
  revalidatePath("/workspaces");
  return workspace;
}

export async function inviteToWorkspace(
  workspaceId: string,
  email: string,
  role: "editor" | "viewer" = "viewer"
) {
  const user = await currentUser();
  if (!user) throw new Error("Utilisateur non authentifié");

  const invitation = await inviteToWorkspaceCore(workspaceId, email, role);
  revalidatePath("/workspaces");
  return invitation;
}

export async function acceptInvitation(token: string) {
  const user = await currentUser();
  if (!user) throw new Error("Utilisateur non authentifié");

  const result = await acceptInvitationCore(token, user.id);
  revalidatePath("/workspaces");
  return result;
}

export async function declineInvitation(token: string) {
  const result = await declineInvitationCore(token);
  revalidatePath("/workspaces");
  return result;
}

export async function getWorkspaceById(id: string) {
  const user = await currentUser();
  if (!user) throw new Error("Utilisateur non authentifié");

  return await getWorkspaceByIdCore(id);
}

export async function getWorkspaceMembers(workspaceId: string) {
  const user = await currentUser();
  if (!user) throw new Error("Utilisateur non authentifié");

  return await getWorkspaceMembersCore(workspaceId);
}

export async function addReportToWorkspace(workspaceId: string, reportId: string) {
  const user = await currentUser();
  if (!user) throw new Error("Utilisateur non authentifié");

  const result = await addReportToWorkspaceCore(workspaceId, reportId);
  revalidatePath("/workspaces");
  return result;
}

export async function getWorkspaceReports(workspaceId: string) {
  const user = await currentUser();
  if (!user) throw new Error("Utilisateur non authentifié");

  return await getWorkspaceReportsCore(workspaceId);
}

export async function canUserAccessReport(reportId: string) {
  const user = await currentUser();
  if (!user) throw new Error("Utilisateur non authentifié");

  return await canAccessReportCore(user.id, reportId);
}

export async function updateMemberRole(
  memberId: string,
  newRole: "owner" | "editor" | "viewer"
) {
  const user = await currentUser();
  if (!user) throw new Error("Utilisateur non authentifié");

  const result = updateMemberRoleCore(memberId, newRole);
  revalidatePath("/workspaces");
  return result;
}

export async function removeMember(memberId: string) {
  const user = await currentUser();
  if (!user) throw new Error("Utilisateur non authentifié");

  const result = removeMemberCore(memberId);
  revalidatePath("/workspaces");
  return result;
}

export async function transferOwnership(
  workspaceId: string,
  newOwnerId: string
) {
  const user = await currentUser();
  if (!user) throw new Error("Utilisateur non authentifié");

  const result = transferOwnershipCore(workspaceId, newOwnerId, user.id);
  revalidatePath("/workspaces");
  return result;
}

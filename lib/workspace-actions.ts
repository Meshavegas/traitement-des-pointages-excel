"use server";

import { currentUser } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import {
  createWorkspace as createWorkspaceDb,
  getUserWorkspaces as getUserWorkspacesDb,
  inviteToWorkspace as inviteToWorkspaceDb,
  acceptInvitation as acceptInvitationDb,
  declineInvitation as declineInvitationDb,
  getPendingInvitations as getPendingInvitationsDb,
  getWorkspaceById as getWorkspaceByIdDb,
  getWorkspaceMembers as getWorkspaceMembersDb,
  addReportToWorkspace as addReportToWorkspaceDb,
  getWorkspaceReports as getWorkspaceReportsDb,
  canAccessReport as canAccessReportDb,
  updateMemberRole as updateMemberRoleDb,
  removeMember as removeMemberDb,
  transferOwnership as transferOwnershipDb,
} from "./workspace-db-core";

/**
 * Action serveur pour récupérer les espaces de travail d'un utilisateur
 */
export async function getUserWorkspaces() {
  const user = await currentUser();
  if (!user) throw new Error("Utilisateur non authentifié");

  return getUserWorkspacesDb(user.id);
}

/**
 * Action serveur pour récupérer les invitations en attente pour un email
 */
export async function getPendingInvitations() {
  const user = await currentUser();
  if (!user) throw new Error("Utilisateur non authentifié");

  return getPendingInvitationsDb(user.primaryEmailAddress?.emailAddress || "");
}

export async function createWorkspace(name: string) {
  const user = await currentUser();
  if (!user) throw new Error("Utilisateur non authentifié");

  const workspace = createWorkspaceDb(name, user.id);
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

  const invitation = inviteToWorkspaceDb(workspaceId, email, role);
  revalidatePath("/workspaces");
  return invitation;
}

export async function acceptInvitation(token: string) {
  const user = await currentUser();
  if (!user) throw new Error("Utilisateur non authentifié");

  const result = acceptInvitationDb(token, user.id);
  revalidatePath("/workspaces");
  return result;
}

export async function declineInvitation(token: string) {
  const result = declineInvitationDb(token);
  revalidatePath("/workspaces");
  return result;
}

export async function getWorkspaceById(id: string) {
  const user = await currentUser();
  if (!user) throw new Error("Utilisateur non authentifié");

  return getWorkspaceByIdDb(id);
}

export async function getWorkspaceMembers(workspaceId: string) {
  const user = await currentUser();
  if (!user) throw new Error("Utilisateur non authentifié");

  return getWorkspaceMembersDb(workspaceId);
}

export async function addReportToWorkspace(workspaceId: string, reportId: string) {
  const user = await currentUser();
  if (!user) throw new Error("Utilisateur non authentifié");

  const result = addReportToWorkspaceDb(workspaceId, reportId);
  revalidatePath("/workspaces");
  return result;
}

export async function getWorkspaceReports(workspaceId: string) {
  const user = await currentUser();
  if (!user) throw new Error("Utilisateur non authentifié");

  return getWorkspaceReportsDb(workspaceId);
}

export async function canUserAccessReport(reportId: string) {
  const user = await currentUser();
  if (!user) throw new Error("Utilisateur non authentifié");

  return canAccessReportDb(user.id, reportId);
}

export async function updateMemberRole(
  memberId: string,
  newRole: "owner" | "editor" | "viewer"
) {
  const user = await currentUser();
  if (!user) throw new Error("Utilisateur non authentifié");

  const result = updateMemberRoleDb(memberId, newRole);
  revalidatePath("/workspaces");
  return result;
}

export async function removeMember(memberId: string) {
  const user = await currentUser();
  if (!user) throw new Error("Utilisateur non authentifié");

  const result = removeMemberDb(memberId);
  revalidatePath("/workspaces");
  return result;
}

export async function transferOwnership(
  workspaceId: string,
  newOwnerId: string
) {
  const user = await currentUser();
  if (!user) throw new Error("Utilisateur non authentifié");

  const result = transferOwnershipDb(workspaceId, newOwnerId, user.id);
  revalidatePath("/workspaces");
  return result;
}

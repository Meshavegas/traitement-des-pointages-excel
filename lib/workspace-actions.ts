"use server";

import { currentUser } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import {
  createWorkspace as createWorkspaceCore,
  getUserWorkspaces as getUserWorkspacesCore,
  createInvitation as inviteToWorkspaceCore,
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
  deleteWorkspace as deleteWorkspaceCore,
} from "./postgres-workspace";
import { sendWorkspaceInvitation, sendWorkspaceCreatedEmail } from "./email-service";

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
  
  // Envoyer un email de bienvenue
  try {
    await sendWorkspaceCreatedEmail(
      user.primaryEmailAddress?.emailAddress || "",
      user.firstName || user.username || "Utilisateur",
      workspace.name
    );
  } catch (error) {
    console.error("❌ Failed to send workspace created email:", error);
    // Ne pas faire échouer la création du workspace pour un problème d'email
  }
  
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
  
  // Récupérer les informations du workspace pour l'email
  const workspace = await getWorkspaceByIdCore(workspaceId);
  if (workspace) {
    try {
      await sendWorkspaceInvitation(
        invitation,
        workspace.name,
        user.firstName || user.username || "Un collègue"
      );
    } catch (error) {
      console.error("❌ Failed to send invitation email:", error);
      // Ne pas faire échouer l'invitation pour un problème d'email
    }
  }
  
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

/**
 * Récupère ou crée un workspace par défaut pour l'utilisateur
 */
export async function getOrCreateDefaultWorkspace() {
  const user = await currentUser();
  if (!user) throw new Error("Utilisateur non authentifié");

  // Récupérer les workspaces existants de l'utilisateur
  const userWorkspaces = await getUserWorkspacesCore(user.id);
  
  // Si l'utilisateur a déjà des workspaces, retourner le premier
  if (userWorkspaces.length > 0) {
    return userWorkspaces[0];
  }
  
  // Sinon, créer un workspace par défaut
  const defaultWorkspaceName = `Espace de ${user.firstName || user.username || "travail"}`;
  const workspace = await createWorkspaceCore(defaultWorkspaceName, user.id);
  
  // Envoyer un email de bienvenue
  try {
    await sendWorkspaceCreatedEmail(
      user.primaryEmailAddress?.emailAddress || "",
      user.firstName || user.username || "Utilisateur",
      workspace.name
    );
  } catch (error) {
    console.error("❌ Failed to send workspace created email:", error);
  }
  
  return workspace;
}

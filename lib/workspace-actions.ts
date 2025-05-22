"use server";

import { currentUser } from "@clerk/nextjs/server";
import {
  getUserWorkspaces as dbGetUserWorkspaces,
  getPendingInvitations as dbGetPendingInvitations,
  type Workspace,
  type WorkspaceInvitation,
} from "./workspace-db";

/**
 * Action serveur pour récupérer les espaces de travail d'un utilisateur
 */
export async function getUserWorkspaces(userId: string): Promise<Workspace[]> {
  return dbGetUserWorkspaces(userId);
}

/**
 * Action serveur pour récupérer les invitations en attente pour un email
 */
export async function getPendingInvitations(email: string): Promise<
  (WorkspaceInvitation & {
    workspaceName: string;
  })[]
> {
  return dbGetPendingInvitations(email);
}

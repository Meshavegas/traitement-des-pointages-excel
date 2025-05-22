import Database from "better-sqlite3";
import { currentUser } from "@clerk/nextjs/server";
import { v4 as uuidv4 } from "uuid";

const db = new Database("attendance.db");

// Initialiser les tables pour les espaces de travail partagés
db.exec(`
  CREATE TABLE IF NOT EXISTS workspaces (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    ownerId TEXT NOT NULL,
    createdAt TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS workspace_members (
    id TEXT PRIMARY KEY,
    workspaceId TEXT NOT NULL,
    userId TEXT NOT NULL,
    role TEXT NOT NULL,
    addedAt TEXT NOT NULL,
    FOREIGN KEY (workspaceId) REFERENCES workspaces(id) ON DELETE CASCADE,
    UNIQUE(workspaceId, userId)
  );

  CREATE TABLE IF NOT EXISTS workspace_invitations (
    id TEXT PRIMARY KEY,
    workspaceId TEXT NOT NULL,
    email TEXT NOT NULL,
    token TEXT NOT NULL,
    status TEXT NOT NULL,
    createdAt TEXT NOT NULL,
    expiresAt TEXT NOT NULL,
    role TEXT DEFAULT 'viewer',
    FOREIGN KEY (workspaceId) REFERENCES workspaces(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS workspace_reports (
    workspaceId TEXT NOT NULL,
    reportId TEXT NOT NULL,
    FOREIGN KEY (workspaceId) REFERENCES workspaces(id) ON DELETE CASCADE,
    FOREIGN KEY (reportId) REFERENCES reports(id) ON DELETE CASCADE,
    PRIMARY KEY (workspaceId, reportId)
  );
`);

// Types pour les espaces de travail
export type Workspace = {
  id: string;
  name: string;
  ownerId: string;
  createdAt: string;
};

export type WorkspaceMember = {
  id: string;
  workspaceId: string;
  userId: string;
  role: "owner" | "editor" | "viewer";
  addedAt: string;
};

export type WorkspaceInvitation = {
  id: string;
  workspaceId: string;
  email: string;
  token: string;
  status: "pending" | "accepted" | "declined" | "expired";
  createdAt: string;
  expiresAt: string;
  role?: "editor" | "viewer";
};

// Fonctions pour gérer les espaces de travail
export async function createWorkspace(name: string) {
  const user = await currentUser();
  if (!user) throw new Error("Utilisateur non authentifié");

  const id = uuidv4();
  const createdAt = new Date().toISOString();

  const stmt = db.prepare(
    `INSERT INTO workspaces (id, name, ownerId, createdAt) VALUES (?, ?, ?, ?)`
  );
  stmt.run(id, name, user.id, createdAt);

  // Ajouter le propriétaire comme membre
  const memberStmt = db.prepare(
    `INSERT INTO workspace_members (id, workspaceId, userId, role, addedAt) VALUES (?, ?, ?, ?, ?)`
  );
  memberStmt.run(uuidv4(), id, user.id, "owner", createdAt);

  return { id, name, ownerId: user.id, createdAt };
}

export function getUserWorkspaces(userId: string) {
  const stmt = db.prepare(`
    SELECT w.* FROM workspaces w
    JOIN workspace_members wm ON w.id = wm.workspaceId
    WHERE wm.userId = ?
  `);
  return stmt.all(userId) as Workspace[];
}

export function getWorkspaceById(id: string) {
  const stmt = db.prepare(`SELECT * FROM workspaces WHERE id = ?`);
  return stmt.get(id) as Workspace | undefined;
}

export function getWorkspaceMembers(workspaceId: string) {
  const stmt = db.prepare(
    `SELECT * FROM workspace_members WHERE workspaceId = ?`
  );
  return stmt.all(workspaceId) as WorkspaceMember[];
}

export function inviteToWorkspace(
  workspaceId: string,
  email: string,
  role: "editor" | "viewer" = "viewer"
) {
  const id = uuidv4();
  const token = uuidv4();
  const createdAt = new Date().toISOString();
  const expiresAt = new Date(
    Date.now() + 7 * 24 * 60 * 60 * 1000
  ).toISOString(); // 7 jours

  // Vérifier si l'invitation existe déjà
  const checkStmt = db.prepare(`
    SELECT id FROM workspace_invitations 
    WHERE workspaceId = ? AND email = ? AND status = 'pending'
  `);
  const existingInvitation = checkStmt.get(
    workspaceId,
    email
  ) as WorkspaceInvitation;

  if (existingInvitation) {
    // Mettre à jour l'invitation existante
    const updateStmt = db.prepare(`
      UPDATE workspace_invitations 
      SET token = ?, expiresAt = ? 
      WHERE id = ?
    `);
    updateStmt.run(token, expiresAt, existingInvitation.id);
    return {
      id: existingInvitation.id,
      workspaceId,
      email,
      token,
      status: "pending",
      createdAt,
      expiresAt,
      role,
    };
  }

  // Créer une nouvelle invitation
  const stmt = db.prepare(`
    INSERT INTO workspace_invitations 
    (id, workspaceId, email, token, status, createdAt, expiresAt, role) 
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);
  stmt.run(
    id,
    workspaceId,
    email,
    token,
    "pending",
    createdAt,
    expiresAt,
    role
  );

  return {
    id,
    workspaceId,
    email,
    token,
    status: "pending",
    createdAt,
    expiresAt,
    role,
  };
}

export function getPendingInvitations(email: string) {
  const stmt = db.prepare(`
    SELECT wi.*, w.name as workspaceName 
    FROM workspace_invitations wi
    JOIN workspaces w ON wi.workspaceId = w.id
    WHERE wi.email = ? AND wi.status = 'pending' AND wi.expiresAt > ?
  `);
  return stmt.all(email, new Date().toISOString()) as (WorkspaceInvitation & {
    workspaceName: string;
  })[];
}

export function acceptInvitation(token: string, userId: string) {
  const invitationStmt = db.prepare(`
    SELECT * FROM workspace_invitations 
    WHERE token = ? AND status = 'pending' AND expiresAt > ?
  `);
  const invitation = invitationStmt.get(token, new Date().toISOString()) as
    | WorkspaceInvitation
    | undefined;

  if (!invitation) throw new Error("Invitation invalide ou expirée");

  // Mettre à jour le statut de l'invitation
  const updateStmt = db.prepare(`
    UPDATE workspace_invitations SET status = 'accepted' WHERE id = ?
  `);
  updateStmt.run(invitation.id);

  // Vérifier si l'utilisateur est déjà membre
  const checkMemberStmt = db.prepare(`
    SELECT id FROM workspace_members 
    WHERE workspaceId = ? AND userId = ?
  `);
  const existingMember = checkMemberStmt.get(invitation.workspaceId, userId);

  if (existingMember) {
    // L'utilisateur est déjà membre, on ne fait rien
    return true;
  }

  // Ajouter l'utilisateur comme membre avec le rôle spécifié dans l'invitation
  const role = invitation.role || "viewer";
  const memberStmt = db.prepare(`
    INSERT INTO workspace_members (id, workspaceId, userId, role, addedAt)
    VALUES (?, ?, ?, ?, ?)
  `);
  memberStmt.run(
    uuidv4(),
    invitation.workspaceId,
    userId,
    role,
    new Date().toISOString()
  );

  return true;
}

export function addReportToWorkspace(workspaceId: string, reportId: string) {
  const stmt = db.prepare(`
    INSERT INTO workspace_reports (workspaceId, reportId)
    VALUES (?, ?)
  `);
  stmt.run(workspaceId, reportId);
  return true;
}

export function getWorkspaceReports(workspaceId: string) {
  const stmt = db.prepare(`
    SELECT r.* FROM reports r
    JOIN workspace_reports wr ON r.id = wr.reportId
    WHERE wr.workspaceId = ?
  `);
  return stmt.all(workspaceId);
}

export function canAccessReport(userId: string, reportId: string) {
  // Vérifier si l'utilisateur est membre d'un espace de travail qui contient ce rapport
  const stmt = db.prepare(`
    SELECT COUNT(*) as count FROM workspace_members wm
    JOIN workspace_reports wr ON wm.workspaceId = wr.workspaceId
    WHERE wm.userId = ? AND wr.reportId = ?
  `);
  const result = stmt.get(userId, reportId) as { count: number };
  return result.count > 0;
}

/**
 * Met à jour le rôle d'un membre dans un espace de travail
 */
export function updateMemberRole(
  memberId: string,
  newRole: "owner" | "editor" | "viewer"
) {
  // Vérifier que le membre existe
  const checkStmt = db.prepare(`SELECT * FROM workspace_members WHERE id = ?`);
  const member = checkStmt.get(memberId) as WorkspaceMember | undefined;

  if (!member) throw new Error("Membre non trouvé");

  // Ne pas permettre de changer le rôle du propriétaire
  if (member.role === "owner") {
    throw new Error("Impossible de modifier le rôle du propriétaire");
  }

  // Mettre à jour le rôle
  const stmt = db.prepare(`UPDATE workspace_members SET role = ? WHERE id = ?`);
  stmt.run(newRole, memberId);

  return true;
}

/**
 * Supprime un membre d'un espace de travail
 */
export function removeMember(memberId: string) {
  // Vérifier que le membre existe
  const checkStmt = db.prepare(`SELECT * FROM workspace_members WHERE id = ?`);
  const member = checkStmt.get(memberId) as WorkspaceMember | undefined;

  if (!member) throw new Error("Membre non trouvé");

  // Ne pas permettre de supprimer le propriétaire
  if (member.role === "owner") {
    throw new Error(
      "Impossible de supprimer le propriétaire de l'espace de travail"
    );
  }

  // Supprimer le membre
  const stmt = db.prepare(`DELETE FROM workspace_members WHERE id = ?`);
  stmt.run(memberId);

  return true;
}

/**
 * Transfère la propriété d'un espace de travail à un autre membre
 */
export function transferOwnership(
  workspaceId: string,
  newOwnerId: string,
  currentOwnerId: string
) {
  // Vérifier que l'utilisateur actuel est bien le propriétaire
  const ownerCheckStmt = db.prepare(`
    SELECT * FROM workspace_members 
    WHERE workspaceId = ? AND userId = ? AND role = 'owner'
  `);
  const currentOwner = ownerCheckStmt.get(workspaceId, currentOwnerId);

  if (!currentOwner) {
    throw new Error("Seul le propriétaire peut transférer la propriété");
  }

  // Vérifier que le nouveau propriétaire est bien membre de l'espace de travail
  const memberCheckStmt = db.prepare(`
    SELECT * FROM workspace_members 
    WHERE workspaceId = ? AND userId = ?
  `);
  const newOwnerMember = memberCheckStmt.get(workspaceId, newOwnerId);

  if (!newOwnerMember) {
    throw new Error(
      "Le nouveau propriétaire doit être membre de l'espace de travail"
    );
  }

  // Mettre à jour le rôle du propriétaire actuel
  const updateCurrentOwnerStmt = db.prepare(`
    UPDATE workspace_members SET role = 'editor' 
    WHERE workspaceId = ? AND userId = ?
  `);
  updateCurrentOwnerStmt.run(workspaceId, currentOwnerId);

  // Mettre à jour le rôle du nouveau propriétaire
  const updateNewOwnerStmt = db.prepare(`
    UPDATE workspace_members SET role = 'owner' 
    WHERE workspaceId = ? AND userId = ?
  `);
  updateNewOwnerStmt.run(workspaceId, newOwnerId);

  // Mettre à jour le propriétaire dans la table des espaces de travail
  const updateWorkspaceStmt = db.prepare(`
    UPDATE workspaces SET ownerId = ? 
    WHERE id = ?
  `);
  updateWorkspaceStmt.run(newOwnerId, workspaceId);

  return true;
}

/**
 * Décline une invitation à un espace de travail
 */
export function declineInvitation(token: string) {
  const invitationStmt = db.prepare(`
    SELECT * FROM workspace_invitations 
    WHERE token = ? AND status = 'pending' AND expiresAt > ?
  `);
  const invitation = invitationStmt.get(token, new Date().toISOString()) as
    | WorkspaceInvitation
    | undefined;

  if (!invitation) throw new Error("Invitation invalide ou expirée");

  // Mettre à jour le statut de l'invitation
  const updateStmt = db.prepare(`
    UPDATE workspace_invitations SET status = 'declined' WHERE id = ?
  `);
  updateStmt.run(invitation.id);

  return true;
}

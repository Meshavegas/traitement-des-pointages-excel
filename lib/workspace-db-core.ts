import Database from "better-sqlite3";
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
export function createWorkspace(name: string, userId: string) {
  const id = uuidv4();
  const createdAt = new Date().toISOString();

  const stmt = db.prepare(
    `INSERT INTO workspaces (id, name, ownerId, createdAt) VALUES (?, ?, ?, ?)`
  );
  stmt.run(id, name, userId, createdAt);

  // Ajouter le propriétaire comme membre
  const memberStmt = db.prepare(
    `INSERT INTO workspace_members (id, workspaceId, userId, role, addedAt) VALUES (?, ?, ?, ?, ?)`
  );
  memberStmt.run(uuidv4(), id, userId, "owner", createdAt);

  return { id, name, ownerId: userId, createdAt };
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
  const stmt = db.prepare(`
    SELECT * FROM workspace_invitations 
    WHERE token = ? AND status = 'pending' AND expiresAt > ?
  `);
  const invitation = stmt.get(
    token,
    new Date().toISOString()
  ) as WorkspaceInvitation;

  if (!invitation) {
    throw new Error("Invitation invalide ou expirée");
  }

  // Vérifier si l'utilisateur n'est pas déjà membre
  const memberCheckStmt = db.prepare(`
    SELECT id FROM workspace_members 
    WHERE workspaceId = ? AND userId = ?
  `);
  const existingMember = memberCheckStmt.get(invitation.workspaceId, userId);

  if (existingMember) {
    throw new Error("Vous êtes déjà membre de cet espace de travail");
  }

  // Ajouter l'utilisateur comme membre
  const addMemberStmt = db.prepare(`
    INSERT INTO workspace_members (id, workspaceId, userId, role, addedAt) 
    VALUES (?, ?, ?, ?, ?)
  `);
  addMemberStmt.run(
    uuidv4(),
    invitation.workspaceId,
    userId,
    invitation.role || "viewer",
    new Date().toISOString()
  );

  // Marquer l'invitation comme acceptée
  const updateStmt = db.prepare(`
    UPDATE workspace_invitations 
    SET status = 'accepted' 
    WHERE id = ?
  `);
  updateStmt.run(invitation.id);

  return invitation;
}

export function addReportToWorkspace(workspaceId: string, reportId: string) {
  const stmt = db.prepare(`
    INSERT OR IGNORE INTO workspace_reports (workspaceId, reportId) 
    VALUES (?, ?)
  `);
  stmt.run(workspaceId, reportId);
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
  // Vérifier si l'utilisateur est propriétaire du rapport
  const ownerStmt = db.prepare(`
    SELECT id FROM reports WHERE id = ? AND userId = ?
  `);
  const isOwner = ownerStmt.get(reportId, userId);

  if (isOwner) return true;

  // Vérifier si l'utilisateur a accès via un espace de travail
  const workspaceStmt = db.prepare(`
    SELECT wm.role FROM workspace_members wm
    JOIN workspace_reports wr ON wm.workspaceId = wr.workspaceId
    WHERE wr.reportId = ? AND wm.userId = ?
  `);
  const workspaceAccess = workspaceStmt.get(reportId, userId);

  return !!workspaceAccess;
}

export function updateMemberRole(
  memberId: string,
  newRole: "owner" | "editor" | "viewer"
) {
  const stmt = db.prepare(`
    UPDATE workspace_members 
    SET role = ? 
    WHERE id = ?
  `);
  stmt.run(newRole, memberId);
}

export function removeMember(memberId: string) {
  const stmt = db.prepare(`
    DELETE FROM workspace_members 
    WHERE id = ?
  `);
  stmt.run(memberId);
}

export function transferOwnership(
  workspaceId: string,
  newOwnerId: string,
  currentOwnerId: string
) {
  // Vérifier que l'utilisateur actuel est bien le propriétaire
  const ownerStmt = db.prepare(`
    SELECT id FROM workspaces 
    WHERE id = ? AND ownerId = ?
  `);
  const isOwner = ownerStmt.get(workspaceId, currentOwnerId);

  if (!isOwner) {
    throw new Error("Seul le propriétaire peut transférer la propriété");
  }

  // Vérifier que le nouveau propriétaire est membre de l'espace de travail
  const memberStmt = db.prepare(`
    SELECT id FROM workspace_members 
    WHERE workspaceId = ? AND userId = ?
  `);
  const isMember = memberStmt.get(workspaceId, newOwnerId);

  if (!isMember) {
    throw new Error("Le nouveau propriétaire doit être membre de l'espace de travail");
  }

  // Transférer la propriété
  const transferStmt = db.prepare(`
    UPDATE workspaces 
    SET ownerId = ? 
    WHERE id = ?
  `);
  transferStmt.run(newOwnerId, workspaceId);

  // Mettre à jour les rôles
  const updateOldOwnerStmt = db.prepare(`
    UPDATE workspace_members 
    SET role = 'editor' 
    WHERE workspaceId = ? AND userId = ?
  `);
  updateOldOwnerStmt.run(workspaceId, currentOwnerId);

  const updateNewOwnerStmt = db.prepare(`
    UPDATE workspace_members 
    SET role = 'owner' 
    WHERE workspaceId = ? AND userId = ?
  `);
  updateNewOwnerStmt.run(workspaceId, newOwnerId);
}

export function declineInvitation(token: string) {
  const stmt = db.prepare(`
    UPDATE workspace_invitations 
    SET status = 'declined' 
    WHERE token = ? AND status = 'pending'
  `);
  stmt.run(token);
} 
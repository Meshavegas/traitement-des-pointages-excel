import {
  query,
  transaction,
  TABLES,
  WorkspaceRow,
  WorkspaceMemberRow,
  WorkspaceInvitationRow,
  WorkspaceReportRow,
} from './postgres-config';
import { v4 as uuidv4 } from 'uuid';

export interface Workspace {
  id: string;
  name: string;
  ownerId: string;
  createdAt: string;
}

export interface WorkspaceMember {
  id: string;
  workspaceId: string;
  userId: string;
  role: 'owner' | 'editor' | 'viewer';
  addedAt: string;
}

export interface WorkspaceInvitation {
  id: string;
  workspaceId: string;
  email: string;
  token: string;
  status: 'pending' | 'accepted' | 'declined' | 'expired';
  role: 'editor' | 'viewer';
  createdAt: string;
  expiresAt: string;
}

export async function createWorkspace(name: string, ownerId: string): Promise<Workspace> {
  try {
    const workspaceId = uuidv4();
    const memberId = uuidv4();
    const now = new Date();

    await transaction(async (client) => {
      // Create workspace
      await client.query(`
        INSERT INTO ${TABLES.WORKSPACES} (id, name, owner_id)
        VALUES ($1, $2, $3)
      `, [workspaceId, name, ownerId]);

      // Add owner as member
      await client.query(`
        INSERT INTO ${TABLES.WORKSPACE_MEMBERS} (id, workspace_id, user_id, role)
        VALUES ($1, $2, $3, $4)
      `, [memberId, workspaceId, ownerId, 'owner']);
    });

    console.log(`✅ Workspace ${workspaceId} created in PostgreSQL`);
    
    return {
      id: workspaceId,
      name,
      ownerId,
      createdAt: now.toISOString(),
    };
  } catch (error) {
    console.error('❌ Error creating workspace in PostgreSQL:', error);
    throw new Error('Failed to create workspace');
  }
}

export async function getUserWorkspaces(userId: string): Promise<Workspace[]> {
  try {
    const result = await query(`
      SELECT w.id, w.name, w.owner_id, w.created_at, w.updated_at
      FROM ${TABLES.WORKSPACES} w
      INNER JOIN ${TABLES.WORKSPACE_MEMBERS} wm ON w.id = wm.workspace_id
      WHERE wm.user_id = $1
      ORDER BY w.created_at DESC
    `, [userId]);

    return result.rows.map((row: WorkspaceRow) => ({
      id: row.id,
      name: row.name,
      ownerId: row.owner_id,
      createdAt: row.created_at.toISOString(),
    }));
  } catch (error) {
    console.error('❌ Error getting user workspaces from PostgreSQL:', error);
    return [];
  }
}

export async function getWorkspaceById(id: string): Promise<Workspace | undefined> {
  try {
    const result = await query(`
      SELECT * FROM ${TABLES.WORKSPACES} WHERE id = $1
    `, [id]);

    if (result.rows.length === 0) return undefined;

    const workspace = result.rows[0] as WorkspaceRow;
    return {
      id: workspace.id,
      name: workspace.name,
      ownerId: workspace.owner_id,
      createdAt: workspace.created_at.toISOString(),
    };
  } catch (error) {
    console.error('❌ Error getting workspace by id from PostgreSQL:', error);
    return undefined;
  }
}

export async function getWorkspaceMembers(workspaceId: string): Promise<WorkspaceMember[]> {
  try {
    const result = await query(`
      SELECT * FROM ${TABLES.WORKSPACE_MEMBERS} 
      WHERE workspace_id = $1 
      ORDER BY added_at ASC
    `, [workspaceId]);

    return result.rows.map((row: WorkspaceMemberRow) => ({
      id: row.id,
      workspaceId: row.workspace_id,
      userId: row.user_id,
      role: row.role,
      addedAt: row.added_at.toISOString(),
    }));
  } catch (error) {
    console.error('❌ Error getting workspace members from PostgreSQL:', error);
    return [];
  }
}

export async function isWorkspaceMember(workspaceId: string, userId: string): Promise<boolean> {
  try {
    const result = await query(`
      SELECT 1 FROM ${TABLES.WORKSPACE_MEMBERS} 
      WHERE workspace_id = $1 AND user_id = $2
    `, [workspaceId, userId]);

    return result.rows.length > 0;
  } catch (error) {
    console.error('❌ Error checking workspace membership in PostgreSQL:', error);
    return false;
  }
}

export async function createInvitation(
  workspaceId: string,
  email: string,
  role: 'editor' | 'viewer' = 'viewer'
): Promise<WorkspaceInvitation> {
  try {
    const invitationId = uuidv4();
    const token = uuidv4();
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // 7 days

    await query(`
      INSERT INTO ${TABLES.WORKSPACE_INVITATIONS} (
        id, workspace_id, email, token, role, expires_at
      ) VALUES ($1, $2, $3, $4, $5, $6)
    `, [invitationId, workspaceId, email, token, role, expiresAt]);

    console.log(`✅ Invitation ${invitationId} created in PostgreSQL`);
    
    return {
      id: invitationId,
      workspaceId,
      email,
      token,
      status: 'pending',
      role,
      createdAt: now.toISOString(),
      expiresAt: expiresAt.toISOString(),
    };
  } catch (error) {
    console.error('❌ Error creating invitation in PostgreSQL:', error);
    throw new Error('Failed to create invitation');
  }
}

export async function getInvitationByToken(token: string): Promise<WorkspaceInvitation | undefined> {
  try {
    const result = await query(`
      SELECT * FROM ${TABLES.WORKSPACE_INVITATIONS} 
      WHERE token = $1 AND status = 'pending' AND expires_at > NOW()
    `, [token]);

    if (result.rows.length === 0) return undefined;

    const invitation = result.rows[0] as WorkspaceInvitationRow;
    return {
      id: invitation.id,
      workspaceId: invitation.workspace_id,
      email: invitation.email,
      token: invitation.token,
      status: invitation.status,
      role: invitation.role,
      createdAt: invitation.created_at.toISOString(),
      expiresAt: invitation.expires_at.toISOString(),
    };
  } catch (error) {
    console.error('❌ Error getting invitation by token from PostgreSQL:', error);
    return undefined;
  }
}

export async function acceptInvitation(token: string, userId: string): Promise<boolean> {
  try {
    await transaction(async (client) => {
      // Get invitation
      const invitationResult = await client.query(`
        SELECT * FROM ${TABLES.WORKSPACE_INVITATIONS} 
        WHERE token = $1 AND status = 'pending' AND expires_at > NOW()
      `, [token]);

      if (invitationResult.rows.length === 0) {
        throw new Error('Invalid or expired invitation');
      }

      const invitation = invitationResult.rows[0] as WorkspaceInvitationRow;

      // Check if user is already a member
      const memberResult = await client.query(`
        SELECT 1 FROM ${TABLES.WORKSPACE_MEMBERS} 
        WHERE workspace_id = $1 AND user_id = $2
      `, [invitation.workspace_id, userId]);

      if (memberResult.rows.length > 0) {
        throw new Error('User is already a member of this workspace');
      }

      // Add user to workspace
      const memberId = uuidv4();
      await client.query(`
        INSERT INTO ${TABLES.WORKSPACE_MEMBERS} (id, workspace_id, user_id, role)
        VALUES ($1, $2, $3, $4)
      `, [memberId, invitation.workspace_id, userId, invitation.role]);

      // Update invitation status
      await client.query(`
        UPDATE ${TABLES.WORKSPACE_INVITATIONS} 
        SET status = 'accepted' 
        WHERE token = $1
      `, [token]);
    });

    console.log(`✅ Invitation accepted and user added to workspace in PostgreSQL`);
    return true;
  } catch (error) {
    console.error('❌ Error accepting invitation in PostgreSQL:', error);
    return false;
  }
}

export async function getPendingInvitations(email: string): Promise<(WorkspaceInvitation & { workspaceName: string })[]> {
  try {
    const result = await query(`
      SELECT i.*, w.name as workspace_name
      FROM ${TABLES.WORKSPACE_INVITATIONS} i
      INNER JOIN ${TABLES.WORKSPACES} w ON i.workspace_id = w.id
      WHERE i.email = $1 AND i.status = 'pending' AND i.expires_at > NOW()
      ORDER BY i.created_at DESC
    `, [email]);

    return result.rows.map((row: any) => ({
      id: row.id,
      workspaceId: row.workspace_id,
      email: row.email,
      token: row.token,
      status: row.status,
      role: row.role,
      createdAt: row.created_at.toISOString(),
      expiresAt: row.expires_at.toISOString(),
      workspaceName: row.workspace_name,
    }));
  } catch (error) {
    console.error('❌ Error getting pending invitations from PostgreSQL:', error);
    return [];
  }
}

export async function addReportToWorkspace(workspaceId: string, reportId: string): Promise<boolean> {
  try {
    await query(`
      INSERT INTO ${TABLES.WORKSPACE_REPORTS} (workspace_id, report_id)
      VALUES ($1, $2)
      ON CONFLICT (workspace_id, report_id) DO NOTHING
    `, [workspaceId, reportId]);

    console.log(`✅ Report ${reportId} added to workspace ${workspaceId} in PostgreSQL`);
    return true;
  } catch (error) {
    console.error('❌ Error adding report to workspace in PostgreSQL:', error);
    return false;
  }
}

export async function removeReportFromWorkspace(workspaceId: string, reportId: string): Promise<boolean> {
  try {
    const result = await query(`
      DELETE FROM ${TABLES.WORKSPACE_REPORTS} 
      WHERE workspace_id = $1 AND report_id = $2
    `, [workspaceId, reportId]);

    console.log(`✅ Report ${reportId} removed from workspace ${workspaceId} in PostgreSQL`);
    return result.rowCount > 0;
  } catch (error) {
    console.error('❌ Error removing report from workspace in PostgreSQL:', error);
    return false;
  }
}

export async function getWorkspaceReports(workspaceId: string): Promise<any[]> {
  try {
    const result = await query(`
      SELECT r.*
      FROM ${TABLES.REPORTS} r
      INNER JOIN ${TABLES.WORKSPACE_REPORTS} wr ON r.id = wr.report_id
      WHERE wr.workspace_id = $1
      ORDER BY r.upload_date DESC
    `, [workspaceId]);

    return result.rows;
  } catch (error) {
    console.error('❌ Error getting workspace reports from PostgreSQL:', error);
    return [];
  }
}

export async function canAccessReport(userId: string, reportId: string): Promise<boolean> {
  try {
    // Check if user owns the report
    const ownedReportResult = await query(`
      SELECT 1 FROM ${TABLES.REPORTS} WHERE id = $1 AND user_id = $2
    `, [reportId, userId]);

    if (ownedReportResult.rows.length > 0) return true;

    // Check if user has access via workspace
    const workspaceAccessResult = await query(`
      SELECT 1 FROM ${TABLES.WORKSPACE_REPORTS} wr
      INNER JOIN ${TABLES.WORKSPACE_MEMBERS} wm ON wr.workspace_id = wm.workspace_id
      WHERE wr.report_id = $1 AND wm.user_id = $2
    `, [reportId, userId]);

    return workspaceAccessResult.rows.length > 0;
  } catch (error) {
    console.error('❌ Error checking report access in PostgreSQL:', error);
    return false;
  }
}

export async function declineInvitation(token: string): Promise<boolean> {
  try {
    const result = await query(`
      UPDATE ${TABLES.WORKSPACE_INVITATIONS} 
      SET status = 'declined' 
      WHERE token = $1 AND status = 'pending'
    `, [token]);

    console.log(`✅ Invitation declined for token ${token}`);
    return result.rowCount > 0;
  } catch (error) {
    console.error('❌ Error declining invitation in PostgreSQL:', error);
    return false;
  }
}

export async function updateMemberRole(
  memberId: string,
  newRole: 'owner' | 'editor' | 'viewer'
): Promise<boolean> {
  try {
    const result = await query(`
      UPDATE ${TABLES.WORKSPACE_MEMBERS} 
      SET role = $1 
      WHERE id = $2
    `, [newRole, memberId]);

    console.log(`✅ Member ${memberId} role updated to ${newRole}`);
    return result.rowCount > 0;
  } catch (error) {
    console.error('❌ Error updating member role in PostgreSQL:', error);
    return false;
  }
}

export async function removeMember(memberId: string): Promise<boolean> {
  try {
    const result = await query(`
      DELETE FROM ${TABLES.WORKSPACE_MEMBERS} WHERE id = $1
    `, [memberId]);

    console.log(`✅ Member ${memberId} removed`);
    return result.rowCount > 0;
  } catch (error) {
    console.error('❌ Error removing member in PostgreSQL:', error);
    return false;
  }
}

export async function transferOwnership(workspaceId: string, currentOwnerId: string, newOwnerId: string): Promise<boolean> {
  try {
    await transaction(async (client) => {
      // Verify current ownership
      const ownershipResult = await client.query(`
        SELECT 1 FROM ${TABLES.WORKSPACES} 
        WHERE id = $1 AND owner_id = $2
      `, [workspaceId, currentOwnerId]);

      if (ownershipResult.rows.length === 0) {
        throw new Error('Workspace not found or access denied');
      }

      // Check if new owner is a member
      const memberResult = await client.query(`
        SELECT id FROM ${TABLES.WORKSPACE_MEMBERS} 
        WHERE workspace_id = $1 AND user_id = $2
      `, [workspaceId, newOwnerId]);

      if (memberResult.rows.length === 0) {
        throw new Error('New owner must be a workspace member');
      }

      const newOwnerMemberId = memberResult.rows[0].id;

      // Update workspace owner
      await client.query(`
        UPDATE ${TABLES.WORKSPACES} 
        SET owner_id = $1, updated_at = CURRENT_TIMESTAMP 
        WHERE id = $2
      `, [newOwnerId, workspaceId]);

      // Update roles: new owner becomes owner, old owner becomes editor
      await client.query(`
        UPDATE ${TABLES.WORKSPACE_MEMBERS} 
        SET role = 'owner' 
        WHERE id = $1
      `, [newOwnerMemberId]);

      await client.query(`
        UPDATE ${TABLES.WORKSPACE_MEMBERS} 
        SET role = 'editor' 
        WHERE workspace_id = $1 AND user_id = $2
      `, [workspaceId, currentOwnerId]);
    });

    console.log(`✅ Ownership transferred from ${currentOwnerId} to ${newOwnerId} for workspace ${workspaceId}`);
    return true;
  } catch (error) {
    console.error('❌ Error transferring ownership in PostgreSQL:', error);
    return false;
  }
}

export async function deleteWorkspace(workspaceId: string, ownerId: string): Promise<boolean> {
  try {
    await transaction(async (client) => {
      // Verify ownership
      const workspaceResult = await client.query(`
        SELECT 1 FROM ${TABLES.WORKSPACES} 
        WHERE id = $1 AND owner_id = $2
      `, [workspaceId, ownerId]);

      if (workspaceResult.rows.length === 0) {
        throw new Error('Workspace not found or access denied');
      }

      // Delete will cascade to all related tables due to foreign key constraints
      await client.query(`
        DELETE FROM ${TABLES.WORKSPACES} WHERE id = $1
      `, [workspaceId]);
    });

    console.log(`✅ Workspace ${workspaceId} deleted from PostgreSQL`);
    return true;
  } catch (error) {
    console.error('❌ Error deleting workspace from PostgreSQL:', error);
    return false;
  }
} 
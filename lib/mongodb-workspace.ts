import { v4 as uuidv4 } from "uuid";
import {
  getCollection,
  COLLECTIONS,
  WorkspaceDocument,
  WorkspaceMemberDocument,
  WorkspaceInvitationDocument,
  WorkspaceReportDocument,
} from "./mongodb-config";

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
export async function createWorkspace(name: string, userId: string): Promise<Workspace> {
  try {
    const id = uuidv4();
    const now = new Date();
    const createdAt = now.toISOString();

    // Create workspace
    const workspacesCollection = await getCollection<WorkspaceDocument>(COLLECTIONS.WORKSPACES);
    await workspacesCollection.insertOne({
      id,
      name,
      ownerId: userId,
      createdAt: now,
      updatedAt: now,
    });

    // Add owner as member
    const membersCollection = await getCollection<WorkspaceMemberDocument>(COLLECTIONS.WORKSPACE_MEMBERS);
    await membersCollection.insertOne({
      id: uuidv4(),
      workspaceId: id,
      userId,
      role: "owner",
      addedAt: now,
    });

    console.log(`✅ Workspace ${id} created in MongoDB`);
    return { id, name, ownerId: userId, createdAt };
  } catch (error) {
    console.error("❌ Error creating workspace in MongoDB:", error);
    throw new Error("Failed to create workspace");
  }
}

export async function getUserWorkspaces(userId: string): Promise<Workspace[]> {
  try {
    const membersCollection = await getCollection<WorkspaceMemberDocument>(COLLECTIONS.WORKSPACE_MEMBERS);
    const workspacesCollection = await getCollection<WorkspaceDocument>(COLLECTIONS.WORKSPACES);

    // Get user's workspace memberships
    const memberships = await membersCollection.find({ userId }).toArray();
    const workspaceIds = memberships.map(m => m.workspaceId);

    if (workspaceIds.length === 0) return [];

    // Get workspaces
    const workspaces = await workspacesCollection
      .find({ id: { $in: workspaceIds } })
      .toArray();

    return workspaces.map(w => ({
      id: w.id,
      name: w.name,
      ownerId: w.ownerId,
      createdAt: w.createdAt.toISOString(),
    }));
  } catch (error) {
    console.error("❌ Error getting user workspaces from MongoDB:", error);
    return [];
  }
}

export async function getWorkspaceById(id: string): Promise<Workspace | undefined> {
  try {
    const workspacesCollection = await getCollection<WorkspaceDocument>(COLLECTIONS.WORKSPACES);
    const workspace = await workspacesCollection.findOne({ id });

    if (!workspace) return undefined;

    return {
      id: workspace.id,
      name: workspace.name,
      ownerId: workspace.ownerId,
      createdAt: workspace.createdAt.toISOString(),
    };
  } catch (error) {
    console.error("❌ Error getting workspace by id from MongoDB:", error);
    return undefined;
  }
}

export async function getWorkspaceMembers(workspaceId: string): Promise<WorkspaceMember[]> {
  try {
    const membersCollection = await getCollection<WorkspaceMemberDocument>(COLLECTIONS.WORKSPACE_MEMBERS);
    const members = await membersCollection.find({ workspaceId }).toArray();

    return members.map(m => ({
      id: m.id,
      workspaceId: m.workspaceId,
      userId: m.userId,
      role: m.role,
      addedAt: m.addedAt.toISOString(),
    }));
  } catch (error) {
    console.error("❌ Error getting workspace members from MongoDB:", error);
    return [];
  }
}

export async function inviteToWorkspace(
  workspaceId: string,
  email: string,
  role: "editor" | "viewer" = "viewer"
): Promise<WorkspaceInvitation> {
  try {
    const id = uuidv4();
    const token = uuidv4();
    const now = new Date();
    const createdAt = now.toISOString();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(); // 7 jours

    const invitationsCollection = await getCollection<WorkspaceInvitationDocument>(COLLECTIONS.WORKSPACE_INVITATIONS);

    // Check if invitation already exists
    const existingInvitation = await invitationsCollection.findOne({
      workspaceId,
      email,
      status: "pending",
    });

    if (existingInvitation) {
      // Update existing invitation
      const newToken = uuidv4();
      const newExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      
      await invitationsCollection.updateOne(
        { _id: existingInvitation._id },
        {
          $set: {
            token: newToken,
            expiresAt: newExpiresAt,
          },
        }
      );

      return {
        id: existingInvitation.id,
        workspaceId,
        email,
        token: newToken,
        status: "pending",
        createdAt,
        expiresAt: newExpiresAt.toISOString(),
        role,
      };
    }

    // Create new invitation
    await invitationsCollection.insertOne({
      id,
      workspaceId,
      email,
      token,
      status: "pending",
      role,
      createdAt: now,
      expiresAt: new Date(expiresAt),
    });

    console.log(`✅ Invitation sent for workspace ${workspaceId} to ${email}`);
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
  } catch (error) {
    console.error("❌ Error inviting to workspace in MongoDB:", error);
    throw new Error("Failed to send invitation");
  }
}

export async function getPendingInvitations(email: string): Promise<(WorkspaceInvitation & { workspaceName: string })[]> {
  try {
    const invitationsCollection = await getCollection<WorkspaceInvitationDocument>(COLLECTIONS.WORKSPACE_INVITATIONS);
    const workspacesCollection = await getCollection<WorkspaceDocument>(COLLECTIONS.WORKSPACES);

    const invitations = await invitationsCollection
      .find({
        email,
        status: "pending",
        expiresAt: { $gt: new Date() },
      })
      .toArray();

    if (invitations.length === 0) return [];

    const workspaceIds = invitations.map(inv => inv.workspaceId);
    const workspaces = await workspacesCollection
      .find({ id: { $in: workspaceIds } })
      .toArray();

    const workspaceMap = new Map(workspaces.map(w => [w.id, w.name]));

    return invitations.map(inv => ({
      id: inv.id,
      workspaceId: inv.workspaceId,
      email: inv.email,
      token: inv.token,
      status: inv.status,
      createdAt: inv.createdAt.toISOString(),
      expiresAt: inv.expiresAt.toISOString(),
      role: inv.role,
      workspaceName: workspaceMap.get(inv.workspaceId) || "Unknown Workspace",
    }));
  } catch (error) {
    console.error("❌ Error getting pending invitations from MongoDB:", error);
    return [];
  }
}

export async function acceptInvitation(token: string, userId: string): Promise<WorkspaceInvitation> {
  try {
    const invitationsCollection = await getCollection<WorkspaceInvitationDocument>(COLLECTIONS.WORKSPACE_INVITATIONS);
    const membersCollection = await getCollection<WorkspaceMemberDocument>(COLLECTIONS.WORKSPACE_MEMBERS);

    const invitation = await invitationsCollection.findOne({
      token,
      status: "pending",
      expiresAt: { $gt: new Date() },
    });

    if (!invitation) {
      throw new Error("Invitation invalide ou expirée");
    }

    // Check if user is already a member
    const existingMember = await membersCollection.findOne({
      workspaceId: invitation.workspaceId,
      userId,
    });

    if (existingMember) {
      throw new Error("Vous êtes déjà membre de cet espace de travail");
    }

    // Add user as member
    await membersCollection.insertOne({
      id: uuidv4(),
      workspaceId: invitation.workspaceId,
      userId,
      role: invitation.role || "viewer",
      addedAt: new Date(),
    });

    // Mark invitation as accepted
    await invitationsCollection.updateOne(
      { _id: invitation._id },
      { $set: { status: "accepted" } }
    );

    console.log(`✅ Invitation accepted for workspace ${invitation.workspaceId}`);
    return {
      id: invitation.id,
      workspaceId: invitation.workspaceId,
      email: invitation.email,
      token: invitation.token,
      status: "accepted",
      createdAt: invitation.createdAt.toISOString(),
      expiresAt: invitation.expiresAt.toISOString(),
      role: invitation.role,
    };
  } catch (error) {
    console.error("❌ Error accepting invitation in MongoDB:", error);
    throw new Error("Failed to accept invitation");
  }
}

export async function addReportToWorkspace(workspaceId: string, reportId: string): Promise<void> {
  try {
    const workspaceReportsCollection = await getCollection<WorkspaceReportDocument>(COLLECTIONS.WORKSPACE_REPORTS);
    
    // Use upsert to avoid duplicates
    await workspaceReportsCollection.updateOne(
      { workspaceId, reportId },
      {
        $setOnInsert: {
          workspaceId,
          reportId,
          addedAt: new Date(),
        },
      },
      { upsert: true }
    );

    console.log(`✅ Report ${reportId} added to workspace ${workspaceId}`);
  } catch (error) {
    console.error("❌ Error adding report to workspace in MongoDB:", error);
    throw new Error("Failed to add report to workspace");
  }
}

export async function getWorkspaceReports(workspaceId: string): Promise<any[]> {
  try {
    const workspaceReportsCollection = await getCollection<WorkspaceReportDocument>(COLLECTIONS.WORKSPACE_REPORTS);
    const { getCollection: getReportsCollection } = await import("./mongodb-config");
    
    const workspaceReports = await workspaceReportsCollection
      .find({ workspaceId })
      .toArray();

    if (workspaceReports.length === 0) return [];

    const reportIds = workspaceReports.map(wr => wr.reportId);
    const reportsCollection = await getReportsCollection(COLLECTIONS.REPORTS);
    const reports = await reportsCollection
      .find({ id: { $in: reportIds } })
      .toArray();

    return reports;
  } catch (error) {
    console.error("❌ Error getting workspace reports from MongoDB:", error);
    return [];
  }
}

export async function canAccessReport(userId: string, reportId: string): Promise<boolean> {
  try {
    const { getCollection: getReportsCollection } = await import("./mongodb-config");
    
    // Check if user owns the report
    const reportsCollection = await getReportsCollection(COLLECTIONS.REPORTS);
    const ownedReport = await reportsCollection.findOne({ id: reportId, userId });

    if (ownedReport) return true;

    // Check if user has access via workspace
    const workspaceReportsCollection = await getCollection<WorkspaceReportDocument>(COLLECTIONS.WORKSPACE_REPORTS);
    const membersCollection = await getCollection<WorkspaceMemberDocument>(COLLECTIONS.WORKSPACE_MEMBERS);

    const workspaceReport = await workspaceReportsCollection.findOne({ reportId });
    if (!workspaceReport) return false;

    const membership = await membersCollection.findOne({
      workspaceId: workspaceReport.workspaceId,
      userId,
    });

    return !!membership;
  } catch (error) {
    console.error("❌ Error checking report access in MongoDB:", error);
    return false;
  }
}

export async function updateMemberRole(
  memberId: string,
  newRole: "owner" | "editor" | "viewer"
): Promise<void> {
  try {
    const membersCollection = await getCollection<WorkspaceMemberDocument>(COLLECTIONS.WORKSPACE_MEMBERS);
    await membersCollection.updateOne(
      { id: memberId },
      { $set: { role: newRole } }
    );

    console.log(`✅ Member ${memberId} role updated to ${newRole}`);
  } catch (error) {
    console.error("❌ Error updating member role in MongoDB:", error);
    throw new Error("Failed to update member role");
  }
}

export async function removeMember(memberId: string): Promise<void> {
  try {
    const membersCollection = await getCollection<WorkspaceMemberDocument>(COLLECTIONS.WORKSPACE_MEMBERS);
    await membersCollection.deleteOne({ id: memberId });

    console.log(`✅ Member ${memberId} removed`);
  } catch (error) {
    console.error("❌ Error removing member in MongoDB:", error);
    throw new Error("Failed to remove member");
  }
}

export async function transferOwnership(
  workspaceId: string,
  newOwnerId: string,
  currentOwnerId: string
): Promise<void> {
  try {
    const workspacesCollection = await getCollection<WorkspaceDocument>(COLLECTIONS.WORKSPACES);
    const membersCollection = await getCollection<WorkspaceMemberDocument>(COLLECTIONS.WORKSPACE_MEMBERS);

    // Verify current owner
    const workspace = await workspacesCollection.findOne({
      id: workspaceId,
      ownerId: currentOwnerId,
    });

    if (!workspace) {
      throw new Error("Seul le propriétaire peut transférer la propriété");
    }

    // Verify new owner is a member
    const newOwnerMember = await membersCollection.findOne({
      workspaceId,
      userId: newOwnerId,
    });

    if (!newOwnerMember) {
      throw new Error("Le nouveau propriétaire doit être membre de l'espace de travail");
    }

    // Transfer ownership
    await workspacesCollection.updateOne(
      { id: workspaceId },
      { $set: { ownerId: newOwnerId, updatedAt: new Date() } }
    );

    // Update member roles
    await membersCollection.updateOne(
      { workspaceId, userId: currentOwnerId },
      { $set: { role: "editor" } }
    );

    await membersCollection.updateOne(
      { workspaceId, userId: newOwnerId },
      { $set: { role: "owner" } }
    );

    console.log(`✅ Ownership transferred from ${currentOwnerId} to ${newOwnerId}`);
  } catch (error) {
    console.error("❌ Error transferring ownership in MongoDB:", error);
    throw new Error("Failed to transfer ownership");
  }
}

export async function declineInvitation(token: string): Promise<void> {
  try {
    const invitationsCollection = await getCollection<WorkspaceInvitationDocument>(COLLECTIONS.WORKSPACE_INVITATIONS);
    await invitationsCollection.updateOne(
      { token, status: "pending" },
      { $set: { status: "declined" } }
    );

    console.log(`✅ Invitation declined for token ${token}`);
  } catch (error) {
    console.error("❌ Error declining invitation in MongoDB:", error);
    throw new Error("Failed to decline invitation");
  }
} 
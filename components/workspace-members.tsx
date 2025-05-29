"use client";

import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { Users, UserPlus, Mail, Shield, Trash } from "lucide-react";
import {
  getWorkspaceMembers,
  inviteToWorkspace,
  updateMemberRole,
  removeMember,
  transferOwnership,
} from "@/lib/workspace-actions";
import type { WorkspaceMember, Workspace } from "@/lib/workspace-db-core";

interface WorkspaceMembersProps {
  workspace: Workspace;
  onMembersUpdated?: () => void;
}

export function WorkspaceMembers({
  workspace,
  onMembersUpdated,
}: WorkspaceMembersProps) {
  const [members, setMembers] = useState<WorkspaceMember[]>([]);
  const [inviteEmail, setInviteEmail] = useState("");
  const [selectedRole, setSelectedRole] = useState<"editor" | "viewer">(
    "viewer"
  );
  const [isLoading, setIsLoading] = useState(true);
  const [isInviting, setIsInviting] = useState(false);
  const { user } = useUser();
  const { toast } = useToast();
  const isOwner = user?.id === workspace.ownerId;

  useEffect(() => {
    const loadMembers = async () => {
      try {
        setIsLoading(true);
        const workspaceMembers = await getWorkspaceMembers(workspace.id);
        setMembers(workspaceMembers);
      } catch (error) {
        console.error("Erreur lors du chargement des membres:", error);
        toast({
          title: "Erreur",
          description:
            "Impossible de charger les membres de l'espace de travail.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadMembers();
  }, [workspace.id, toast]);

  const handleInviteUser = async () => {
    if (!inviteEmail.trim()) return;

    setIsInviting(true);
    try {
      await inviteToWorkspace(workspace.id, inviteEmail, selectedRole);
      setInviteEmail("");
      toast({
        title: "Invitation envoyée",
        description: `Une invitation a été envoyée à ${inviteEmail} avec le rôle de ${
          selectedRole === "editor" ? "éditeur" : "lecteur"
        }`,
      });
    } catch (error) {
      console.error("Erreur lors de l'envoi de l'invitation:", error);
      toast({
        title: "Erreur",
        description: "Impossible d'envoyer l'invitation.",
        variant: "destructive",
      });
    } finally {
      setIsInviting(false);
    }
  };

  const handleUpdateRole = async (
    memberId: string,
    newRole: "owner" | "editor" | "viewer"
  ) => {
    try {
      await updateMemberRole(memberId, newRole);
      setMembers(
        members.map((member) =>
          member.id === memberId ? { ...member, role: newRole } : member
        )
      );
      toast({
        title: "Rôle mis à jour",
        description: "Le rôle du membre a été mis à jour avec succès.",
      });
      if (onMembersUpdated) onMembersUpdated();
    } catch (error) {
      console.error("Erreur lors de la mise à jour du rôle:", error);
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour le rôle du membre.",
        variant: "destructive",
      });
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    try {
      await removeMember(memberId);
      setMembers(members.filter((member) => member.id !== memberId));
      toast({
        title: "Membre supprimé",
        description: "Le membre a été retiré de l'espace de travail.",
      });
      if (onMembersUpdated) onMembersUpdated();
    } catch (error) {
      console.error("Erreur lors de la suppression du membre:", error);
      toast({
        title: "Erreur",
        description: "Impossible de supprimer le membre.",
        variant: "destructive",
      });
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case "owner":
        return "Propriétaire";
      case "editor":
        return "Éditeur";
      case "viewer":
        return "Lecteur";
      default:
        return role;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Users className="mr-2 h-5 w-5" /> Membres de l'espace de travail
        </CardTitle>
        <CardDescription>
          Gérez les personnes qui ont accès à cet espace de travail
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="text-center py-4">Chargement des membres...</div>
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Utilisateur</TableHead>
                  <TableHead>Rôle</TableHead>
                  {isOwner && (
                    <TableHead className="text-right">Actions</TableHead>
                  )}
                </TableRow>
              </TableHeader>
              <TableBody>
                {members.map((member) => (
                  <TableRow key={member.id}>
                    <TableCell>{member.userId}</TableCell>
                    <TableCell>
                      {isOwner && member.role !== "owner" ? (
                        <Select
                          defaultValue={member.role}
                          onValueChange={(value) =>
                            handleUpdateRole(
                              member.id,
                              value as "editor" | "viewer"
                            )
                          }
                        >
                          <SelectTrigger className="w-32">
                            <SelectValue
                              placeholder={getRoleLabel(member.role)}
                            />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="editor">Éditeur</SelectItem>
                            <SelectItem value="viewer">Lecteur</SelectItem>
                          </SelectContent>
                        </Select>
                      ) : (
                        <div className="flex items-center">
                          <Shield
                            className={`mr-2 h-4 w-4 ${
                              member.role === "owner"
                                ? "text-primary"
                                : "text-muted-foreground"
                            }`}
                          />
                          {getRoleLabel(member.role)}
                        </div>
                      )}
                    </TableCell>
                    {isOwner && (
                      <TableCell className="text-right">
                        {member.role !== "owner" && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveMember(member.id)}
                          >
                            <Trash className="h-4 w-4" />
                          </Button>
                        )}
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {isOwner && (
              <div className="mt-6">
                <Dialog>
                  <DialogTrigger asChild>
                    <Button className="w-full">
                      <UserPlus className="mr-2 h-4 w-4" /> Inviter un membre
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Inviter un nouveau membre</DialogTitle>
                      <DialogDescription>
                        Envoyez une invitation par email pour rejoindre cet
                        espace de travail.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="email" className="text-right">
                          Email
                        </Label>
                        <div className="col-span-3">
                          <div className="flex items-center">
                            <Mail className="mr-2 h-4 w-4 text-muted-foreground" />
                            <Input
                              id="email"
                              type="email"
                              value={inviteEmail}
                              onChange={(e) => setInviteEmail(e.target.value)}
                              placeholder="utilisateur@exemple.com"
                            />
                          </div>
                        </div>
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="role" className="text-right">
                          Rôle
                        </Label>
                        <Select
                          value={selectedRole}
                          onValueChange={(value) =>
                            setSelectedRole(value as "editor" | "viewer")
                          }
                        >
                          <SelectTrigger className="col-span-3" id="role">
                            <SelectValue placeholder="Sélectionner un rôle" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="editor">Éditeur</SelectItem>
                            <SelectItem value="viewer">Lecteur</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button onClick={handleInviteUser} disabled={isInviting}>
                        {isInviting
                          ? "Envoi en cours..."
                          : "Envoyer l'invitation"}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}

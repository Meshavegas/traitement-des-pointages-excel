"use client";

import { useState } from "react";
import { useUser } from "@clerk/nextjs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { Shield } from "lucide-react";
import {
  transferOwnership,
  getWorkspaceMembers,
  type Workspace,
  type WorkspaceMember,
} from "@/lib/workspace-db";

interface WorkspaceOwnershipTransferProps {
  workspace: Workspace;
  onOwnershipTransferred?: () => void;
}

export function WorkspaceOwnershipTransfer({
  workspace,
  onOwnershipTransferred,
}: WorkspaceOwnershipTransferProps) {
  const [members, setMembers] = useState<WorkspaceMember[]>([]);
  const [selectedMemberId, setSelectedMemberId] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const { user } = useUser();
  const { toast } = useToast();
  const isOwner = user?.id === workspace.ownerId;

  const loadMembers = async () => {
    try {
      const workspaceMembers = await getWorkspaceMembers(workspace.id);
      // Filtrer pour exclure le propriétaire actuel et obtenir uniquement les membres qui peuvent devenir propriétaires
      const eligibleMembers = workspaceMembers.filter(
        (member) => member.userId !== user?.id
      );
      setMembers(eligibleMembers);
    } catch (error) {
      console.error("Erreur lors du chargement des membres:", error);
      toast({
        title: "Erreur",
        description:
          "Impossible de charger les membres de l'espace de travail.",
        variant: "destructive",
      });
    }
  };

  const handleTransferOwnership = async () => {
    if (!selectedMemberId || !user) return;

    const selectedMember = members.find(
      (member) => member.id === selectedMemberId
    );
    if (!selectedMember) return;

    setIsLoading(true);
    try {
      await transferOwnership(workspace.id, selectedMember.userId, user.id);
      toast({
        title: "Propriété transférée",
        description: `La propriété de l'espace de travail a été transférée avec succès.`,
      });
      setIsOpen(false);
      if (onOwnershipTransferred) onOwnershipTransferred();
    } catch (error) {
      console.error("Erreur lors du transfert de propriété:", error);
      toast({
        title: "Erreur",
        description:
          "Impossible de transférer la propriété de l'espace de travail.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOwner) return null;

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        setIsOpen(open);
        if (open) loadMembers();
      }}
    >
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Shield className="mr-2 h-4 w-4" /> Transférer la propriété
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Transférer la propriété</DialogTitle>
          <DialogDescription>
            Sélectionnez un membre à qui transférer la propriété de cet espace
            de travail. Cette action est irréversible et vous deviendrez éditeur
            après le transfert.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Nouveau propriétaire</label>
            <Select
              value={selectedMemberId}
              onValueChange={setSelectedMemberId}
              disabled={members.length === 0}
            >
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner un membre" />
              </SelectTrigger>
              <SelectContent>
                {members.length === 0 ? (
                  <SelectItem value="no-members" disabled>
                    Aucun membre disponible
                  </SelectItem>
                ) : (
                  members.map((member) => (
                    <SelectItem key={member.id} value={member.id}>
                      {member.userId} (
                      {member.role === "editor" ? "Éditeur" : "Lecteur"})
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button
            onClick={handleTransferOwnership}
            disabled={isLoading || !selectedMemberId}
          >
            {isLoading ? "Transfert en cours..." : "Transférer la propriété"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

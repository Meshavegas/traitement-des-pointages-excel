"use client";

import { useState, useEffect } from "react";
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
import { Share2 } from "lucide-react";
import {
  getUserWorkspaces,
  addReportToWorkspace,
  type Workspace,
} from "@/lib/workspace-db";

interface AddReportToWorkspaceProps {
  reportId: string;
  onReportShared?: () => void;
}

export function AddReportToWorkspace({
  reportId,
  onReportShared,
}: AddReportToWorkspaceProps) {
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const { user } = useUser();
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen && user) {
      loadWorkspaces();
    }
  }, [isOpen, user]);

  const loadWorkspaces = async () => {
    if (!user) return;

    try {
      setIsLoading(true);
      const userWorkspaces = await getUserWorkspaces(user.id);
      setWorkspaces(userWorkspaces);
    } catch (error) {
      console.error("Erreur lors du chargement des espaces de travail:", error);
      toast({
        title: "Erreur",
        description: "Impossible de charger vos espaces de travail.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleShareReport = async () => {
    if (!selectedWorkspaceId) return;

    setIsLoading(true);
    try {
      await addReportToWorkspace(selectedWorkspaceId, reportId);
      toast({
        title: "Rapport partagé",
        description: `Le rapport a été ajouté à l'espace de travail avec succès.`,
      });
      setIsOpen(false);
      if (onReportShared) onReportShared();
    } catch (error) {
      console.error("Erreur lors du partage du rapport:", error);
      toast({
        title: "Erreur",
        description: "Impossible de partager le rapport.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Share2 className="mr-2 h-4 w-4" /> Partager
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Partager le rapport</DialogTitle>
          <DialogDescription>
            Sélectionnez un espace de travail pour partager ce rapport avec ses
            membres.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Espace de travail</label>
            <Select
              value={selectedWorkspaceId}
              onValueChange={setSelectedWorkspaceId}
              disabled={workspaces.length === 0 || isLoading}
            >
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner un espace de travail" />
              </SelectTrigger>
              <SelectContent>
                {workspaces.length === 0 ? (
                  <SelectItem value="no-workspaces" disabled>
                    {isLoading
                      ? "Chargement..."
                      : "Aucun espace de travail disponible"}
                  </SelectItem>
                ) : (
                  workspaces.map((workspace) => (
                    <SelectItem key={workspace.id} value={workspace.id}>
                      {workspace.name}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button
            onClick={handleShareReport}
            disabled={isLoading || !selectedWorkspaceId}
          >
            {isLoading ? "Partage en cours..." : "Partager le rapport"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

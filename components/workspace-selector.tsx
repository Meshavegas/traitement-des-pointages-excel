"use client";

import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Plus, Briefcase } from "lucide-react";
import { getUserWorkspaces, createWorkspace } from "@/lib/workspace-actions";
import { useToast } from "@/components/ui/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface Workspace {
  id: string;
  name: string;
  ownerId: string;
  createdAt: string;
}

interface WorkspaceSelectorProps {
  selectedWorkspaceId: string | null;
  onWorkspaceChange: (workspaceId: string) => void;
}

export function WorkspaceSelector({ selectedWorkspaceId, onWorkspaceChange }: WorkspaceSelectorProps) {
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [newWorkspaceName, setNewWorkspaceName] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { isSignedIn, user } = useUser();
  const { toast } = useToast();

  useEffect(() => {
    if (isSignedIn) {
      loadWorkspaces();
    }
  }, [isSignedIn]);

  const loadWorkspaces = async () => {
    try {
      setIsLoading(true);
      const userWorkspaces = await getUserWorkspaces();
      setWorkspaces(userWorkspaces);
      
      // Si aucun workspace n'est sélectionné et qu'il y en a au moins un, sélectionner le premier
      if (!selectedWorkspaceId && userWorkspaces.length > 0) {
        onWorkspaceChange(userWorkspaces[0].id);
      }
    } catch (error) {
      console.error("Error loading workspaces:", error);
      toast({
        title: "Erreur",
        description: "Impossible de charger vos espaces de travail.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateWorkspace = async () => {
    if (!newWorkspaceName.trim()) return;

    setIsCreating(true);
    try {
      const workspace = await createWorkspace(newWorkspaceName);
      setWorkspaces([...workspaces, workspace]);
      onWorkspaceChange(workspace.id);
      setNewWorkspaceName("");
      setIsDialogOpen(false);
      toast({
        title: "Espace créé",
        description: `L'espace de travail "${workspace.name}" a été créé avec succès.`,
      });
    } catch (error) {
      console.error("Error creating workspace:", error);
      toast({
        title: "Erreur",
        description: "Impossible de créer l'espace de travail.",
        variant: "destructive",
      });
    } finally {
      setIsCreating(false);
    }
  };

  if (!isSignedIn) {
    return null;
  }

  return (
    <div className="space-y-2">
      <Label htmlFor="workspace-select" className="text-sm font-medium">
        Espace de travail
      </Label>
      <div className="flex gap-2">
        <Select
          value={selectedWorkspaceId || ""}
          onValueChange={onWorkspaceChange}
          disabled={isLoading}
        >
          <SelectTrigger className="flex-1">
            <SelectValue 
              placeholder={isLoading ? "Chargement..." : "Sélectionner un espace de travail"}
            />
          </SelectTrigger>
          <SelectContent>
            {workspaces.map((workspace) => (
              <SelectItem key={workspace.id} value={workspace.id}>
                <div className="flex items-center gap-2">
                  <Briefcase className="h-4 w-4" />
                  {workspace.name}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" size="icon" disabled={isLoading}>
              <Plus className="h-4 w-4" />
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Créer un nouvel espace de travail</DialogTitle>
              <DialogDescription>
                Donnez un nom à votre nouvel espace de travail pour organiser vos rapports.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="name" className="text-right">
                  Nom
                </Label>
                <Input
                  id="name"
                  value={newWorkspaceName}
                  onChange={(e) => setNewWorkspaceName(e.target.value)}
                  className="col-span-3"
                  placeholder="Ex: Équipe Marketing"
                />
              </div>
            </div>
            <DialogFooter>
              <Button 
                onClick={handleCreateWorkspace} 
                disabled={isCreating || !newWorkspaceName.trim()}
              >
                {isCreating ? "Création..." : "Créer"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
      
      {selectedWorkspaceId && (
        <p className="text-xs text-muted-foreground">
          Le rapport sera ajouté à cet espace de travail
        </p>
      )}
    </div>
  );
} 
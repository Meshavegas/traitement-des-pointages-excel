"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import { useToast } from "@/components/ui/use-toast";
import { Plus, Share2, Users, Trash } from "lucide-react";
import {
  getUserWorkspaces,
  createWorkspace,
  inviteToWorkspace,
} from "@/lib/workspace-db";
import type { Workspace } from "@/lib/workspace-db";

export default function WorkspacesPage() {
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [newWorkspaceName, setNewWorkspaceName] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [selectedWorkspace, setSelectedWorkspace] = useState<Workspace | null>(
    null
  );
  const [isCreating, setIsCreating] = useState(false);
  const [isInviting, setIsInviting] = useState(false);
  const { isLoaded, isSignedIn, user } = useUser();
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    if (!isLoaded || !isSignedIn) return;

    const loadWorkspaces = async () => {
      try {
        const userWorkspaces = await getUserWorkspaces(user.id);
        setWorkspaces(userWorkspaces);
      } catch (error) {
        console.error(
          "Erreur lors du chargement des espaces de travail:",
          error
        );
        toast({
          title: "Erreur",
          description: "Impossible de charger vos espaces de travail.",
          variant: "destructive",
        });
      }
    };

    loadWorkspaces();
  }, [isLoaded, isSignedIn, user, toast]);

  const handleCreateWorkspace = async () => {
    if (!newWorkspaceName.trim()) return;

    setIsCreating(true);
    try {
      const workspace = await createWorkspace(newWorkspaceName);
      setWorkspaces([...workspaces, workspace]);
      setNewWorkspaceName("");
      toast({
        title: "Espace de travail créé",
        description: `L'espace de travail "${workspace.name}" a été créé avec succès.`,
      });
    } catch (error) {
      console.error(
        "Erreur lors de la création de l'espace de travail:",
        error
      );
      toast({
        title: "Erreur",
        description: "Impossible de créer l'espace de travail.",
        variant: "destructive",
      });
    } finally {
      setIsCreating(false);
    }
  };

  const handleInviteUser = async () => {
    if (!inviteEmail.trim() || !selectedWorkspace) return;

    setIsInviting(true);
    try {
      await inviteToWorkspace(selectedWorkspace.id, inviteEmail);
      setInviteEmail("");
      toast({
        title: "Invitation envoyée",
        description: `Une invitation a été envoyée à ${inviteEmail}.`,
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

  if (!isLoaded || !isSignedIn) {
    return (
      <div className="container py-10">
        <Card>
          <CardHeader>
            <CardTitle>Chargement...</CardTitle>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="container py-10">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Mes espaces de travail</h1>
        <Dialog>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" /> Nouvel espace
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Créer un nouvel espace de travail</DialogTitle>
              <DialogDescription>
                Donnez un nom à votre espace de travail pour commencer à
                partager des rapports.
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
                  placeholder="Mon espace de travail"
                />
              </div>
            </div>
            <DialogFooter>
              <Button onClick={handleCreateWorkspace} disabled={isCreating}>
                {isCreating ? "Création..." : "Créer"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {workspaces.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Aucun espace de travail</CardTitle>
            <CardDescription>
              Vous n'avez pas encore créé d'espace de travail. Créez-en un pour
              commencer à partager vos rapports.
            </CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {workspaces.map((workspace) => (
            <Card key={workspace.id}>
              <CardHeader>
                <CardTitle>{workspace.name}</CardTitle>
                <CardDescription>
                  Créé le {new Date(workspace.createdAt).toLocaleDateString()}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center text-sm text-muted-foreground">
                  <Users className="mr-2 h-4 w-4" />
                  Propriétaire:{" "}
                  {workspace.ownerId === user.id ? "Vous" : "Autre utilisateur"}
                </div>
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => router.push(`/workspaces/${workspace.id}`)}
                >
                  Voir les rapports
                </Button>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedWorkspace(workspace)}
                    >
                      <Share2 className="mr-2 h-4 w-4" /> Partager
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Inviter à {workspace.name}</DialogTitle>
                      <DialogDescription>
                        Envoyez une invitation par email pour partager cet
                        espace de travail.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="email" className="text-right">
                          Email
                        </Label>
                        <Input
                          id="email"
                          type="email"
                          value={inviteEmail}
                          onChange={(e) => setInviteEmail(e.target.value)}
                          className="col-span-3"
                          placeholder="collegue@exemple.com"
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button onClick={handleInviteUser} disabled={isInviting}>
                        {isInviting ? "Envoi..." : "Inviter"}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

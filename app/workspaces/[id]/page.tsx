"use client";

import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { ArrowLeft, FileText, Users } from "lucide-react";
import { WorkspaceMembers } from "@/components/workspace-members";
import { WorkspaceOwnershipTransfer } from "@/components/workspace-ownership-transfer";
import {
  getWorkspaceById,
  getWorkspaceMembers,
  getWorkspaceReports,
} from "@/lib/workspace-actions";
import type { Workspace, WorkspaceMember } from "@/lib/workspace-db-core";

interface WorkspacePageProps {
  params: {
    id: string;
  };
}

export default function WorkspacePage({ params }: WorkspacePageProps) {
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [reports, setReports] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { isLoaded, isSignedIn, user } = useUser();
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    if (!isLoaded || !isSignedIn) return;

    const loadWorkspace = async () => {
      try {
        setIsLoading(true);
        const workspaceData = await getWorkspaceById(params.id);
        if (!workspaceData) {
          toast({
            title: "Erreur",
            description: "Espace de travail non trouvé.",
            variant: "destructive",
          });
          router.push("/workspaces");
          return;
        }
        setWorkspace(workspaceData);

        // Charger les rapports associés à cet espace de travail
        const workspaceReports = await getWorkspaceReports(params.id);
        setReports(workspaceReports);
      } catch (error) {
        console.error(
          "Erreur lors du chargement de l'espace de travail:",
          error
        );
        toast({
          title: "Erreur",
          description:
            "Impossible de charger les détails de l'espace de travail.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadWorkspace();
  }, [isLoaded, isSignedIn, params.id, router, toast]);

  const handleMembersUpdated = () => {
    // Recharger les données de l'espace de travail après une mise à jour des membres
    const loadWorkspace = async () => {
      try {
        const workspaceData = await getWorkspaceById(params.id);
        if (workspaceData) {
          setWorkspace(workspaceData);
        }
      } catch (error) {
        console.error(
          "Erreur lors du rechargement de l'espace de travail:",
          error
        );
      }
    };
    loadWorkspace();
  };

  const handleOwnershipTransferred = () => {
    // Rediriger vers la liste des espaces de travail après le transfert de propriété
    toast({
      title: "Propriété transférée",
      description: "Vous n'êtes plus le propriétaire de cet espace de travail.",
    });
    router.push("/workspaces");
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

  if (isLoading) {
    return (
      <div className="container py-10">
        <Card>
          <CardHeader>
            <CardTitle>Chargement de l'espace de travail...</CardTitle>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (!workspace) {
    return (
      <div className="container py-10">
        <Card>
          <CardHeader>
            <CardTitle>Espace de travail non trouvé</CardTitle>
            <CardDescription>
              L'espace de travail que vous recherchez n'existe pas ou vous n'y
              avez pas accès.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => router.push("/workspaces")}>
              <ArrowLeft className="mr-2 h-4 w-4" /> Retour aux espaces de
              travail
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const isOwner = user?.id === workspace.ownerId;

  return (
    <div className="container py-10">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center">
          <Button
            variant="ghost"
            onClick={() => router.push("/workspaces")}
            className="mr-4"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-3xl font-bold">{workspace.name}</h1>
        </div>
        {isOwner && (
          <WorkspaceOwnershipTransfer
            workspace={workspace}
            onOwnershipTransferred={handleOwnershipTransferred}
          />
        )}
      </div>

      <Tabs defaultValue="members">
        <TabsList className="mb-6">
          <TabsTrigger value="members">
            <Users className="mr-2 h-4 w-4" /> Membres
          </TabsTrigger>
          <TabsTrigger value="reports">
            <FileText className="mr-2 h-4 w-4" /> Rapports
          </TabsTrigger>
        </TabsList>

        <TabsContent value="members">
          <WorkspaceMembers
            workspace={workspace}
            onMembersUpdated={handleMembersUpdated}
          />
        </TabsContent>

        <TabsContent value="reports">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <FileText className="mr-2 h-5 w-5" /> Rapports partagés
              </CardTitle>
              <CardDescription>
                Rapports disponibles dans cet espace de travail
              </CardDescription>
            </CardHeader>
            <CardContent>
              {reports.length === 0 ? (
                <div className="text-center py-4">
                  Aucun rapport n'a été ajouté à cet espace de travail.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {reports.map((report) => (
                    <Card key={report.id}>
                      <CardHeader>
                        <CardTitle>
                          {report.name || "Rapport sans nom"}
                        </CardTitle>
                        <CardDescription>
                          Créé le{" "}
                          {new Date(report.createdAt).toLocaleDateString()}
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <Button
                          onClick={() => router.push(`/reports/${report.id}`)}
                          variant="outline"
                          size="sm"
                        >
                          Voir le rapport
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

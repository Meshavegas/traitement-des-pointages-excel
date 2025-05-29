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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { Mail, Check, X } from "lucide-react";
import {
  getPendingInvitations,
  acceptInvitation,
  declineInvitation,
} from "@/lib/workspace-actions";
import type { WorkspaceInvitation } from "@/lib/workspace-db-core";

export default function InvitationsPage() {
  const [invitations, setInvitations] = useState<
    (WorkspaceInvitation & { workspaceName: string })[]
  >([]);
  const [isLoading, setIsLoading] = useState(true);
  const { isLoaded, isSignedIn, user } = useUser();
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    if (!isLoaded || !isSignedIn) return;

    const loadInvitations = async () => {
      try {
        setIsLoading(true);
        const userInvitations = await getPendingInvitations();
        setInvitations(userInvitations);
      } catch (error) {
        console.error("Erreur lors du chargement des invitations:", error);
        toast({
          title: "Erreur",
          description: "Impossible de charger vos invitations.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadInvitations();
  }, [isLoaded, isSignedIn, user, toast]);

  const handleAcceptInvitation = async (token: string) => {
    try {
      if (user) {
        await acceptInvitation(token);
        setInvitations(invitations.filter((inv) => inv.token !== token));
        toast({
          title: "Invitation acceptée",
          description: "Vous avez rejoint l'espace de travail avec succès.",
        });
        router.refresh();
      }
    } catch (error) {
      console.error("Erreur lors de l'acceptation de l'invitation:", error);
      toast({
        title: "Erreur",
        description: "Impossible d'accepter l'invitation.",
        variant: "destructive",
      });
    }
  };

  const handleDeclineInvitation = async (token: string) => {
    try {
      await declineInvitation(token);
      setInvitations(invitations.filter((inv) => inv.token !== token));
      toast({
        title: "Invitation déclinée",
        description: "Vous avez décliné l'invitation.",
      });
    } catch (error) {
      console.error("Erreur lors du refus de l'invitation:", error);
      toast({
        title: "Erreur",
        description: "Impossible de décliner l'invitation.",
        variant: "destructive",
      });
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
      <h1 className="text-3xl font-bold mb-6">Mes invitations</h1>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Mail className="mr-2 h-5 w-5" /> Invitations aux espaces de travail
          </CardTitle>
          <CardDescription>
            Gérez les invitations que vous avez reçues pour rejoindre des
            espaces de travail
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-4">
              Chargement des invitations...
            </div>
          ) : invitations.length === 0 ? (
            <div className="text-center py-4">Aucune invitation en attente</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Espace de travail</TableHead>
                  <TableHead>Rôle</TableHead>
                  <TableHead>Date d'expiration</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invitations.map((invitation) => (
                  <TableRow key={invitation.id}>
                    <TableCell className="font-medium">
                      {invitation.workspaceName}
                    </TableCell>
                    <TableCell>
                      {invitation.role === "editor" ? "Éditeur" : "Lecteur"}
                    </TableCell>
                    <TableCell>
                      {new Date(invitation.expiresAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            handleAcceptInvitation(invitation.token)
                          }
                        >
                          <Check className="mr-2 h-4 w-4" /> Accepter
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            handleDeclineInvitation(invitation.token)
                          }
                        >
                          <X className="mr-2 h-4 w-4" /> Décliner
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

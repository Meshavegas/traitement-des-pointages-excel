"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Users, Mail, ChevronDown } from "lucide-react";
import {
  getUserWorkspaces,
  getPendingInvitations,
} from "@/lib/workspace-actions";
import type { Workspace } from "@/lib/workspace-db-core";

export function WorkspaceNav() {
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [invitationCount, setInvitationCount] = useState(0);
  const { isLoaded, isSignedIn, user } = useUser();
  const pathname = usePathname();

  useEffect(() => {
    if (!isLoaded || !isSignedIn) return;

    const loadWorkspaces = async () => {
      try {
        const userWorkspaces = await getUserWorkspaces();
        setWorkspaces(userWorkspaces);
      } catch (error) {
        console.error(
          "Erreur lors du chargement des espaces de travail:",
          error
        );
      }
    };

    const loadInvitations = async () => {
      try {
        const userInvitations = await getPendingInvitations();
        setInvitationCount(userInvitations.length);
      } catch (error) {
        console.error("Erreur lors du chargement des invitations:", error);
      }
    };

    loadWorkspaces();
    loadInvitations();
  }, [isLoaded, isSignedIn, user]);

  if (!isLoaded || !isSignedIn) {
    return null;
  }

  return (
    <div className="flex items-center space-x-4">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm">
            <Users className="mr-2 h-4 w-4" />
            Espaces de travail
            <ChevronDown className="ml-2 h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>Mes espaces de travail</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {workspaces.length === 0 ? (
            <DropdownMenuItem disabled>
              Aucun espace de travail
            </DropdownMenuItem>
          ) : (
            workspaces.map((workspace) => (
              <DropdownMenuItem key={workspace.id} asChild>
                <Link href={`/workspaces/${workspace.id}`}>
                  {workspace.name}
                </Link>
              </DropdownMenuItem>
            ))
          )}
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild>
            <Link href="/workspaces">Tous les espaces de travail</Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href="/workspaces/invitations" className="flex items-center">
              Invitations
              {invitationCount > 0 && (
                <Badge variant="secondary" className="ml-2">
                  {invitationCount}
                </Badge>
              )}
            </Link>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

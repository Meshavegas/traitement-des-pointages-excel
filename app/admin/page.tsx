import { EmailStatus } from "@/components/email-status";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Database, Users, Mail, Settings } from "lucide-react";

export default function AdminPage() {
  return (
    <div className="container py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Administration</h1>
        <p className="text-muted-foreground">
          Gestion de la configuration et monitoring de l'application
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Configuration Email */}
        <EmailStatus className="md:col-span-2 lg:col-span-1" />

        {/* Statistiques Base de Données */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Base de Données
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Type</span>
              <Badge variant="default">PostgreSQL</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Statut</span>
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 bg-green-500 rounded-full"></div>
                <span className="text-sm text-green-600">Connectée</span>
              </div>
            </div>
            <div className="text-sm text-muted-foreground">
              Tables workspaces créées automatiquement
            </div>
          </CardContent>
        </Card>

        {/* Statistiques Utilisateurs */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Utilisateurs
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Authentification</span>
              <Badge variant="default">Clerk</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Workspaces</span>
              <span className="text-sm text-muted-foreground">Actifs</span>
            </div>
            <div className="text-sm text-muted-foreground">
              Gestion des rôles et invitations
            </div>
          </CardContent>
        </Card>

        {/* Configuration Système */}
        <Card className="md:col-span-2 lg:col-span-3">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Configuration Système
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <div className="space-y-2">
                <h4 className="font-medium">Variables d'Environnement</h4>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span>DATABASE_URL</span>
                    <Badge variant={process.env.DATABASE_URL ? "default" : "destructive"}>
                      {process.env.DATABASE_URL ? "Configurée" : "Manquante"}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>NEXT_PUBLIC_APP_URL</span>
                    <Badge variant={process.env.NEXT_PUBLIC_APP_URL ? "default" : "secondary"}>
                      {process.env.NEXT_PUBLIC_APP_URL ? "Configurée" : "Par défaut"}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>RESEND_API_KEY</span>
                    <Badge variant={process.env.RESEND_API_KEY ? "default" : "secondary"}>
                      {process.env.RESEND_API_KEY ? "Configurée" : "Non configurée"}
                    </Badge>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="font-medium">Fonctionnalités</h4>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span>Upload de rapports</span>
                    <Badge variant="default">Actif</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Workspaces</span>
                    <Badge variant="default">Actif</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Invitations</span>
                    <Badge variant="default">Actif</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Export Excel</span>
                    <Badge variant="default">Actif</Badge>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="font-medium">Instructions</h4>
                <div className="text-sm text-muted-foreground space-y-1">
                  <p>• Configurez Resend : <code>npm run setup-resend</code></p>
                  <p>• Testez les emails : <code>npm run test-resend</code></p>
                  <p>• Documentation : <code>WORKSPACE_INTEGRATION.md</code></p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 
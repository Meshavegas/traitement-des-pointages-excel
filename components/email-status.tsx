"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Mail, CheckCircle, AlertCircle, Settings } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

interface EmailStatusProps {
  className?: string;
}

export function EmailStatus({ className }: EmailStatusProps) {
  const [emailStatus, setEmailStatus] = useState<{
    isConfigured: boolean;
    service: 'resend' | 'mock';
    fromEmail?: string;
  }>({ isConfigured: false, service: 'mock' });
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    checkEmailConfiguration();
  }, []);

  const checkEmailConfiguration = async () => {
    try {
      setIsLoading(true);
      // Simuler une vérification de la configuration
      // En production, ceci ferait un appel API pour vérifier la config
      const hasResendKey = process.env.NEXT_PUBLIC_RESEND_CONFIGURED === 'true';
      const fromEmail = process.env.NEXT_PUBLIC_FROM_EMAIL;
      
      setEmailStatus({
        isConfigured: hasResendKey,
        service: hasResendKey ? 'resend' : 'mock',
        fromEmail: fromEmail || 'noreply@localhost'
      });
    } catch (error) {
      console.error('Error checking email configuration:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTestEmail = async () => {
    try {
      const response = await fetch('/api/test-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ type: 'welcome' }),
      });

      const data = await response.json();

      if (response.ok) {
        toast({
          title: "Email de test envoyé",
          description: `Email envoyé via ${data.service} (ID: ${data.emailId})`,
        });
      } else {
        throw new Error(data.error || 'Erreur inconnue');
      }
    } catch (error) {
      toast({
        title: "Erreur",
        description: error instanceof Error ? error.message : "Impossible de tester l'envoi d'email",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Configuration Email
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">Vérification...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mail className="h-5 w-5" />
          Configuration Email
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Service d'email</span>
          <Badge variant={emailStatus.service === 'resend' ? 'default' : 'secondary'}>
            {emailStatus.service === 'resend' ? 'Resend' : 'Mock (Développement)'}
          </Badge>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Statut</span>
          <div className="flex items-center gap-2">
            {emailStatus.isConfigured ? (
              <>
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span className="text-sm text-green-600">Configuré</span>
              </>
            ) : (
              <>
                <AlertCircle className="h-4 w-4 text-yellow-500" />
                <span className="text-sm text-yellow-600">Mode développement</span>
              </>
            )}
          </div>
        </div>

        {emailStatus.fromEmail && (
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Email expéditeur</span>
            <span className="text-sm text-muted-foreground">{emailStatus.fromEmail}</span>
          </div>
        )}

        <div className="pt-4 space-y-2">
          {!emailStatus.isConfigured && (
            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md">
              <p className="text-sm text-yellow-800">
                📧 Les emails sont simulés en mode développement. 
                Configurez Resend pour l'envoi réel d'emails.
              </p>
            </div>
          )}

          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleTestEmail}
            >
              <Mail className="h-4 w-4 mr-2" />
              Tester l'envoi
            </Button>
            
            {!emailStatus.isConfigured && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  toast({
                    title: "Configuration Resend",
                    description: "Exécutez 'npm run setup-resend' pour configurer Resend",
                  });
                }}
              >
                <Settings className="h-4 w-4 mr-2" />
                Configurer
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
} 
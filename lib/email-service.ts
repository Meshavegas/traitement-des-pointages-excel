import type { WorkspaceInvitation } from './postgres-workspace';

// Configuration Resend
interface EmailOptions {
  to: string;
  subject: string;
  html: string;
}

// Fonction pour envoyer un email (Resend ou Mock selon la configuration)
async function sendEmail(options: EmailOptions) {
  // Si Resend est configuré, l'utiliser
  if (process.env.RESEND_API_KEY) {
    try {
      // Import dynamique de Resend pour éviter les erreurs si pas installé
      const { Resend } = await import('resend');
      const resend = new Resend(process.env.RESEND_API_KEY);

      const { data, error } = await resend.emails.send({
        from: process.env.RESEND_FROM_EMAIL || 'Pointages <noreply@yourdomain.com>',
        to: [options.to],
        subject: options.subject,
        html: options.html,
      });

      if (error) {
        throw new Error(`Resend error: ${error.message}`);
      }

      console.log(`📧 Email sent via Resend to ${options.to}: ${data?.id}`);
      return { success: true, id: data?.id };
    } catch (error) {
      console.error('❌ Error sending email via Resend:', error);
      // Fallback vers le mock en cas d'erreur
      return sendEmailMock(options);
    }
  } else {
    // Utiliser le service mock si Resend n'est pas configuré
    return sendEmailMock(options);
  }
}

// Fonction mock pour le développement
async function sendEmailMock(options: EmailOptions) {
  console.log(`📧 Email mock sent to ${options.to}`);
  console.log(`Subject: ${options.subject}`);
  console.log(`HTML preview: ${options.html.substring(0, 200)}...`);
  return { success: true, id: 'mock-email-id' };
}

// Fonction pour envoyer une invitation par email
export async function sendWorkspaceInvitation(
  invitation: WorkspaceInvitation,
  workspaceName: string,
  inviterName: string
) {
  const inviteUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/workspaces/invitations?token=${invitation.token}`;
  
  const emailHtml = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Invitation à rejoindre un espace de travail</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
          .button { 
            display: inline-block; 
            background: #007bff; 
            color: white; 
            padding: 12px 24px; 
            text-decoration: none; 
            border-radius: 6px; 
            margin: 20px 0; 
          }
          .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; color: #666; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Invitation à rejoindre un espace de travail</h1>
          </div>
          
          <p>Bonjour,</p>
          
          <p><strong>${inviterName}</strong> vous invite à rejoindre l'espace de travail <strong>"${workspaceName}"</strong> sur notre plateforme de traitement des pointages.</p>
          
          <p>Vous serez ajouté avec le rôle de <strong>${invitation.role === 'editor' ? 'Éditeur' : 'Lecteur'}</strong>.</p>
          
          <a href="${inviteUrl}" class="button">Accepter l'invitation</a>
          
          <p>Ou copiez ce lien dans votre navigateur :</p>
          <p><a href="${inviteUrl}">${inviteUrl}</a></p>
          
          <p>Cette invitation expire le ${new Date(invitation.expiresAt).toLocaleDateString('fr-FR')}.</p>
          
          <div class="footer">
            <p>Si vous n'attendiez pas cette invitation, vous pouvez ignorer cet email.</p>
            <p>Cet email a été envoyé automatiquement, merci de ne pas y répondre.</p>
          </div>
        </div>
      </body>
    </html>
  `;

  try {
    const result = await sendEmail({
      to: invitation.email,
      subject: `Invitation à rejoindre l'espace de travail "${workspaceName}"`,
      html: emailHtml,
    });

    console.log(`✅ Invitation email sent to ${invitation.email} for workspace ${workspaceName}`);
    return result;
  } catch (error) {
    console.error('❌ Error sending invitation email:', error);
    throw new Error('Failed to send invitation email');
  }
}

// Fonction pour envoyer un email de bienvenue lors de la création d'un workspace
export async function sendWorkspaceCreatedEmail(
  userEmail: string,
  userName: string,
  workspaceName: string
) {
  const emailHtml = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Espace de travail créé avec succès</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #e8f5e8; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
          .button { 
            display: inline-block; 
            background: #28a745; 
            color: white; 
            padding: 12px 24px; 
            text-decoration: none; 
            border-radius: 6px; 
            margin: 20px 0; 
          }
          .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; color: #666; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎉 Espace de travail créé avec succès !</h1>
          </div>
          
          <p>Bonjour ${userName},</p>
          
          <p>Votre espace de travail <strong>"${workspaceName}"</strong> a été créé avec succès.</p>
          
          <p>Vous pouvez maintenant :</p>
          <ul>
            <li>Uploader des rapports de pointage</li>
            <li>Inviter des collègues à rejoindre votre espace</li>
            <li>Partager et collaborer sur les données de pointage</li>
          </ul>
          
          <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/workspaces" class="button">Accéder à mes espaces de travail</a>
          
          <div class="footer">
            <p>Merci d'utiliser notre plateforme de traitement des pointages !</p>
          </div>
        </div>
      </body>
    </html>
  `;

  try {
    const result = await sendEmail({
      to: userEmail,
      subject: `Espace de travail "${workspaceName}" créé avec succès`,
      html: emailHtml,
    });

    console.log(`✅ Workspace created email sent to ${userEmail}`);
    return result;
  } catch (error) {
    console.error('❌ Error sending workspace created email:', error);
    throw new Error('Failed to send workspace created email');
  }
} 
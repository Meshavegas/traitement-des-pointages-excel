# 🚀 Guide d'Installation Rapide - Resend

## Installation Automatique

### 1. Exécuter le Script d'Installation
```bash
npm run setup-resend
```

Ce script va :
- ✅ Installer Resend automatiquement
- ✅ Créer/modifier le fichier `.env.local`
- ✅ Configurer les variables d'environnement
- ✅ Créer un script de test

### 2. Configurer Votre Compte Resend

#### Créer un Compte
1. Allez sur [https://resend.com](https://resend.com)
2. Créez un compte gratuit
3. Vérifiez votre email

#### Vérifier Votre Domaine
1. Dans le dashboard Resend, allez dans **Domains**
2. Cliquez sur **Add Domain**
3. Entrez votre domaine (ex: `monentreprise.com`)
4. Suivez les instructions DNS
5. Attendez la vérification (peut prendre quelques minutes)

#### Générer une Clé API
1. Allez dans **API Keys**
2. Cliquez sur **Create API Key**
3. Donnez un nom (ex: "Pointages App")
4. Copiez la clé générée

### 3. Configurer les Variables d'Environnement

Éditez le fichier `.env.local` :

```env
# Remplacez par votre vraie clé API
RESEND_API_KEY=re_123456789_abcdefghijklmnop

# Remplacez par votre domaine vérifié
RESEND_FROM_EMAIL=Pointages <noreply@monentreprise.com>

# URL de votre application (pour les liens dans les emails)
NEXT_PUBLIC_APP_URL=https://monapp.monentreprise.com
```

### 4. Tester la Configuration

```bash
npm run test-resend
```

Ou depuis l'interface web :
1. Allez sur `/admin`
2. Cliquez sur **Tester l'envoi** dans la section Email
3. Vérifiez votre boîte mail

## Installation Manuelle

Si vous préférez installer manuellement :

### 1. Installer Resend
```bash
npm install resend --legacy-peer-deps
```

### 2. Configurer les Variables
Créez ou modifiez `.env.local` :
```env
RESEND_API_KEY=your_api_key_here
RESEND_FROM_EMAIL=Your App <noreply@yourdomain.com>
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 3. Redémarrer l'Application
```bash
npm run dev
```

## Vérification du Fonctionnement

### ✅ Indicateurs de Succès

1. **Console de développement** : Aucune erreur d'import Resend
2. **Page `/admin`** : Badge "Resend" au lieu de "Mock"
3. **Test d'email** : Email reçu dans votre boîte
4. **Logs** : Messages `📧 Email sent via Resend`

### ❌ Problèmes Courants

#### Erreur : "Cannot find module 'resend'"
```bash
npm install resend --legacy-peer-deps
```

#### Erreur : "Invalid API key"
- Vérifiez que votre clé API est correcte
- Assurez-vous qu'elle commence par `re_`

#### Erreur : "Email address not verified"
- Vérifiez votre domaine sur Resend
- Utilisez un email avec le domaine vérifié

#### Emails non reçus
- Vérifiez vos spams
- Testez avec un autre email
- Vérifiez les logs Resend dans le dashboard

## Fonctionnalités Activées

Une fois Resend configuré, ces fonctionnalités utilisent l'envoi réel :

### 🎯 Invitations de Workspace
- Emails HTML professionnels
- Liens d'activation sécurisés
- Expiration automatique (7 jours)

### 🎉 Emails de Bienvenue
- Confirmation de création d'espace
- Instructions d'utilisation
- Liens directs vers l'application

### 📊 Monitoring
- Logs détaillés dans la console
- Statistiques dans le dashboard Resend
- Gestion des bounces et plaintes

## Limites et Quotas

### Plan Gratuit Resend
- **3 000 emails/mois**
- **100 emails/jour**
- **1 domaine vérifié**

### Recommandations
- Surveillez votre usage dans le dashboard
- Configurez des webhooks pour les bounces
- Utilisez des templates pour la cohérence

## Support

### Logs et Debugging
- Console navigateur : Erreurs côté client
- Console serveur : Logs d'envoi détaillés
- Dashboard Resend : Statistiques et erreurs

### Documentation
- [Documentation Resend](https://resend.com/docs)
- [Guide des webhooks](https://resend.com/docs/webhooks)
- [Exemples d'intégration](https://resend.com/docs/examples)

### Contact
- Support Resend : [help@resend.com](mailto:help@resend.com)
- Documentation locale : `WORKSPACE_INTEGRATION.md`

---

🎉 **Félicitations !** Votre application peut maintenant envoyer de vrais emails professionnels via Resend. 
# 📊 Traitement des Pointages Excel

Application Next.js pour traiter et analyser les données de pointage des employés à partir de fichiers Excel.

## ✨ Fonctionnalités

### 🎯 Gestion des Rapports
- **Upload Excel** : Import automatique de fichiers XLSX
- **Traitement intelligent** : Calcul automatique des heures de travail
- **Export personnalisé** : Excel et CSV avec mise en forme
- **Visualisation** : Tableaux et graphiques interactifs

### 👥 Workspaces Collaboratifs
- **Espaces de travail** : Organisation par équipe/projet
- **Invitations** : Partage sécurisé avec collègues
- **Rôles définis** : Propriétaire, Éditeur, Lecteur
- **Création automatique** : Workspace par défaut pour nouveaux utilisateurs

### 📧 Notifications Email
- **Service intégré** : Resend pour l'envoi professionnel
- **Invitations automatiques** : Templates HTML responsive
- **Emails de bienvenue** : Confirmation de création d'espaces
- **Mode développement** : Service mock pour les tests

### 🔐 Sécurité & Auth
- **Authentification** : Clerk pour la gestion des utilisateurs
- **Base de données** : PostgreSQL avec migrations automatiques
- **Contrôle d'accès** : Permissions par workspace

## 🚀 Installation Rapide

### 1. Cloner le Projet
```bash
git clone <repository-url>
cd traitement-des-pointages-excel
npm install --legacy-peer-deps
```

### 2. Configuration Base
```bash
# Copier le fichier d'environnement
cp .env.example .env.local

# Configurer les variables requises
DATABASE_URL=postgresql://...
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=...
CLERK_SECRET_KEY=...
```

### 3. Lancer l'Application
```bash
npm run dev
```

### 4. Configurer les Emails (Optionnel)
```bash
# Installation automatique de Resend
npm run setup-resend

# Tester la configuration
npm run test-resend
```

## 📋 Configuration Détaillée

### Variables d'Environnement Requises
```env
# Base de données PostgreSQL
DATABASE_URL=postgresql://user:password@host:port/database

# Authentification Clerk
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...

# Application
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Variables Optionnelles (Emails)
```env
# Service d'email Resend
RESEND_API_KEY=re_...
RESEND_FROM_EMAIL=App <noreply@yourdomain.com>
```

## 🏗️ Architecture

### Stack Technique
- **Frontend** : Next.js 15, React 19, TypeScript
- **UI** : Tailwind CSS, Radix UI, Lucide Icons
- **Backend** : Next.js API Routes, Server Actions
- **Base de données** : PostgreSQL avec requêtes SQL natives
- **Auth** : Clerk pour l'authentification
- **Email** : Resend pour l'envoi professionnel
- **Excel** : SheetJS pour le traitement des fichiers

### Structure des Données
```
Workspaces
├── Members (Owner, Editor, Viewer)
├── Invitations (Token-based, 7 days expiry)
└── Reports
    ├── Employees
    ├── Attendance Records
    └── Processed Records
```

## 📖 Guides d'Utilisation

### Pour les Utilisateurs
1. **Premier Upload** : Workspace créé automatiquement
2. **Sélection d'Espace** : Choisir le workspace de destination
3. **Invitation d'Équipe** : Partager via email
4. **Export de Données** : Excel/CSV formatés

### Pour les Administrateurs
- **Page `/admin`** : Monitoring et configuration
- **Gestion des emails** : Test et configuration Resend
- **Statistiques système** : Base de données et utilisateurs

## 📚 Documentation

### Guides Spécialisés
- **[Guide Workspaces](WORKSPACE_INTEGRATION.md)** : Intégration complète
- **[Installation Resend](QUICK_START_RESEND.md)** : Configuration emails
- **[Résumé Technique](IMPLEMENTATION_SUMMARY.md)** : Détails d'implémentation

### Scripts Utiles
```bash
npm run setup-resend    # Installation automatique Resend
npm run test-resend     # Test de la configuration email
npm run dev            # Développement
npm run build          # Build de production
```

## 🔧 Développement

### Structure du Projet
```
├── app/                 # Pages et API routes
├── components/          # Composants React
├── lib/                # Logique métier et utilitaires
├── scripts/            # Scripts d'installation et test
└── docs/               # Documentation
```

### Fonctionnalités Clés
- **Upload intelligent** : Détection automatique des formats Excel
- **Calcul des heures** : Gestion des quarts de jour/nuit
- **Export formaté** : Disposition comme l'interface utilisateur
- **Emails automatiques** : Templates HTML professionnels
- **Gestion d'erreurs** : Fallback gracieux et logs détaillés

## 🚀 Déploiement

### Prérequis Production
1. **Base de données PostgreSQL** configurée
2. **Domaine vérifié** sur Resend (pour emails)
3. **Variables d'environnement** configurées
4. **Build** testé localement

### Plateformes Recommandées
- **Vercel** : Déploiement Next.js optimisé
- **Railway/Render** : PostgreSQL hébergé
- **Neon** : Base de données serverless

## 📊 Monitoring

### Logs et Debugging
- **Console serveur** : Logs détaillés des opérations
- **Dashboard Resend** : Statistiques d'envoi d'emails
- **Page Admin** : Monitoring système intégré

### Métriques Importantes
- Taux de succès des uploads
- Temps de traitement des fichiers
- Taux de délivrance des emails
- Utilisation des workspaces

## 🤝 Contribution

### Développement Local
1. Fork du projet
2. Branche feature : `git checkout -b feature/nom-feature`
3. Tests et validation
4. Pull Request avec description détaillée

### Standards
- **TypeScript** pour le typage
- **ESLint** pour la qualité du code
- **Documentation** pour les nouvelles fonctionnalités
- **Tests** pour les fonctions critiques

## 📄 Licence

Ce projet est sous licence MIT. Voir le fichier `LICENSE` pour plus de détails.

---

## 🎯 Prochaines Fonctionnalités

- **Notifications temps réel** : WebSockets pour les updates
- **Templates de rapports** : Modèles prédéfinis
- **Statistiques avancées** : Analytics et graphiques
- **API publique** : Intégration avec systèmes externes
- **Mobile app** : Application React Native

---

**Développé avec ❤️ pour simplifier la gestion des pointages d'équipe.** 
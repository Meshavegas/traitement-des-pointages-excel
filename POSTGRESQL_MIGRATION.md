# Migration vers PostgreSQL (Neon)

## Configuration Terminée ✅

L'application a été migrée de MongoDB vers PostgreSQL (Neon) pour une meilleure performance et stabilité.

## Fichiers Créés/Modifiés

### Nouveaux Fichiers PostgreSQL
- `lib/postgres-config.ts` - Configuration et connexion PostgreSQL
- `lib/postgres-db.ts` - Gestion des rapports avec PostgreSQL
- `lib/postgres-workspace.ts` - Gestion des espaces de travail avec PostgreSQL

### Fichiers Modifiés
- `lib/actions.ts` - Utilise maintenant PostgreSQL pour les rapports
- `lib/workspace-actions.ts` - Utilise maintenant PostgreSQL pour les espaces de travail
- `.env` - Ajout de la variable `DATABASE_URL`

## Configuration Requise

### 1. Variable d'Environnement
Ajoutez votre URL de connexion PostgreSQL (Neon) dans le fichier `.env` :

```env
DATABASE_URL=postgresql://neondb_owner:npg_jwbieAcJQ63B@ep-still-silence-a9di8tqx-pooler.gwc.azure.neon.tech/neondb?sslmode=require
```

### 2. Installation des Dépendances
Installez le driver PostgreSQL :

```bash
npm install pg @types/pg
```

### 3. Structure de la Base de Données

L'application créera automatiquement les tables suivantes :

#### Tables Principales
- `reports` - Rapports d'assiduité
- `employees` - Employés par rapport
- `attendance_records` - Enregistrements de pointage
- `processed_records` - Données traitées

#### Tables Espaces de Travail
- `workspaces` - Espaces de travail partagés
- `workspace_members` - Membres des espaces de travail
- `workspace_invitations` - Invitations en attente
- `workspace_reports` - Liaison rapports-espaces de travail

### 4. Index Automatiques

L'application créera automatiquement des index optimisés pour :
- Recherche par utilisateur
- Recherche par rapport
- Recherche par espace de travail
- Performance des requêtes

## Avantages de PostgreSQL

### ✅ Performance Supérieure
- **Requêtes SQL optimisées** : Utilisation native de SQL pour des requêtes complexes
- **Index avancés** : Support des index partiels, composites et expressionnels
- **Transactions ACID** : Garanties de consistance des données
- **Joins efficaces** : Relations entre tables optimisées

### ✅ Écosystème Mature
- **Outils d'administration** : pgAdmin, DBeaver, etc.
- **Extensions** : Possibilité d'ajouter des fonctionnalités avancées
- **Monitoring** : Outils de surveillance intégrés
- **Backup/Restore** : Solutions robustes de sauvegarde

### ✅ Neon Cloud Platform
- **Serverless** : Mise à l'échelle automatique
- **Branching** : Branches de base de données pour le développement
- **Haute disponibilité** : Réplication automatique
- **Monitoring intégré** : Métriques et logs en temps réel

## Structure des Tables

### Table `reports`
```sql
CREATE TABLE reports (
  id VARCHAR(255) PRIMARY KEY,
  file_name VARCHAR(255) NOT NULL,
  upload_date TIMESTAMP NOT NULL,
  date_range_start VARCHAR(50) NOT NULL,
  date_range_end VARCHAR(50) NOT NULL,
  user_id VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Table `employees`
```sql
CREATE TABLE employees (
  id VARCHAR(255) NOT NULL,
  report_id VARCHAR(255) NOT NULL,
  first_name VARCHAR(255) NOT NULL,
  department VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id, report_id),
  FOREIGN KEY (report_id) REFERENCES reports(id) ON DELETE CASCADE
);
```

### Tables d'Espaces de Travail
```sql
CREATE TABLE workspaces (
  id VARCHAR(255) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  owner_id VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE workspace_members (
  id VARCHAR(255) PRIMARY KEY,
  workspace_id VARCHAR(255) NOT NULL,
  user_id VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL DEFAULT 'viewer',
  added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE,
  UNIQUE(workspace_id, user_id)
);
```

## Migration des Données

### Données Existantes
Les données MongoDB existantes ne sont **PAS** automatiquement migrées. Si vous avez des données importantes :

1. **Exportez** les données depuis MongoDB
2. **Transformez** au format PostgreSQL
3. **Importez** dans Neon PostgreSQL

### Script de Migration (Optionnel)
Un script de migration peut être créé pour transférer les données existantes de MongoDB vers PostgreSQL.

## Test de la Configuration

### 1. Vérification de la Connexion
L'application affichera dans les logs :
```
✅ Connected to PostgreSQL (Neon)
✅ PostgreSQL tables and indexes initialized
```

### 2. Test des Fonctionnalités
- Upload de fichiers Excel
- Création d'espaces de travail
- Invitations d'utilisateurs
- Génération de rapports

## Monitoring et Maintenance

### Neon Dashboard
- Surveillez les performances des requêtes
- Gérez les connexions
- Analysez l'utilisation des ressources
- Configurez les alertes

### Logs de l'Application
- Connexions PostgreSQL : `✅ Connected to PostgreSQL (Neon)`
- Opérations réussies : `✅ Report saved to PostgreSQL`
- Erreurs : `❌ Error saving report to PostgreSQL`

## Sécurité

### Bonnes Pratiques Appliquées
- **Connexions SSL** : Toutes les connexions sont chiffrées
- **Pool de connexions** : Gestion optimisée des connexions
- **Paramètres préparés** : Protection contre l'injection SQL
- **Transactions** : Opérations atomiques pour la consistance

## Performance

### Optimisations Incluses
- **Index automatiques** : Créés sur les colonnes fréquemment utilisées
- **Pool de connexions** : Réutilisation des connexions
- **Requêtes optimisées** : Utilisation de joins au lieu de requêtes multiples
- **Transactions groupées** : Insertion en lot pour de meilleures performances

## Développement

### Commandes Utiles
```bash
# Connexion à la base de données
psql "postgresql://neondb_owner:npg_jwbieAcJQ63B@ep-still-silence-a9di8tqx-pooler.gwc.azure.neon.tech/neondb?sslmode=require"

# Voir les tables
\dt

# Voir la structure d'une table
\d reports

# Voir les index
\di
```

### Environnements de Développement
Neon permet de créer des branches de base de données pour :
- Tests unitaires
- Développement de fonctionnalités
- Staging/Production

## Troubleshooting

### Problèmes Courants

1. **Erreur de connexion**
   - Vérifiez l'URL de connexion
   - Assurez-vous que SSL est activé

2. **Performances lentes**
   - Vérifiez les index
   - Analysez les requêtes lentes dans Neon

3. **Erreurs de transaction**
   - Vérifiez les contraintes de clés étrangères
   - Assurez-vous de la validité des données 
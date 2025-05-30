import Database from "better-sqlite3";

// Configuration de la base de données selon l'environnement
export function createDatabase() {
  let db: Database.Database;
  
  if (process.env.NODE_ENV === "production") {
    // En production, utiliser une base de données en mémoire temporaire
    // TODO: Remplacer par une vraie base de données cloud (PostgreSQL, etc.)
    console.warn("⚠️  Using in-memory database in production. Data will not persist!");
    db = new Database(":memory:");
  } else {
    // En développement, utiliser un fichier local
    db = new Database("attendance.db");
  }
  
  return db;
}

// Initialiser les tables
export function initializeTables(db: Database.Database) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS reports (
      id TEXT PRIMARY KEY,
      fileName TEXT NOT NULL,
      uploadDate TEXT NOT NULL,
      dateRangeStart TEXT NOT NULL,
      dateRangeEnd TEXT NOT NULL,
      userId TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS employees (
      id TEXT NOT NULL,
      reportId TEXT NOT NULL,
      firstName TEXT NOT NULL,
      department TEXT NOT NULL,
      FOREIGN KEY (reportId) REFERENCES reports(id) ON DELETE CASCADE,
      PRIMARY KEY (id, reportId)
    );

    CREATE TABLE IF NOT EXISTS attendance_records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      reportId TEXT NOT NULL,
      employeeId TEXT NOT NULL,
      firstName TEXT NOT NULL,
      department TEXT NOT NULL,
      date TEXT NOT NULL,
      time TEXT NOT NULL,
      timestamp TEXT NOT NULL,
      FOREIGN KEY (reportId) REFERENCES reports(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS processed_records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      reportId TEXT NOT NULL,
      employeeId TEXT NOT NULL,
      firstName TEXT NOT NULL,
      department TEXT NOT NULL,
      date TEXT NOT NULL,
      arrivalTime TEXT NOT NULL,
      departureTime TEXT NOT NULL,
      duration TEXT NOT NULL,
      punchCount INTEGER NOT NULL,
      othersPunch TEXT NOT NULL,
      FOREIGN KEY (reportId) REFERENCES reports(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS workspaces (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      ownerId TEXT NOT NULL,
      createdAt TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS workspace_members (
      id TEXT PRIMARY KEY,
      workspaceId TEXT NOT NULL,
      userId TEXT NOT NULL,
      role TEXT NOT NULL,
      addedAt TEXT NOT NULL,
      FOREIGN KEY (workspaceId) REFERENCES workspaces(id) ON DELETE CASCADE,
      UNIQUE(workspaceId, userId)
    );

    CREATE TABLE IF NOT EXISTS workspace_invitations (
      id TEXT PRIMARY KEY,
      workspaceId TEXT NOT NULL,
      email TEXT NOT NULL,
      token TEXT NOT NULL,
      status TEXT NOT NULL,
      createdAt TEXT NOT NULL,
      expiresAt TEXT NOT NULL,
      role TEXT DEFAULT 'viewer',
      FOREIGN KEY (workspaceId) REFERENCES workspaces(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS workspace_reports (
      workspaceId TEXT NOT NULL,
      reportId TEXT NOT NULL,
      FOREIGN KEY (workspaceId) REFERENCES workspaces(id) ON DELETE CASCADE,
      FOREIGN KEY (reportId) REFERENCES reports(id) ON DELETE CASCADE,
      PRIMARY KEY (workspaceId, reportId)
    );
  `);
}

// Instance globale de la base de données
let dbInstance: Database.Database | null = null;

export function getDatabase(): Database.Database {
  if (!dbInstance) {
    dbInstance = createDatabase();
    initializeTables(dbInstance);
  }
  return dbInstance;
} 
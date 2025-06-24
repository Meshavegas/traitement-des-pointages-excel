import { Pool, PoolClient } from 'pg';

// Configuration PostgreSQL
const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://neondb_owner:npg_jwbieAcJQ63B@ep-still-silence-a9di8tqx-pooler.gwc.azure.neon.tech/neondb?sslmode=require';

if (!DATABASE_URL) {
  throw new Error('Please define the DATABASE_URL environment variable');
}

// Pool de connexions PostgreSQL
let pool: Pool | null = null;

export function getPool(): Pool {
  if (!pool) {
    pool = new Pool({
      connectionString: DATABASE_URL,
      ssl: {
        rejectUnauthorized: false
      },
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    });

    pool.on('connect', () => {
      console.log('✅ Connected to PostgreSQL (Neon)');
    });

    pool.on('error', (err) => {
      console.error('❌ PostgreSQL connection error:', err);
    });
  }
  return pool;
}

// Helper function to execute queries
export async function query(text: string, params?: any[]): Promise<any> {
  const pool = getPool();
  const client = await pool.connect();
  try {
    const result = await client.query(text, params);
    return result;
  } finally {
    client.release();
  }
}

// Helper function to execute transactions
export async function transaction<T>(callback: (client: PoolClient) => Promise<T>): Promise<T> {
  const pool = getPool();
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

// Table names
export const TABLES = {
  REPORTS: 'reports',
  EMPLOYEES: 'employees',
  ATTENDANCE_RECORDS: 'attendance_records',
  PROCESSED_RECORDS: 'processed_records',
  WORKSPACES: 'workspaces',
  WORKSPACE_MEMBERS: 'workspace_members',
  WORKSPACE_INVITATIONS: 'workspace_invitations',
  WORKSPACE_REPORTS: 'workspace_reports',
} as const;

// Types for PostgreSQL rows
export interface ReportRow {
  id: string;
  file_name: string;
  upload_date: string;
  date_range_start: string;
  date_range_end: string;
  user_id: string;
  created_at: Date;
  updated_at: Date;
}

export interface EmployeeRow {
  id: string;
  report_id: string;
  first_name: string;
  department: string;
  created_at: Date;
}

export interface AttendanceRecordRow {
  id: number;
  report_id: string;
  employee_id: string;
  first_name: string;
  department: string;
  date: string;
  time: string;
  timestamp: string;
  created_at: Date;
}

export interface ProcessedRecordRow {
  id: number;
  report_id: string;
  employee_id: string;
  first_name: string;
  department: string;
  date: string;
  arrival_time: string;
  departure_time: string;
  duration: string;
  punch_count: number;
  others_punch: string; // JSON string
  created_at: Date;
}

export interface WorkspaceRow {
  id: string;
  name: string;
  owner_id: string;
  created_at: Date;
  updated_at: Date;
}

export interface WorkspaceMemberRow {
  id: string;
  workspace_id: string;
  user_id: string;
  role: 'owner' | 'editor' | 'viewer';
  added_at: Date;
}

export interface WorkspaceInvitationRow {
  id: string;
  workspace_id: string;
  email: string;
  token: string;
  status: 'pending' | 'accepted' | 'declined' | 'expired';
  role: 'editor' | 'viewer';
  created_at: Date;
  expires_at: Date;
}

export interface WorkspaceReportRow {
  workspace_id: string;
  report_id: string;
  added_at: Date;
}

// Initialize tables and indexes
export async function initializeTables(): Promise<void> {
  try {
    // Create tables
    await query(`
      CREATE TABLE IF NOT EXISTS ${TABLES.REPORTS} (
        id VARCHAR(255) PRIMARY KEY,
        file_name VARCHAR(255) NOT NULL,
        upload_date TIMESTAMP NOT NULL,
        date_range_start VARCHAR(50) NOT NULL,
        date_range_end VARCHAR(50) NOT NULL,
        user_id VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await query(`
      CREATE TABLE IF NOT EXISTS ${TABLES.EMPLOYEES} (
        id VARCHAR(255) NOT NULL,
        report_id VARCHAR(255) NOT NULL,
        first_name VARCHAR(255) NOT NULL,
        department VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (id, report_id),
        FOREIGN KEY (report_id) REFERENCES ${TABLES.REPORTS}(id) ON DELETE CASCADE
      );
    `);

    await query(`
      CREATE TABLE IF NOT EXISTS ${TABLES.ATTENDANCE_RECORDS} (
        id SERIAL PRIMARY KEY,
        report_id VARCHAR(255) NOT NULL,
        employee_id VARCHAR(255) NOT NULL,
        first_name VARCHAR(255) NOT NULL,
        department VARCHAR(255) NOT NULL,
        date VARCHAR(50) NOT NULL,
        time VARCHAR(50) NOT NULL,
        timestamp VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (report_id) REFERENCES ${TABLES.REPORTS}(id) ON DELETE CASCADE
      );
    `);

    await query(`
      CREATE TABLE IF NOT EXISTS ${TABLES.PROCESSED_RECORDS} (
        id SERIAL PRIMARY KEY,
        report_id VARCHAR(255) NOT NULL,
        employee_id VARCHAR(255) NOT NULL,
        first_name VARCHAR(255) NOT NULL,
        department VARCHAR(255) NOT NULL,
        date VARCHAR(50) NOT NULL,
        arrival_time VARCHAR(50) NOT NULL,
        departure_time VARCHAR(50) NOT NULL,
        duration VARCHAR(50) NOT NULL,
        punch_count INTEGER NOT NULL,
        others_punch TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (report_id) REFERENCES ${TABLES.REPORTS}(id) ON DELETE CASCADE
      );
    `);

    await query(`
      CREATE TABLE IF NOT EXISTS ${TABLES.WORKSPACES} (
        id VARCHAR(255) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        owner_id VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await query(`
      CREATE TABLE IF NOT EXISTS ${TABLES.WORKSPACE_MEMBERS} (
        id VARCHAR(255) PRIMARY KEY,
        workspace_id VARCHAR(255) NOT NULL,
        user_id VARCHAR(255) NOT NULL,
        role VARCHAR(50) NOT NULL DEFAULT 'viewer',
        added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (workspace_id) REFERENCES ${TABLES.WORKSPACES}(id) ON DELETE CASCADE,
        UNIQUE(workspace_id, user_id)
      );
    `);

    await query(`
      CREATE TABLE IF NOT EXISTS ${TABLES.WORKSPACE_INVITATIONS} (
        id VARCHAR(255) PRIMARY KEY,
        workspace_id VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL,
        token VARCHAR(255) NOT NULL UNIQUE,
        status VARCHAR(50) NOT NULL DEFAULT 'pending',
        role VARCHAR(50) NOT NULL DEFAULT 'viewer',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        expires_at TIMESTAMP NOT NULL,
        FOREIGN KEY (workspace_id) REFERENCES ${TABLES.WORKSPACES}(id) ON DELETE CASCADE
      );
    `);

    await query(`
      CREATE TABLE IF NOT EXISTS ${TABLES.WORKSPACE_REPORTS} (
        workspace_id VARCHAR(255) NOT NULL,
        report_id VARCHAR(255) NOT NULL,
        added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (workspace_id, report_id),
        FOREIGN KEY (workspace_id) REFERENCES ${TABLES.WORKSPACES}(id) ON DELETE CASCADE,
        FOREIGN KEY (report_id) REFERENCES ${TABLES.REPORTS}(id) ON DELETE CASCADE
      );
    `);

    // Create indexes for better performance
    await createIndexes();

    console.log('✅ PostgreSQL tables and indexes initialized');
  } catch (error) {
    console.error('❌ Error initializing PostgreSQL tables:', error);
    throw error;
  }
}

async function createIndexes(): Promise<void> {
  const indexes = [
    // Reports indexes
    `CREATE INDEX IF NOT EXISTS idx_reports_user_id ON ${TABLES.REPORTS}(user_id);`,
    `CREATE INDEX IF NOT EXISTS idx_reports_upload_date ON ${TABLES.REPORTS}(upload_date DESC);`,
    
    // Employees indexes
    `CREATE INDEX IF NOT EXISTS idx_employees_report_id ON ${TABLES.EMPLOYEES}(report_id);`,
    
    // Attendance records indexes
    `CREATE INDEX IF NOT EXISTS idx_attendance_report_id ON ${TABLES.ATTENDANCE_RECORDS}(report_id);`,
    `CREATE INDEX IF NOT EXISTS idx_attendance_employee_id ON ${TABLES.ATTENDANCE_RECORDS}(employee_id);`,
    `CREATE INDEX IF NOT EXISTS idx_attendance_date ON ${TABLES.ATTENDANCE_RECORDS}(date);`,
    
    // Processed records indexes
    `CREATE INDEX IF NOT EXISTS idx_processed_report_id ON ${TABLES.PROCESSED_RECORDS}(report_id);`,
    `CREATE INDEX IF NOT EXISTS idx_processed_employee_id ON ${TABLES.PROCESSED_RECORDS}(employee_id);`,
    `CREATE INDEX IF NOT EXISTS idx_processed_date ON ${TABLES.PROCESSED_RECORDS}(date);`,
    
    // Workspaces indexes
    `CREATE INDEX IF NOT EXISTS idx_workspaces_owner_id ON ${TABLES.WORKSPACES}(owner_id);`,
    
    // Workspace members indexes
    `CREATE INDEX IF NOT EXISTS idx_workspace_members_workspace_id ON ${TABLES.WORKSPACE_MEMBERS}(workspace_id);`,
    `CREATE INDEX IF NOT EXISTS idx_workspace_members_user_id ON ${TABLES.WORKSPACE_MEMBERS}(user_id);`,
    
    // Workspace invitations indexes
    `CREATE INDEX IF NOT EXISTS idx_invitations_workspace_id ON ${TABLES.WORKSPACE_INVITATIONS}(workspace_id);`,
    `CREATE INDEX IF NOT EXISTS idx_invitations_email ON ${TABLES.WORKSPACE_INVITATIONS}(email);`,
    `CREATE INDEX IF NOT EXISTS idx_invitations_token ON ${TABLES.WORKSPACE_INVITATIONS}(token);`,
    `CREATE INDEX IF NOT EXISTS idx_invitations_expires_at ON ${TABLES.WORKSPACE_INVITATIONS}(expires_at);`,
    
    // Workspace reports indexes
    `CREATE INDEX IF NOT EXISTS idx_workspace_reports_workspace_id ON ${TABLES.WORKSPACE_REPORTS}(workspace_id);`,
    `CREATE INDEX IF NOT EXISTS idx_workspace_reports_report_id ON ${TABLES.WORKSPACE_REPORTS}(report_id);`,
  ];

  for (const indexQuery of indexes) {
    try {
      await query(indexQuery);
    } catch (error) {
      // Ignore if index already exists
      if (!(error as Error).message.includes('already exists')) {
        console.warn('Warning creating index:', (error as Error).message);
      }
    }
  }
}

// Initialize on import
initializeTables().catch(console.error); 
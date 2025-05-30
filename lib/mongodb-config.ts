import { MongoClient, Db, Collection, Document } from 'mongodb';

// Configuration MongoDB
const MONGODB_URI = process.env.MONGODB_URI;
const DATABASE_NAME = 'attendance_tracker';

if (!MONGODB_URI) {
  throw new Error('Please define the MONGODB_URI environment variable inside .env');
}

// Global variable to store the MongoDB client
let cachedClient: MongoClient | null = null;
let cachedDb: Db | null = null;

export async function connectToDatabase(): Promise<{ client: MongoClient; db: Db }> {
  if (cachedClient && cachedDb) {
    return { client: cachedClient, db: cachedDb };
  }

  try {
    const client = new MongoClient(MONGODB_URI!);
    await client.connect();
    
    const db = client.db(DATABASE_NAME);
    
    cachedClient = client;
    cachedDb = db;
    
    console.log('✅ Connected to MongoDB Atlas');
    return { client, db };
  } catch (error) {
    console.error('❌ Failed to connect to MongoDB:', error);
    throw error;
  }
}

// Helper function to get a collection
export async function getCollection<T extends Document = Document>(collectionName: string): Promise<Collection<T>> {
  const { db } = await connectToDatabase();
  return db.collection<T>(collectionName);
}

// Collection names
export const COLLECTIONS = {
  REPORTS: 'reports',
  EMPLOYEES: 'employees',
  ATTENDANCE_RECORDS: 'attendance_records',
  PROCESSED_RECORDS: 'processed_records',
  WORKSPACES: 'workspaces',
  WORKSPACE_MEMBERS: 'workspace_members',
  WORKSPACE_INVITATIONS: 'workspace_invitations',
  WORKSPACE_REPORTS: 'workspace_reports',
} as const;

// Types for MongoDB documents
export interface ReportDocument {
  _id?: string;
  id: string;
  fileName: string;
  uploadDate: string;
  dateRangeStart: string;
  dateRangeEnd: string;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface EmployeeDocument {
  _id?: string;
  id: string;
  reportId: string;
  firstName: string;
  department: string;
  createdAt: Date;
}

export interface AttendanceRecordDocument {
  _id?: string;
  reportId: string;
  employeeId: string;
  firstName: string;
  department: string;
  date: string;
  time: string;
  timestamp: string;
  createdAt: Date;
}

export interface ProcessedRecordDocument {
  _id?: string;
  reportId: string;
  employeeId: string;
  firstName: string;
  department: string;
  date: string;
  arrivalTime: string;
  departureTime: string;
  duration: string;
  punchCount: number;
  othersPunch: string[];
  createdAt: Date;
}

export interface WorkspaceDocument {
  _id?: string;
  id: string;
  name: string;
  ownerId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface WorkspaceMemberDocument {
  _id?: string;
  id: string;
  workspaceId: string;
  userId: string;
  role: 'owner' | 'editor' | 'viewer';
  addedAt: Date;
}

export interface WorkspaceInvitationDocument {
  _id?: string;
  id: string;
  workspaceId: string;
  email: string;
  token: string;
  status: 'pending' | 'accepted' | 'declined' | 'expired';
  role: 'editor' | 'viewer';
  createdAt: Date;
  expiresAt: Date;
}

export interface WorkspaceReportDocument {
  _id?: string;
  workspaceId: string;
  reportId: string;
  addedAt: Date;
}

// Initialize indexes for better performance
export async function initializeIndexes() {
  try {
    const { db } = await connectToDatabase();
    
    // Reports indexes
    await db.collection(COLLECTIONS.REPORTS).createIndex({ id: 1 }, { unique: true });
    await db.collection(COLLECTIONS.REPORTS).createIndex({ userId: 1 });
    await db.collection(COLLECTIONS.REPORTS).createIndex({ uploadDate: -1 });
    
    // Employees indexes
    await db.collection(COLLECTIONS.EMPLOYEES).createIndex({ reportId: 1 });
    await db.collection(COLLECTIONS.EMPLOYEES).createIndex({ id: 1, reportId: 1 }, { unique: true });
    
    // Attendance records indexes
    await db.collection(COLLECTIONS.ATTENDANCE_RECORDS).createIndex({ reportId: 1 });
    await db.collection(COLLECTIONS.ATTENDANCE_RECORDS).createIndex({ employeeId: 1 });
    await db.collection(COLLECTIONS.ATTENDANCE_RECORDS).createIndex({ date: 1 });
    
    // Processed records indexes
    await db.collection(COLLECTIONS.PROCESSED_RECORDS).createIndex({ reportId: 1 });
    await db.collection(COLLECTIONS.PROCESSED_RECORDS).createIndex({ employeeId: 1 });
    await db.collection(COLLECTIONS.PROCESSED_RECORDS).createIndex({ date: 1 });
    
    // Workspaces indexes
    await db.collection(COLLECTIONS.WORKSPACES).createIndex({ id: 1 }, { unique: true });
    await db.collection(COLLECTIONS.WORKSPACES).createIndex({ ownerId: 1 });
    
    // Workspace members indexes
    await db.collection(COLLECTIONS.WORKSPACE_MEMBERS).createIndex({ id: 1 }, { unique: true });
    await db.collection(COLLECTIONS.WORKSPACE_MEMBERS).createIndex({ workspaceId: 1 });
    await db.collection(COLLECTIONS.WORKSPACE_MEMBERS).createIndex({ userId: 1 });
    await db.collection(COLLECTIONS.WORKSPACE_MEMBERS).createIndex({ workspaceId: 1, userId: 1 }, { unique: true });
    
    // Workspace invitations indexes
    await db.collection(COLLECTIONS.WORKSPACE_INVITATIONS).createIndex({ id: 1 }, { unique: true });
    await db.collection(COLLECTIONS.WORKSPACE_INVITATIONS).createIndex({ token: 1 }, { unique: true });
    await db.collection(COLLECTIONS.WORKSPACE_INVITATIONS).createIndex({ email: 1 });
    await db.collection(COLLECTIONS.WORKSPACE_INVITATIONS).createIndex({ workspaceId: 1 });
    await db.collection(COLLECTIONS.WORKSPACE_INVITATIONS).createIndex({ expiresAt: 1 });
    
    // Workspace reports indexes
    await db.collection(COLLECTIONS.WORKSPACE_REPORTS).createIndex({ workspaceId: 1, reportId: 1 }, { unique: true });
    await db.collection(COLLECTIONS.WORKSPACE_REPORTS).createIndex({ workspaceId: 1 });
    await db.collection(COLLECTIONS.WORKSPACE_REPORTS).createIndex({ reportId: 1 });
    
    console.log('✅ MongoDB indexes initialized');
  } catch (error) {
    console.error('❌ Error initializing MongoDB indexes:', error);
  }
} 
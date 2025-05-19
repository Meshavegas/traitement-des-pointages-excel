import Database from "better-sqlite3";
import {
  AttendanceReport,
  Employee,
  AttendanceRecord,
  ProcessedRecord,
} from "./actions";

const db = new Database("attendance.db");

// Initialize database tables
db.exec(`
  CREATE TABLE IF NOT EXISTS reports (
    id TEXT PRIMARY KEY,
    fileName TEXT NOT NULL,
    uploadDate TEXT NOT NULL,
    dateRangeStart TEXT NOT NULL,
    dateRangeEnd TEXT NOT NULL
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
`);

// Prepare statements
const insertReport = db.prepare(`
  INSERT INTO reports (id, fileName, uploadDate, dateRangeStart, dateRangeEnd)
  VALUES (?, ?, ?, ?, ?)
`);

const insertEmployee = db.prepare(`
  INSERT INTO employees (id, reportId, firstName, department)
  VALUES (?, ?, ?, ?)
`);

const insertAttendanceRecord = db.prepare(`
  INSERT INTO attendance_records (reportId, employeeId, firstName, department, date, time, timestamp)
  VALUES (?, ?, ?, ?, ?, ?, ?)
`);

const insertProcessedRecord = db.prepare(`
  INSERT INTO processed_records (reportId, employeeId, firstName, department, date, arrivalTime, departureTime, duration, punchCount, othersPunch)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

export function saveReport(report: AttendanceReport): void {
  const {
    id,
    fileName,
    uploadDate,
    dateRange,
    employees,
    attendanceRecords,
    processedRecords,
  } = report;

  db.transaction(() => {
    // Insert report
    insertReport.run(id, fileName, uploadDate, dateRange.start, dateRange.end);

    // Insert employees
    for (const employee of employees) {
      insertEmployee.run(
        employee.id,
        id,
        employee.firstName,
        employee.department
      );
    }

    // Insert attendance records
    for (const record of attendanceRecords) {
      insertAttendanceRecord.run(
        id,
        record.employeeId,
        record.firstName,
        record.department,
        record.date,
        record.time,
        record.timestamp
      );
    }

    // Insert processed records
    for (const record of processedRecords) {
      insertProcessedRecord.run(
        id,
        record.employeeId,
        record.firstName,
        record.department,
        record.date,
        record.arrivalTime,
        record.departureTime,
        record.duration,
        record.punchCount,
        JSON.stringify(record.othersPunch)
      );
    }
  })();
}

export function getReport(id: string): AttendanceReport | undefined {
  const report = db
    .prepare("SELECT * FROM reports WHERE id = ?")
    .get(id) as AttendanceReport & {
    dateRangeStart: string;
    dateRangeEnd: string;
  };

  if (!report) return undefined;

  const employees = db
    .prepare("SELECT * FROM employees WHERE reportId = ?")
    .all(id) as Employee[];
  const attendanceRecords = db
    .prepare("SELECT * FROM attendance_records WHERE reportId = ?")
    .all(id) as AttendanceRecord[];
  const processedRecords = db
    .prepare("SELECT * FROM processed_records WHERE reportId = ?")
    .all(id) as (Omit<ProcessedRecord, "othersPunch"> & {
    othersPunch: string;
  })[];

  return {
    id: report.id,
    fileName: report.fileName,
    uploadDate: report.uploadDate,
    dateRange: {
      start: report.dateRangeStart,
      end: report.dateRangeEnd,
    },
    employees: employees as Employee[],
    departments: [...new Set(employees.map((e: Employee) => e.department))],
    attendanceRecords: attendanceRecords as AttendanceRecord[],
    processedRecords: processedRecords.map((r) => ({
      ...r,
      othersPunch: JSON.parse(r.othersPunch),
    })) as ProcessedRecord[],
  };
}

export function getAllReports(): AttendanceReport[] {
  const reportIds = db.prepare("SELECT id FROM reports").all() as {
    id: string;
  }[];
  return reportIds.map(({ id }) => getReport(id)!).filter(Boolean);
}

export function deleteReport(id: string): boolean {
  const result = db.prepare("DELETE FROM reports WHERE id = ?").run(id);
  return result.changes > 0;
}

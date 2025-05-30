import {
  getCollection,
  COLLECTIONS,
  ReportDocument,
  EmployeeDocument,
  AttendanceRecordDocument,
  ProcessedRecordDocument,
  initializeIndexes,
} from "./mongodb-config";
import {
  AttendanceReport,
  Employee,
  AttendanceRecord,
  ProcessedRecord,
} from "./actions";

// Initialize indexes on first import
initializeIndexes().catch(console.error);

export async function saveReport(report: AttendanceReport, userId: string): Promise<void> {
  try {
    const {
      id,
      fileName,
      uploadDate,
      dateRange,
      employees,
      attendanceRecords,
      processedRecords,
    } = report;

    const now = new Date();

    // Save report
    const reportsCollection = await getCollection<ReportDocument>(COLLECTIONS.REPORTS);
    await reportsCollection.insertOne({
      id,
      fileName,
      uploadDate,
      dateRangeStart: dateRange.start,
      dateRangeEnd: dateRange.end,
      userId,
      createdAt: now,
      updatedAt: now,
    });

    // Save employees
    if (employees.length > 0) {
      const employeesCollection = await getCollection<EmployeeDocument>(COLLECTIONS.EMPLOYEES);
      const employeeDocuments = employees.map(employee => ({
        id: employee.id,
        reportId: id,
        firstName: employee.firstName,
        department: employee.department,
        createdAt: now,
      }));
      await employeesCollection.insertMany(employeeDocuments);
    }

    // Save attendance records
    if (attendanceRecords.length > 0) {
      const attendanceCollection = await getCollection<AttendanceRecordDocument>(COLLECTIONS.ATTENDANCE_RECORDS);
      const attendanceDocuments = attendanceRecords.map(record => ({
        reportId: id,
        employeeId: record.employeeId,
        firstName: record.firstName,
        department: record.department,
        date: record.date,
        time: record.time,
        timestamp: record.timestamp,
        createdAt: now,
      }));
      await attendanceCollection.insertMany(attendanceDocuments);
    }

    // Save processed records
    if (processedRecords.length > 0) {
      const processedCollection = await getCollection<ProcessedRecordDocument>(COLLECTIONS.PROCESSED_RECORDS);
      const processedDocuments = processedRecords.map(record => ({
        reportId: id,
        employeeId: record.employeeId,
        firstName: record.firstName,
        department: record.department,
        date: record.date,
        arrivalTime: record.arrivalTime,
        departureTime: record.departureTime,
        duration: record.duration,
        punchCount: record.punchCount,
        othersPunch: record.othersPunch,
        createdAt: now,
      }));
      await processedCollection.insertMany(processedDocuments);
    }

    console.log(`✅ Report ${id} saved to MongoDB`);
  } catch (error) {
    console.error("❌ Error saving report to MongoDB:", error);
    throw new Error("Failed to save report to database");
  }
}

export async function getReport(id: string, userId: string): Promise<AttendanceReport | undefined> {
  try {
    // Get report
    const reportsCollection = await getCollection<ReportDocument>(COLLECTIONS.REPORTS);
    const report = await reportsCollection.findOne({ id, userId });

    if (!report) return undefined;

    // Get employees
    const employeesCollection = await getCollection<EmployeeDocument>(COLLECTIONS.EMPLOYEES);
    const employees = await employeesCollection.find({ reportId: id }).toArray();

    // Get attendance records
    const attendanceCollection = await getCollection<AttendanceRecordDocument>(COLLECTIONS.ATTENDANCE_RECORDS);
    const attendanceRecords = await attendanceCollection.find({ reportId: id }).toArray();

    // Get processed records
    const processedCollection = await getCollection<ProcessedRecordDocument>(COLLECTIONS.PROCESSED_RECORDS);
    const processedRecords = await processedCollection.find({ reportId: id }).toArray();

    return {
      id: report.id,
      fileName: report.fileName,
      uploadDate: report.uploadDate,
      dateRange: {
        start: report.dateRangeStart,
        end: report.dateRangeEnd,
      },
      employees: employees.map(emp => ({
        id: emp.id,
        firstName: emp.firstName,
        department: emp.department,
      })) as Employee[],
      departments: [...new Set(employees.map(e => e.department))],
      attendanceRecords: attendanceRecords.map(record => ({
        employeeId: record.employeeId,
        firstName: record.firstName,
        department: record.department,
        date: record.date,
        time: record.time,
        timestamp: record.timestamp,
      })) as AttendanceRecord[],
      processedRecords: processedRecords.map(record => ({
        employeeId: record.employeeId,
        firstName: record.firstName,
        department: record.department,
        date: record.date,
        arrivalTime: record.arrivalTime,
        departureTime: record.departureTime,
        duration: record.duration,
        punchCount: record.punchCount,
        othersPunch: record.othersPunch,
      })) as ProcessedRecord[],
    };
  } catch (error) {
    console.error("❌ Error retrieving report from MongoDB:", error);
    return undefined;
  }
}

export async function getAllReports(userId: string): Promise<AttendanceReport[]> {
  try {
    const reportsCollection = await getCollection<ReportDocument>(COLLECTIONS.REPORTS);
    const reports = await reportsCollection
      .find({ userId })
      .sort({ uploadDate: -1 })
      .toArray();

    return reports.map(report => ({
      id: report.id,
      fileName: report.fileName,
      uploadDate: report.uploadDate,
      dateRange: {
        start: report.dateRangeStart,
        end: report.dateRangeEnd,
      },
      employees: [],
      departments: [],
      attendanceRecords: [],
      processedRecords: [],
    }));
  } catch (error) {
    console.error("❌ Error retrieving reports from MongoDB:", error);
    return [];
  }
}

export async function deleteReport(id: string, userId: string): Promise<boolean> {
  try {
    // Delete in order: processed_records, attendance_records, employees, reports
    const processedCollection = await getCollection(COLLECTIONS.PROCESSED_RECORDS);
    await processedCollection.deleteMany({ reportId: id });

    const attendanceCollection = await getCollection(COLLECTIONS.ATTENDANCE_RECORDS);
    await attendanceCollection.deleteMany({ reportId: id });

    const employeesCollection = await getCollection(COLLECTIONS.EMPLOYEES);
    await employeesCollection.deleteMany({ reportId: id });

    const reportsCollection = await getCollection<ReportDocument>(COLLECTIONS.REPORTS);
    const result = await reportsCollection.deleteOne({ id, userId });

    console.log(`✅ Report ${id} deleted from MongoDB`);
    return result.deletedCount > 0;
  } catch (error) {
    console.error("❌ Error deleting report from MongoDB:", error);
    return false;
  }
} 
import {
  query,
  transaction,
  TABLES,
  ReportRow,
  EmployeeRow,
  AttendanceRecordRow,
  ProcessedRecordRow,
  initializeTables,
} from './postgres-config';
import {
  AttendanceReport,
  Employee,
  AttendanceRecord,
  ProcessedRecord,
} from './actions';

// Initialize tables on first import
initializeTables().catch(console.error);

export async function saveReport(report: AttendanceReport, userId: string, workspaceId?: string): Promise<void> {
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

    await transaction(async (client) => {
      // Save report
      await client.query(`
        INSERT INTO ${TABLES.REPORTS} (
          id, file_name, upload_date, date_range_start, date_range_end, user_id
        ) VALUES ($1, $2, $3, $4, $5, $6)
      `, [id, fileName, uploadDate, dateRange.start, dateRange.end, userId]);

      // Save employees
      if (employees.length > 0) {
        const employeeValues = employees.map((employee, index) => {
          const baseIndex = index * 4;
          return `($${baseIndex + 1}, $${baseIndex + 2}, $${baseIndex + 3}, $${baseIndex + 4})`;
        }).join(', ');

        const employeeParams = employees.flatMap(employee => [
          employee.id,
          id,
          employee.firstName,
          employee.department
        ]);

        await client.query(`
          INSERT INTO ${TABLES.EMPLOYEES} (id, report_id, first_name, department)
          VALUES ${employeeValues}
        `, employeeParams);
      }

      // Save attendance records
      if (attendanceRecords.length > 0) {
        const attendanceValues = attendanceRecords.map((_, index) => {
          const baseIndex = index * 7;
          return `($${baseIndex + 1}, $${baseIndex + 2}, $${baseIndex + 3}, $${baseIndex + 4}, $${baseIndex + 5}, $${baseIndex + 6}, $${baseIndex + 7})`;
        }).join(', ');

        const attendanceParams = attendanceRecords.flatMap(record => [
          id,
          record.employeeId,
          record.firstName,
          record.department,
          record.date,
          record.time,
          record.timestamp
        ]);

        await client.query(`
          INSERT INTO ${TABLES.ATTENDANCE_RECORDS} (
            report_id, employee_id, first_name, department, date, time, timestamp
          ) VALUES ${attendanceValues}
        `, attendanceParams);
      }

      // Save processed records
      if (processedRecords.length > 0) {
        const processedValues = processedRecords.map((_, index) => {
          const baseIndex = index * 10;
          return `($${baseIndex + 1}, $${baseIndex + 2}, $${baseIndex + 3}, $${baseIndex + 4}, $${baseIndex + 5}, $${baseIndex + 6}, $${baseIndex + 7}, $${baseIndex + 8}, $${baseIndex + 9}, $${baseIndex + 10})`;
        }).join(', ');

        const processedParams = processedRecords.flatMap(record => [
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
        ]);

        await client.query(`
          INSERT INTO ${TABLES.PROCESSED_RECORDS} (
            report_id, employee_id, first_name, department, date, arrival_time,
            departure_time, duration, punch_count, others_punch
          ) VALUES ${processedValues}
        `, processedParams);
      }
    });

    // Si un workspaceId est fourni, ajouter le rapport au workspace
    if (workspaceId) {
      try {
        await query(`
          INSERT INTO workspace_reports (workspace_id, report_id)
          VALUES ($1, $2)
          ON CONFLICT (workspace_id, report_id) DO NOTHING
        `, [workspaceId, id]);
        console.log(`✅ Report ${id} added to workspace ${workspaceId}`);
      } catch (error) {
        console.error('❌ Error adding report to workspace:', error);
        // Ne pas faire échouer la sauvegarde du rapport pour un problème de workspace
      }
    }

    console.log(`✅ Report ${id} saved to PostgreSQL`);
  } catch (error) {
    console.error('❌ Error saving report to PostgreSQL:', error);
    throw new Error('Failed to save report to database');
  }
}

export async function getReport(id: string, userId: string): Promise<AttendanceReport | undefined> {
  try {
    // Get report
    const reportResult = await query(`
      SELECT * FROM ${TABLES.REPORTS} WHERE id = $1 AND user_id = $2
    `, [id, userId]);

    if (reportResult.rows.length === 0) return undefined;

    const report = reportResult.rows[0] as ReportRow;

    // Get employees
    const employeesResult = await query(`
      SELECT * FROM ${TABLES.EMPLOYEES} WHERE report_id = $1
    `, [id]);

    // Get attendance records
    const attendanceResult = await query(`
      SELECT * FROM ${TABLES.ATTENDANCE_RECORDS} WHERE report_id = $1
    `, [id]);

    // Get processed records
    const processedResult = await query(`
      SELECT * FROM ${TABLES.PROCESSED_RECORDS} WHERE report_id = $1
    `, [id]);

    return {
      id: report.id,
      fileName: report.file_name,
      uploadDate: report.upload_date,
      dateRange: {
        start: report.date_range_start,
        end: report.date_range_end,
      },
      employees: employeesResult.rows.map((emp: EmployeeRow) => ({
        id: emp.id,
        firstName: emp.first_name,
        department: emp.department,
      })) as Employee[],
      departments: [...new Set(employeesResult.rows.map((e: EmployeeRow) => e.department))] as string[],
      attendanceRecords: attendanceResult.rows.map((record: AttendanceRecordRow) => ({
        employeeId: record.employee_id,
        firstName: record.first_name,
        department: record.department,
        date: record.date,
        time: record.time,
        timestamp: record.timestamp,
      })) as AttendanceRecord[],
      processedRecords: processedResult.rows.map((record: ProcessedRecordRow) => ({
        employeeId: record.employee_id,
        firstName: record.first_name,
        department: record.department,
        date: record.date,
        arrivalTime: record.arrival_time,
        departureTime: record.departure_time,
        duration: record.duration,
        punchCount: record.punch_count,
        othersPunch: Array.isArray(JSON.parse(record.others_punch || '[]')) 
          ? JSON.parse(record.others_punch || '[]') as string[]
          : [],
      })) as ProcessedRecord[],
    };
  } catch (error) {
    console.error('❌ Error retrieving report from PostgreSQL:', error);
    return undefined;
  }
}

// Nouvelle fonction pour récupérer un rapport via l'accès workspace
export async function getReportByWorkspace(id: string, userId: string): Promise<AttendanceReport | undefined> {
  try {
    // Vérifier si l'utilisateur a accès au rapport via un workspace
    const accessResult = await query(`
      SELECT r.* FROM ${TABLES.REPORTS} r
      INNER JOIN workspace_reports wr ON r.id = wr.report_id
      INNER JOIN workspace_members wm ON wr.workspace_id = wm.workspace_id
      WHERE r.id = $1 AND wm.user_id = $2
    `, [id, userId]);

    if (accessResult.rows.length === 0) return undefined;

    const report = accessResult.rows[0] as ReportRow;

    // Get employees
    const employeesResult = await query(`
      SELECT * FROM ${TABLES.EMPLOYEES} WHERE report_id = $1
    `, [id]);

    // Get attendance records
    const attendanceResult = await query(`
      SELECT * FROM ${TABLES.ATTENDANCE_RECORDS} WHERE report_id = $1
    `, [id]);

    // Get processed records
    const processedResult = await query(`
      SELECT * FROM ${TABLES.PROCESSED_RECORDS} WHERE report_id = $1
    `, [id]);

    return {
      id: report.id,
      fileName: report.file_name,
      uploadDate: report.upload_date,
      dateRange: {
        start: report.date_range_start,
        end: report.date_range_end,
      },
      employees: employeesResult.rows.map((emp: EmployeeRow) => ({
        id: emp.id,
        firstName: emp.first_name,
        department: emp.department,
      })) as Employee[],
      departments: [...new Set(employeesResult.rows.map((e: EmployeeRow) => e.department))] as string[],
      attendanceRecords: attendanceResult.rows.map((record: AttendanceRecordRow) => ({
        employeeId: record.employee_id,
        firstName: record.first_name,
        department: record.department,
        date: record.date,
        time: record.time,
        timestamp: record.timestamp,
      })) as AttendanceRecord[],
      processedRecords: processedResult.rows.map((record: ProcessedRecordRow) => ({
        employeeId: record.employee_id,
        firstName: record.first_name,
        department: record.department,
        date: record.date,
        arrivalTime: record.arrival_time,
        departureTime: record.departure_time,
        duration: record.duration,
        punchCount: record.punch_count,
        othersPunch: Array.isArray(JSON.parse(record.others_punch || '[]')) 
          ? JSON.parse(record.others_punch || '[]') as string[]
          : [],
      })) as ProcessedRecord[],
    };
  } catch (error) {
    console.error('❌ Error retrieving report by workspace from PostgreSQL:', error);
    return undefined;
  }
}

export async function getAllReports(userId: string): Promise<AttendanceReport[]> {
  try {
    const result = await query(`
      SELECT * FROM ${TABLES.REPORTS} 
      WHERE user_id = $1 
      ORDER BY upload_date DESC
    `, [userId]);

    return result.rows.map((report: ReportRow) => ({
      id: report.id,
      fileName: report.file_name,
      uploadDate: report.upload_date,
      dateRange: {
        start: report.date_range_start,
        end: report.date_range_end,
      },
      employees: [],
      departments: [],
      attendanceRecords: [],
      processedRecords: [],
    }));
  } catch (error) {
    console.error('❌ Error retrieving reports from PostgreSQL:', error);
    return [];
  }
}

// Nouvelle fonction pour récupérer tous les rapports accessibles (propriétaire + workspace)
export async function getAllAccessibleReports(userId: string): Promise<AttendanceReport[]> {
  try {
    const result = await query(`
      SELECT DISTINCT r.*, 'owner' as access_type FROM ${TABLES.REPORTS} r
      WHERE r.user_id = $1
      
      UNION
      
      SELECT DISTINCT r.*, 'workspace' as access_type FROM ${TABLES.REPORTS} r
      INNER JOIN workspace_reports wr ON r.id = wr.report_id
      INNER JOIN workspace_members wm ON wr.workspace_id = wm.workspace_id
      WHERE wm.user_id = $1 AND r.user_id != $1
      
      ORDER BY upload_date DESC
    `, [userId]);

    return result.rows.map((report: ReportRow) => ({
      id: report.id,
      fileName: report.file_name,
      uploadDate: report.upload_date,
      dateRange: {
        start: report.date_range_start,
        end: report.date_range_end,
      },
      employees: [],
      departments: [],
      attendanceRecords: [],
      processedRecords: [],
    }));
  } catch (error) {
    console.error('❌ Error retrieving accessible reports from PostgreSQL:', error);
    return [];
  }
}

export async function deleteReport(id: string, userId: string): Promise<boolean> {
  try {
    await transaction(async (client) => {
      // Delete in order: processed_records, attendance_records, employees, reports
      await client.query(`DELETE FROM ${TABLES.PROCESSED_RECORDS} WHERE report_id = $1`, [id]);
      await client.query(`DELETE FROM ${TABLES.ATTENDANCE_RECORDS} WHERE report_id = $1`, [id]);
      await client.query(`DELETE FROM ${TABLES.EMPLOYEES} WHERE report_id = $1`, [id]);
      
      const result = await client.query(`
        DELETE FROM ${TABLES.REPORTS} WHERE id = $1 AND user_id = $2
      `, [id, userId]);

      if (result.rowCount === 0) {
        throw new Error('Report not found or access denied');
      }
    });

    console.log(`✅ Report ${id} deleted from PostgreSQL`);
    return true;
  } catch (error) {
    console.error('❌ Error deleting report from PostgreSQL:', error);
    return false;
  }
} 
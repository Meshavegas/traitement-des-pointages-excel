"use server";

import { revalidatePath } from "next/cache";
import { read, utils } from "xlsx";
import { v4 as uuidv4 } from "uuid";
import {
  saveReport,
  getAllReports,
  getReport as getReportFromDb,
  deleteReport as deleteReportFromDb,
} from "./db";
import { calculateDuration, EVENING_SHIFT_START } from "./shift-utils";

// Type definitions
export type Employee = {
  id: string;
  firstName: string;
  department: string;
};

export type AttendanceRecord = {
  employeeId: string;
  firstName: string;
  department: string;
  date: string;
  time: string;
  timestamp: string;
};

export type AttendanceReport = {
  id: string;
  fileName: string;
  uploadDate: string;
  employees: Employee[];
  departments: string[];
  dateRange: {
    start: string;
    end: string;
  };
  attendanceRecords: AttendanceRecord[];
  processedRecords: ProcessedRecord[];
};

export type ProcessedRecord = {
  employeeId: string;
  firstName: string;
  department: string;
  date: string;
  arrivalTime: string;
  departureTime: string;
  duration: string;
  othersPunch: string[];
  punchCount: number;
};

// Function to parse Excel data
function parseExcelData(data: any[][]): AttendanceRecord[] {
  const records: AttendanceRecord[] = [];

  // Find header row
  const headerRowIndex = data.findIndex(
    (row) =>
      row &&
      Array.isArray(row) &&
      row.some((cell) => cell === "Employee ID" || cell === "EmployeeID")
  );

  if (headerRowIndex === -1) {
    throw new Error("Invalid file format: Could not find header row");
  }

  const headers = data[headerRowIndex];
  const idIndex = headers.findIndex(
    (h) => h === "Employee ID" || h === "EmployeeID"
  );
  const nameIndex = headers.findIndex(
    (h) => h === "First Name" || h === "FirstName" || h === "Name"
  );
  const deptIndex = headers.findIndex((h) => h === "Department");
  const dateIndex = headers.findIndex((h) => h === "Date");
  const timeIndex = headers.findIndex((h) => h === "Time");

  if (
    idIndex === -1 ||
    nameIndex === -1 ||
    deptIndex === -1 ||
    dateIndex === -1 ||
    timeIndex === -1
  ) {
    throw new Error("Invalid file format: Missing required columns");
  }

  // Process data rows
  for (let i = headerRowIndex + 1; i < data.length; i++) {
    const row = data[i];

    if (
      row &&
      row.length > Math.max(idIndex, nameIndex, deptIndex, dateIndex, timeIndex)
    ) {
      const employeeId = row[idIndex]?.toString() || "";
      const firstName = row[nameIndex]?.toString() || "";
      const department = row[deptIndex]?.toString() || "";
      const date = row[dateIndex]?.toString() || "";
      const time = row[timeIndex]?.toString() || "";

      if (employeeId && date && time) {
        records.push({
          employeeId,
          firstName,
          department,
          date,
          time,
          timestamp: `${date} ${time}`,
        });
      }
    }
  }

  return records;
}

// Function to process attendance records
function processAttendanceRecords(
  records: AttendanceRecord[]
): ProcessedRecord[] {
  // Group records by employee and date
  const recordsByEmployeeAndDate = new Map<string, AttendanceRecord[]>();

  records.forEach((record) => {
    const key = `${record.employeeId}-${record.date}`;
    if (!recordsByEmployeeAndDate.has(key)) {
      recordsByEmployeeAndDate.set(key, []);
    }
    recordsByEmployeeAndDate.get(key)?.push(record);
  });

  // Process each group to determine arrival and departure times
  const processedRecords: ProcessedRecord[] = [];
  // console.log({
  //   recordsByEmployeeAndDate: recordsByEmployeeAndDate.entries(),
  // });

  recordsByEmployeeAndDate.forEach((dayRecords, key) => {
    // Sort records by timestamp

    if (dayRecords.length === 1) {
      let firstRecord = dayRecords[0];

      processedRecords.push({
        employeeId: firstRecord.employeeId,
        firstName: firstRecord.firstName,
        department: firstRecord.department,
        date: firstRecord.date,
        arrivalTime: firstRecord.time,
        departureTime: "-", // Or use some indicator
        duration: "Incomplete", // Or use a standard duration based on policy
        punchCount: 1,
        othersPunch: dayRecords.map((record) => record.time),
      });
    } else {
      dayRecords.sort(
        (a, b) =>
          new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
      );

      console.log({ dayRecords: JSON.stringify(dayRecords, null, 2) });

      let firstRecord = dayRecords[0];
      let lastRecord = dayRecords[dayRecords.length - 1];

      // Déterminer si c'est un quart de soirée
      const arrivalTime = firstRecord.time;
      const [arrivalHours] = arrivalTime.split(":").map(Number);
      const isArrivalIsEarly = arrivalHours < 8; // Si l'arrivée est avant 8h

      // check if yesterday was a nigth shift
      if (isArrivalIsEarly && firstRecord?.department === "OPERATION") {
        const [idEmployee, year, month, day] = key.split("-");
        const dayMinusOne = parseInt(day) - 1;
        const dayMinusOneStr =
          dayMinusOne < 10 ? `0${dayMinusOne}` : dayMinusOne;
        const dateMinusOne = `${year}-${month}-${dayMinusOneStr}`;
        const previousRecord = recordsByEmployeeAndDate.get(
          `${idEmployee}-${dateMinusOne}`
        );
        if (previousRecord && previousRecord.length > 0) {
          let lastRecordLowerThant8h: AttendanceRecord | undefined = undefined;

          console.log({ previousRecord });

          previousRecord
            .sort(
              (a, b) =>
                new Date(a.timestamp).getTime() -
                new Date(b.timestamp).getTime()
            )
            .forEach((record) => {
              const [hours, minutes] = record.time.split(":").map(Number);
              if (hours > 10) {
                lastRecordLowerThant8h = record;
              }
            });

          console.log({ lastRecordLowerThant8h });

          if (lastRecordLowerThant8h) {
            firstRecord = lastRecordLowerThant8h;
          }
        }
      }

      const [arrivalHours2] = firstRecord?.time.split(":").map(Number) ?? [];
      const isEveningShift = arrivalHours2 >= 18; // Si l'arrivée est après 18h
      if (isEveningShift && firstRecord?.department === "OPERATION") {
        const [idEmployee, year, month, day] = key.split("-");
        const dayPlusOne = parseInt(day) + 1;
        const dayPlusOneStr = dayPlusOne < 10 ? `0${dayPlusOne}` : dayPlusOne;
        const datePlusOne = `${year}-${month}-${dayPlusOneStr}`;
        const nextRecord = recordsByEmployeeAndDate.get(
          `${idEmployee}-${datePlusOne}`
        );
        console.log({
          nextRecord: JSON.stringify(nextRecord, null, 2),
          datePlusOne,
          idEmployee,
        });
        if (nextRecord && nextRecord.length > 0) {
          let firstLowThant8h: AttendanceRecord | undefined = undefined;
          firstLowThant8h = nextRecord
            .sort(
              (a, b) =>
                new Date(a.timestamp).getTime() -
                new Date(b.timestamp).getTime()
            )
            .find((record) => {
              const [hours] = record.time.split(":").map(Number);
              return hours < 10;
            });

          lastRecord = {
            ...lastRecord,
            time: firstLowThant8h ? firstLowThant8h.time : "-",
            timestamp: `${datePlusOne} ${firstLowThant8h?.time ?? "-"}`,
          };
          console.log({
            lastRecord: JSON.stringify(lastRecord, null, 2),
          });
        }
      }

      // Calculate duration using the new function
      const duration = calculateDuration(
        firstRecord.time,
        lastRecord.time,
        isEveningShift
      );

      processedRecords.push({
        employeeId: firstRecord.employeeId,
        firstName: firstRecord.firstName,
        department: firstRecord.department,
        date: firstRecord.date,
        arrivalTime: firstRecord.time,
        departureTime: lastRecord.time,
        duration,
        punchCount: dayRecords.length,
        othersPunch: dayRecords.map((record) => record.time),
      });
    }
  });

  // Sort by department, employee ID, and date with null checks
  return processedRecords.sort((a, b) => {
    // Ensure department is not undefined before using localeCompare
    if (a.department !== b.department) {
      return (a.department || "").localeCompare(b.department || "");
    }
    // Ensure employeeId is not undefined before using localeCompare
    if (a.employeeId !== b.employeeId) {
      return (a.employeeId || "").localeCompare(b.employeeId || "");
    }
    // Ensure date is not undefined before using localeCompare
    return (a.date || "").localeCompare(b.date || "");
  });
}

// Upload file action
export async function uploadFile(formData: FormData) {
  try {
    const file = formData.get("file") as File;

    if (!file) {
      return { success: false, error: "No file provided" };
    }

    // Process the file directly in memory
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Read the Excel file from buffer
    const workbook = read(buffer, { type: "buffer" });
    const firstSheet = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[firstSheet];

    // Convert to array of arrays
    const data = utils.sheet_to_json(worksheet, { header: 1 }) as any[][];

    // Parse the data
    const attendanceRecords = parseExcelData(data);

    if (attendanceRecords.length === 0) {
      return { success: false, error: "No valid records found in the file" };
    }

    // Process the records
    const processedRecords = processAttendanceRecords(attendanceRecords);

    // Extract unique employees and departments
    const employees = Array.from(
      new Map(
        attendanceRecords.map((record) => [
          record.employeeId,
          {
            id: record.employeeId,
            firstName: record.firstName,
            department: record.department,
          },
        ])
      ).values()
    );

    const departments = [
      ...new Set(attendanceRecords.map((record) => record.department)),
    ];

    // Determine date range with null checks
    const dates = attendanceRecords
      .map((record) => record.date)
      .filter(Boolean);

    // Default values if no valid dates are found
    let startDate = "N/A";
    let endDate = "N/A";

    if (dates.length > 0) {
      startDate = dates.reduce((a, b) => (a < b ? a : b));
      endDate = dates.reduce((a, b) => (a > b ? a : b));
    }

    // Create report
    const reportId = uuidv4();
    const report: AttendanceReport = {
      id: reportId,
      fileName: file.name,
      uploadDate: new Date().toISOString(),
      employees,
      departments,
      dateRange: {
        start: startDate,
        end: endDate,
      },
      attendanceRecords,
      processedRecords,
    };

    // Store report in database instead of memory
    saveReport(report);

    revalidatePath("/reports");

    return {
      success: true,
      reportId,
      message: "File processed successfully",
    };
  } catch (error) {
    console.error("Error processing file:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "An unknown error occurred",
    };
  }
}

// Get all reports
export async function getReports() {
  return getAllReports();
}

// Get a specific report
export async function getReport(id: string) {
  return getReportFromDb(id);
}

// Delete a report
export async function deleteReport(id: string) {
  const deleted = deleteReportFromDb(id);
  if (deleted) {
    revalidatePath("/reports");
  }
  return { success: deleted };
}

// Utilitaires pour la génération de rapports et de statistiques
import type { EmployeeData, SummaryStats } from "./types";
import type { ProcessedRecord, AttendanceRecord } from "./actions";
import { determineScheduledTime, calculateDelay } from "./shift-utils";

/**
 * Génère des statistiques récapitulatives pour les départements
 */
export function generateSummaryStats(
  filteredDepartments: string[],
  employeesByDepartment: Record<string, EmployeeData[]>,
  filteredDates: string[],
  employeeShifts: Record<string, string>
): SummaryStats {
  const summary: SummaryStats = {
    totalEmployees: 0,
    totalEntries: 0,
    onTimeCount: 0,
    lateCount: 0,
    earlyCount: 0,
    averageDelay: 0,
    departmentStats: {},
  };

  let totalDelayMinutes = 0;
  let totalDelayEntries = 0;

  // Traite chaque département
  filteredDepartments.forEach((dept) => {
    const employees = employeesByDepartment[dept] || [];
    let deptOnTime = 0;
    let deptLate = 0;
    let deptEarly = 0;
    let deptTotalDelay = 0;
    let deptTotalEntries = 0;

    summary.totalEmployees += employees.length;

    // Traite chaque employé
    employees.forEach((employee) => {
      // Traite chaque date
      filteredDates.forEach((date) => {
        const record = employee.records[date];
        if (!record) return;

        summary.totalEntries++;
        deptTotalEntries++;

        // Détermine l'heure programmée
        const scheduledTime = determineScheduledTime(
          record.arrivalTime,
          dept,
          employee.id,
          employeeShifts
        );
        if (scheduledTime === "-") return;

        // Calcule le retard
        const { value, isDelay, isOnTime } = calculateDelay(
          record.arrivalTime,
          scheduledTime,
          dept
        );
        if (value === "-") return;

        const delayMinutes = Number.parseInt(value);

        if (isOnTime) {
          summary.onTimeCount++;
          deptOnTime++;
        } else if (isDelay) {
          summary.lateCount++;
          deptLate++;
          totalDelayMinutes += delayMinutes;
          totalDelayEntries++;
          deptTotalDelay += delayMinutes;
        } else {
          summary.earlyCount++;
          deptEarly++;
        }
      });
    });

    // Calcule le retard moyen du département
    const deptAvgDelay = deptLate > 0 ? deptTotalDelay / deptLate : 0;

    // Stocke les statistiques du département
    summary.departmentStats[dept] = {
      employees: employees.length,
      entries: deptTotalEntries,
      onTime: deptOnTime,
      late: deptLate,
      early: deptEarly,
      avgDelay: deptAvgDelay,
    };
  });

  // Calcule le retard moyen global
  summary.averageDelay =
    totalDelayEntries > 0 ? totalDelayMinutes / totalDelayEntries : 0;

  return summary;
}

/**
 * Exporte les données du rapport au format CSV
 */
export function exportReportToCSV(
  filteredDepartments: string[],
  employeesByDepartment: Record<string, EmployeeData[]>,
  filteredDates: string[],
  employeeShifts: Record<string, string>,
  selectedDepartment: string
): void {
  // Crée les en-têtes
  const headers = [
    "Department",
    "Employee",
    "Date",
    "Scheduled Start",
    "Arrival Time",
    "Departure Time",
    "Delay/Early",
    "Duration",
    "Punches",
    "All Time Entries",
  ];

  // Crée les lignes
  const rows: string[][] = [];

  filteredDepartments.forEach((dept) => {
    const employees = employeesByDepartment[dept] || [];

    employees.forEach((employee) => {
      filteredDates.forEach((date) => {
        const record = employee.records[date];

        if (record) {
          const scheduledTime = determineScheduledTime(
            record.arrivalTime,
            dept,
            employee.id,
            employeeShifts
          );
          const { value: delayValue } = calculateDelay(
            record.arrivalTime,
            scheduledTime,
            dept
          );
          const timeEntries = employee.allTimeEntries?.[date] || [];

          rows.push([
            dept,
            employee.firstName,
            date,
            scheduledTime,
            record.arrivalTime,
            record.departureTime,
            delayValue,
            record.duration,
            record.punchCount.toString(),
            timeEntries.map((entry) => entry.time).join(", "),
          ]);
        }
      });
    });
  });

  // Crée le contenu CSV
  const csvContent = [
    headers.join(","),
    ...rows.map((row) => row.join(",")),
  ].join("\n");

  // Télécharge le CSV
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute(
    "download",
    `attendance-report-${selectedDepartment || "all"}.csv`
  );
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Groupe les enregistrements par employé et département
 */
export function groupRecordsByDepartmentAndEmployee(
  records: ProcessedRecord[],
  allRecords: AttendanceRecord[]
): {
  employeesByDepartment: Record<string, EmployeeData[]>;
  allDates: Set<string>;
} {
  const employeesByDepartment: Record<string, EmployeeData[]> = {};
  const allDates = new Set<string>();

  // Groupe toutes les entrées de temps par employé et date
  const timeEntriesByEmployeeAndDate: Record<
    string,
    Record<string, AttendanceRecord[]>
  > = {};

  // Traite d'abord toutes les entrées de temps
  allRecords.forEach((record) => {
    const employeeKey = `${record.employeeId}-${record.firstName}`;

    if (!timeEntriesByEmployeeAndDate[employeeKey]) {
      timeEntriesByEmployeeAndDate[employeeKey] = {};
    }

    if (!timeEntriesByEmployeeAndDate[employeeKey][record.date]) {
      timeEntriesByEmployeeAndDate[employeeKey][record.date] = [];
    }

    timeEntriesByEmployeeAndDate[employeeKey][record.date].push(record);
  });

  // Traite les enregistrements pour organiser par département et employé
  records.forEach((record) => {
    // Ajoute la date à toutes les dates
    allDates.add(record.date);

    // Crée l'entrée du département si elle n'existe pas
    if (!employeesByDepartment[record.department]) {
      employeesByDepartment[record.department] = [];
    }

    // Trouve l'employé dans le département
    let employee = employeesByDepartment[record.department].find(
      (emp) => emp.id === record.employeeId
    );

    // Crée l'employé s'il n'existe pas
    if (!employee) {
      const employeeKey = `${record.employeeId}-${record.firstName}`;

      employee = {
        id: record.employeeId,
        firstName: record.firstName,
        department: record.department,
        records: {},
        allTimeEntries: timeEntriesByEmployeeAndDate[employeeKey] || {},
      };
      employeesByDepartment[record.department].push(employee);
    }

    // Ajoute l'enregistrement à l'employé
    employee.records[record.date] = record;
  });

  return { employeesByDepartment, allDates };
}

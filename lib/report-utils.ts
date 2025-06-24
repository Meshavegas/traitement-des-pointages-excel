// Utilitaires pour la génération de rapports et de statistiques
import type { EmployeeData, SummaryStats } from "./types";
import type { ProcessedRecord, AttendanceRecord } from "./actions";
import { determineScheduledTime, calculateDelay } from "./shift-utils";
import { utils, writeFile } from "xlsx";

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

  filteredDepartments.forEach((dept) => {
    const employees = employeesByDepartment[dept] || [];
    summary.totalEmployees += employees.length;

    let deptTotalEntries = 0;
    let deptOnTime = 0;
    let deptLate = 0;
    let deptEarly = 0;
    let deptTotalDelay = 0;

    employees.forEach((employee) => {
      filteredDates.forEach((date) => {
        const record = employee.records[date];
        if (!record) return;

        summary.totalEntries++;
        deptTotalEntries++;

        // Détermine l'heure programmée
        const scheduledTime = determineScheduledTime(
          record.arrivalTime,
          date,
          dept,
          employee
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
  selectedDepartment: string,
  includeHistory: boolean = false
): void {
  // Crée les en-têtes
  const headers = [
    "Date",
    "Scheduled Start",
    "Arrival Time",
    "Departure Time",
    "Delay/Early",
    "Work Time",
    "Punches",
  ];

  if (includeHistory) {
    headers.push("History");
  }

  // Crée les lignes organisées par employé
  const rows: string[][] = [];

  filteredDepartments.forEach((dept) => {
    const employees = employeesByDepartment[dept] || [];

    employees.forEach((employee) => {
      // Ajoute une ligne vide pour séparer les employés (sauf pour le premier)
      if (rows.length > 0) {
        rows.push([""]);
      }

      // En-tête de l'employé
      rows.push([
        `${employee.firstName.toUpperCase()} - ${employee.department.toUpperCase()}`,
        "",
        "",
        "",
        "",
        "",
        "",
        ...(includeHistory ? [""] : [])
      ]);
      
      // Sous-titre avec l'ID de l'employé
      rows.push([
        `Employee ID: ${employee.id}`,
        "",
        "",
        "",
        "",
        "",
        "",
        ...(includeHistory ? [""] : [])
      ]);

      // Ligne vide
      rows.push([""]);

      // En-têtes des colonnes pour cet employé
      rows.push(headers);

      // Données pour chaque date
      filteredDates.forEach((date) => {
        const record = employee.records[date];

        if (record) {
          const scheduledTime = determineScheduledTime(
            record.arrivalTime,
            date,
            dept,
            employee
          );
          const {
            value: delayValue,
            isDelay,
            isOnTime,
          } = calculateDelay(
            record.arrivalTime,
            scheduledTime,
            dept
          );

          const row = [
            date,
            scheduledTime !== "-" ? scheduledTime.substring(0, 5) : "-",
            record.arrivalTime,
            record.departureTime,
            isOnTime ? "On time" : delayValue,
            record.duration,
            record.punchCount.toString(),
          ];

          if (includeHistory) {
            if (record.othersPunch.length > 0) {
              row.push(record.othersPunch.join(", "));
            } else {
              row.push("No entries");
            }
          }

          rows.push(row);
        } else {
          // Ligne vide pour les dates sans données
          const emptyRow = [
            date,
            "-",
            "-",
            "-",
            "-",
            "-",
            "-",
          ];

          if (includeHistory) {
            emptyRow.push("-");
          }

          rows.push(emptyRow);
        }
      });
    });
  });

  // Crée le contenu CSV
  const csvContent = rows.map((row) => row.map(cell => `"${cell}"`).join(",")).join("\n");

  // Télécharge le CSV
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute(
    "download",
    `attendance-report-${selectedDepartment || "all"}-${new Date().toISOString().split('T')[0]}.csv`
  );
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Exporte les données du rapport au format Excel
 */
export function exportReportToExcel(
  filteredDepartments: string[],
  employeesByDepartment: Record<string, EmployeeData[]>,
  filteredDates: string[],
  employeeShifts: Record<string, string>,
  selectedDepartment: string,
  includeHistory: boolean = false,
  summaryStats?: SummaryStats
): void {
  // Crée un nouveau workbook
  const workbook = utils.book_new();

  // Prépare les données pour la feuille principale organisées par employé
  const rows: any[][] = [];

  // En-têtes de colonnes
  const headers = [
    "Date",
    "Scheduled Start",
    "Arrival Time",
    "Departure Time",
    "Delay/Early",
    "Work Time",
    "Punches",
  ];

  if (includeHistory) {
    headers.push("History");
  }

  filteredDepartments.forEach((dept) => {
    const employees = employeesByDepartment[dept] || [];

    employees.forEach((employee) => {
      // Ajoute une ligne vide pour séparer les employés (sauf pour le premier)
      if (rows.length > 0) {
        rows.push([]);
      }

      // En-tête de l'employé
      rows.push([
        `${employee.firstName.toUpperCase()} - ${employee.department.toUpperCase()}`,
        "",
        "",
        "",
        "",
        "",
        "",
        ...(includeHistory ? [""] : [])
      ]);
      
      // Sous-titre avec l'ID de l'employé
      rows.push([
        `Employee ID: ${employee.id}`,
        "",
        "",
        "",
        "",
        "",
        "",
        ...(includeHistory ? [""] : [])
      ]);

      // Ligne vide
      rows.push([]);

      // En-têtes des colonnes pour cet employé
      rows.push(headers);

      // Données pour chaque date
      filteredDates.forEach((date) => {
        const record = employee.records[date];

        if (record) {
          // Determine scheduled time based on department and arrival time
          const scheduledTime = determineScheduledTime(
            record.arrivalTime,
            date,
            dept,
            employee
          );

          // Calculate delay or early arrival
          const {
            value: delayValue,
            isDelay,
            isOnTime,
          } = calculateDelay(
            record.arrivalTime,
            scheduledTime,
            dept
          );

          const row = [
            date,
            scheduledTime !== "-" ? scheduledTime.substring(0, 5) : "-",
            record.arrivalTime,
            record.departureTime,
            isOnTime ? "On time" : delayValue,
            record.duration,
            record.punchCount,
          ];

          if (includeHistory) {
            if (record.othersPunch.length > 0) {
              row.push(record.othersPunch.join(", "));
            } else {
              row.push("No entries");
            }
          }

          rows.push(row);
        } else {
          // Ligne vide pour les dates sans données
          const emptyRow = [
            date,
            "-",
            "-",
            "-",
            "-",
            "-",
            "-",
          ];

          if (includeHistory) {
            emptyRow.push("-");
          }

          rows.push(emptyRow);
        }
      });
    });
  });

  // Crée la feuille de données
  const worksheet = utils.aoa_to_sheet(rows);

  // Applique un style aux en-têtes d'employés (optionnel - nécessite des styles Excel)
  // Note: Pour une mise en forme avancée, il faudrait utiliser une bibliothèque comme exceljs
  
  utils.book_append_sheet(workbook, worksheet, "Attendance Data");

  // Feuille de résumé si les statistiques sont fournies
  if (summaryStats) {
    const summaryRows = [
      ["Attendance Summary Report"],
      [""],
      ["Overall Statistics"],
      ["Total Employees", summaryStats.totalEmployees],
      ["Total Entries", summaryStats.totalEntries],
      ["On Time", summaryStats.onTimeCount],
      ["Late", summaryStats.lateCount],
      ["Early", summaryStats.earlyCount],
      ["Average Delay (minutes)", Math.round(summaryStats.averageDelay)],
      [""],
      ["Department Statistics"],
      ["Department", "Employees", "Entries", "On Time", "Late", "Early", "Avg Delay"],
    ];

    Object.entries(summaryStats.departmentStats).forEach(([dept, stats]) => {
      summaryRows.push([
        dept,
        stats.employees,
        stats.entries,
        stats.onTime,
        stats.late,
        stats.early,
        Math.round(stats.avgDelay),
      ]);
    });

    const summaryWorksheet = utils.aoa_to_sheet(summaryRows);
    utils.book_append_sheet(workbook, summaryWorksheet, "Summary");
  }

  // Télécharge le fichier Excel
  writeFile(
    workbook,
    `attendance-report-${selectedDepartment || "all"}-${new Date().toISOString().split('T')[0]}.xlsx`
  );
}

/**
 * Exporte les données du rapport au format PDF (via impression)
 */
export function exportReportToPDF(): void {
  // Utilise la fonction d'impression du navigateur pour générer un PDF
  window.print();
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

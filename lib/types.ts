// Types utilisés dans les composants de rapport de département
import type { ProcessedRecord, AttendanceRecord } from "./actions";

/**
 * Interface pour les données d'un employé avec ses enregistrements
 */
export interface EmployeeData {
  id: string;
  firstName: string;
  department: string;
  records: Record<string, ProcessedRecord>;
  allTimeEntries?: Record<string, AttendanceRecord[]>;
}

/**
 * Interface pour les propriétés du composant de rapport de département
 */
export interface DepartmentReportProps {
  records: ProcessedRecord[];
  allRecords?: AttendanceRecord[];
  startDate?: string;
  endDate?: string;
}

/**
 * Interface pour les propriétés du composant d'assignation de quart
 */
export interface ShiftAssignmentProps {
  employee: EmployeeData;
  onAssignShift: (employeeId: string, shift: string) => void;
}

/**
 * Interface pour les statistiques de département
 */
export interface DepartmentStats {
  employees: number;
  entries: number;
  onTime: number;
  late: number;
  early: number;
  avgDelay: number;
}

/**
 * Interface pour le résumé des statistiques
 */
export interface SummaryStats {
  totalEmployees: number;
  totalEntries: number;
  onTimeCount: number;
  lateCount: number;
  earlyCount: number;
  averageDelay: number;
  departmentStats: Record<string, DepartmentStats>;
}

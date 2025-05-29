"use client";

import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { 
  Download, 
  Printer, 
  Clock, 
  Info, 
  AlertCircle, 
  FileText, 
  FileSpreadsheet,
  ChevronDown 
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { ProcessedRecord, AttendanceRecord } from "@/lib/actions";
import type { DepartmentReportProps, EmployeeData } from "@/lib/types";
import { ShiftAssignment } from "@/components/shift-assignment";
import {
  determineScheduledTime,
  calculateDelay,
  detectShiftPattern,
  formatTimeEntries,
  ID_SCHEDULED_START_TIME,
  OPERATIONS_GRACE_PERIOD,
  OPERATIONS_SCHEDULES,
} from "@/lib/shift-utils";
import {
  generateSummaryStats,
  exportReportToCSV,
  exportReportToExcel,
  exportReportToPDF,
  groupRecordsByDepartmentAndEmployee,
} from "@/lib/report-utils";

export function DepartmentReport({
  records,
  allRecords = [],
  startDate,
  endDate,
}: DepartmentReportProps) {
  const [selectedDepartment, setSelectedDepartment] = useState<string>("");
  const [selectedEmployee, setSelectedEmployee] = useState<string>("all");
  const [selectedEmployer, setSelectedEmployer] = useState<string>("all");
  const [showHistory, setShowHistory] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<string>("table");
  const [employeeShifts, setEmployeeShifts] = useState<Record<string, string>>(
    {}
  );

  const handleShiftAssignment = (employeeId: string, shift: string) => {
    setEmployeeShifts((prev) => ({
      ...prev,
      [employeeId]: shift,
    }));
  };

  // Groupe les enregistrements par département et employé
  const { employeesByDepartment: employeesByDepartmentBrute, allDates } =
    groupRecordsByDepartmentAndEmployee(records, allRecords);

  const employeesByDepartment = useMemo((): Record<string, EmployeeData[]> => {
    if (selectedEmployee === "all") {
      return employeesByDepartmentBrute;
    }

    const filtered: Record<string, EmployeeData[]> = {};

    Object.entries(employeesByDepartmentBrute).forEach(([dept, employees]) => {
      filtered[dept] = employees.filter((emp) => emp.id === selectedEmployee);
    });

    return filtered;
  }, [employeesByDepartmentBrute, selectedEmployer]);

  // Extraire les employeurs uniques à partir des données des employés
  const employers = useMemo(() => {
    const allEmployees = Object.values(employeesByDepartment).flat();
    return allEmployees
      .map((emp) => {
        const parts = emp.id.split("-");
        return parts.length > 1 ? parts[0] : "Unknown";
      })
      .filter((value, index, self) => self.indexOf(value) === index)
      .sort();
  }, [employeesByDepartment]);

  // Obtient tous les départements
  const departments = Object.keys(employeesByDepartment).sort();

  // Filtre par département sélectionné
  const filteredDepartments =
    selectedDepartment && selectedDepartment !== "all"
      ? [selectedDepartment]
      : departments;

  // Filtre les employés par employeur sélectionné
  const filteredEmployeesByDepartment = useMemo(() => {
    if (selectedEmployer === "all") {
      return employeesByDepartment;
    }

    const filtered: Record<string, EmployeeData[]> = {};

    Object.entries(employeesByDepartment).forEach(([dept, employees]) => {
      filtered[dept] = employees.filter((emp) =>
        emp.id.startsWith(selectedEmployer + "-")
      );
    });

    return employeesByDepartment;
  }, [employeesByDepartment, selectedEmployer]);

  // Trie les dates
  const sortedDates = Array.from(allDates).sort();

  // Filtre les dates par plage si fournie
  const filteredDates = sortedDates.filter((date) => {
    if (startDate && date < startDate) return false;
    if (endDate && date > endDate) return false;
    return true;
  });

  // Génère les statistiques récapitulatives
  const generateSummary = useMemo(() => {
    return generateSummaryStats(
      filteredDepartments,
      filteredEmployeesByDepartment,
      filteredDates,
      employeeShifts
    );
  }, [
    filteredDepartments,
    filteredEmployeesByDepartment,
    filteredDates,
    employeeShifts,
  ]);

  // Export functions
  const handleExportCSV = () => {
    exportReportToCSV(
      filteredDepartments,
      filteredEmployeesByDepartment,
      filteredDates,
      employeeShifts,
      selectedDepartment,
      showHistory
    );
  };

  const handleExportExcel = () => {
    const summaryStats = generateSummaryStats(
      filteredDepartments,
      filteredEmployeesByDepartment,
      filteredDates,
      employeeShifts
    );
    
    exportReportToExcel(
      filteredDepartments,
      filteredEmployeesByDepartment,
      filteredDates,
      employeeShifts,
      selectedDepartment,
      showHistory,
      summaryStats
    );
  };

  const handleExportPDF = () => {
    exportReportToPDF();
  };

  const handlePrint = () => {
    window.print();
  };

  // Check if Operations department exists
  const hasOperationsDepartment = departments.includes("Operations");

  return (
    <Card className="mt-6">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Department Attendance Report</CardTitle>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2">
            <Label htmlFor="department-select">Department:</Label>
            <Select
              value={selectedDepartment}
              onValueChange={setSelectedDepartment}
            >
              <SelectTrigger id="department-select" className="w-[180px]">
                <SelectValue placeholder="All departments" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All departments</SelectItem>
                {departments.map((dept) => (
                  <SelectItem key={dept} value={dept || "unknown"}>
                    {dept || "Unknown"}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2">
            <Label htmlFor="employee-select">Employé:</Label>
            <Select
              value={selectedEmployee}
              onValueChange={setSelectedEmployee}
            >
              <SelectTrigger id="employee-select" className="w-[180px]">
                <SelectValue placeholder="Tous les employés" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les employés</SelectItem>
                {Object.values(employeesByDepartmentBrute)
                  .flat()
                  .filter(
                    (emp) =>
                      selectedDepartment === "all" ||
                      selectedDepartment === "" ||
                      emp.department === selectedDepartment
                  )
                  .sort((a, b) => a.firstName.localeCompare(b.firstName))
                  .map((emp) => (
                    <SelectItem key={emp.id} value={emp.id}>
                      {emp.firstName}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2">
            <Label htmlFor="history-toggle">Show History:</Label>
            <Select
              value={showHistory ? "yes" : "no"}
              onValueChange={(value) => setShowHistory(value === "yes")}
            >
              <SelectTrigger id="history-toggle" className="w-[100px]">
                <SelectValue placeholder="Yes" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="yes">Yes</SelectItem>
                <SelectItem value="no">No</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <Download className="mr-2 h-4 w-4" />
                  Export
                  <ChevronDown className="ml-2 h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={handleExportCSV}>
                  <FileText className="mr-2 h-4 w-4" />
                  Export as CSV
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleExportExcel}>
                  <FileSpreadsheet className="mr-2 h-4 w-4" />
                  Export as Excel
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleExportPDF}>
                  <FileText className="mr-2 h-4 w-4" />
                  Export as PDF
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            
            <Button variant="outline" size="sm" onClick={handlePrint}>
              <Printer className="mr-2 h-4 w-4" />
              Print
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Department schedule information */}
        {(selectedDepartment === "Operations" ||
          (selectedDepartment === "" && hasOperationsDepartment)) && (
          <div className="mb-4 p-4 bg-muted/30 rounded-md">
            <h3 className="text-sm font-medium mb-2 flex items-center">
              <Clock className="h-4 w-4 mr-2" />
              Operations Department Scheduled Times
            </h3>
            <div className="flex flex-wrap gap-3">
              {OPERATIONS_SCHEDULES.map((schedule, index) => (
                <Badge key={index} variant="outline" className="bg-background">
                  {schedule.label}: {schedule.time.substring(0, 5)}
                </Badge>
              ))}
            </div>
            <div className="mt-2 text-sm text-muted-foreground">
              <p className="flex items-center">
                <AlertCircle className="h-3 w-3 mr-1" />
                <strong>Special rule:</strong> Operations employees arriving up
                to {OPERATIONS_GRACE_PERIOD} minutes before their scheduled time
                are considered on time.
              </p>
            </div>
          </div>
        )}

        {/* Shift assignment rules */}
        {selectedDepartment === "Operations" && hasOperationsDepartment && (
          <div className="mt-4 p-4 bg-muted/20 rounded-md">
            <h3 className="text-sm font-medium mb-2">Shift Assignment Rules</h3>
            <div className="text-sm text-muted-foreground">
              <p>
                The system assigns shifts to employees using these methods (in
                order of priority):
              </p>
              <ol className="list-decimal list-inside mt-1 space-y-1">
                <li>Manual shift assignment (if set)</li>
                <li>Employee ID pattern (if IDs end with M, A, or E)</li>
                <li>Time window proximity (±3 hours from scheduled time)</li>
                <li>Historical pattern analysis (most frequent shift)</li>
                <li>Closest scheduled time (as fallback)</li>
              </ol>
            </div>
          </div>
        )}

        {/* Tabs for different views */}
        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="mb-4 mt-4"
        >
          <TabsList>
            <TabsTrigger value="table">Table View</TabsTrigger>
            <TabsTrigger value="summary">Summary</TabsTrigger>
            {hasOperationsDepartment && (
              <TabsTrigger value="shifts">Shift Management</TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="summary" className="mt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Attendance Overview</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm">Total Employees:</span>
                      <span className="font-medium">
                        {generateSummary.totalEmployees}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Total Entries:</span>
                      <span className="font-medium">
                        {generateSummary.totalEntries}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">On Time:</span>
                      <span className="font-medium">
                        {generateSummary.onTimeCount}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Late:</span>
                      <span className="font-medium text-red-500">
                        {generateSummary.lateCount}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Early:</span>
                      <span className="font-medium text-green-500">
                        {generateSummary.earlyCount}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Average Delay:</span>
                      <span className="font-medium">
                        {Math.round(generateSummary.averageDelay)} minutes
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Department specific stats */}
              {Object.entries(generateSummary.departmentStats).map(
                ([dept, stats]) => (
                  <Card key={dept}>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">
                        {dept} Department
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm">Employees:</span>
                          <span className="font-medium">{stats.employees}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm">Entries:</span>
                          <span className="font-medium">{stats.entries}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm">On Time:</span>
                          <span className="font-medium">{stats.onTime}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm">Late:</span>
                          <span className="font-medium text-red-500">
                            {stats.late}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm">Early:</span>
                          <span className="font-medium text-green-500">
                            {stats.early}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm">Average Delay:</span>
                          <span className="font-medium">
                            {Math.round(stats.avgDelay)} minutes
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              )}
            </div>
          </TabsContent>

          <TabsContent value="table" className="mt-4">
            {filteredDepartments.length > 0 ? (
              <div className="space-y-6">
                {filteredDepartments.map((dept) => {
                  const employees = employeesByDepartment[dept] || [];
                  
                  return employees.map((employee) => (
                    <div key={`${dept}-${employee.id}`} className="rounded-md border">
                      {/* Employee Header */}
                      <div className="bg-muted/30 p-4 border-b">
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="font-medium text-lg">
                              {employee.firstName.toUpperCase()} - {employee.department.toUpperCase()}
                            </h3>
                            <p className="text-sm text-muted-foreground">
                              Employee ID: {employee.id}
                            </p>
                          </div>
                          {employee.department === "Operation".toUpperCase() && (
                            <Badge variant="outline" className="bg-background">
                              {detectShiftPattern(employee)}
                            </Badge>
                          )}
                        </div>
                      </div>

                      {/* Employee Data Table */}
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead>
                            <tr>
                              <th className="border-b border-r p-2 text-left font-medium">
                                Date
                              </th>
                              <th className="border-b border-r p-2 text-center font-medium">
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <div className="flex items-center justify-center">
                                        Scheduled
                                        <Clock className="ml-1 h-3 w-3" />
                                      </div>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      {dept === "Operations" ? (
                                        <div>
                                          <p>Operations Department Schedules:</p>
                                          <ul className="list-disc pl-4 mt-1">
                                            {OPERATIONS_SCHEDULES.map((schedule, i) => (
                                              <li key={i}>
                                                {schedule.label}: {schedule.time.substring(0, 5)}
                                              </li>
                                            ))}
                                          </ul>
                                          <p className="mt-1 text-xs">
                                            <strong>Note:</strong> Employees arriving up to{" "}
                                            {OPERATIONS_GRACE_PERIOD} minutes before scheduled time are considered on time.
                                          </p>
                                        </div>
                                      ) : dept === "ID" ? (
                                        <p>Scheduled start time: 8:00 AM</p>
                                      ) : (
                                        <p>No scheduled time defined</p>
                                      )}
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              </th>
                              <th className="border-b border-r p-2 text-center font-medium">
                                Arrival
                              </th>
                              <th className="border-b border-r p-2 text-center font-medium">
                                Departure
                              </th>
                              <th className="border-b border-r p-2 text-center font-medium">
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <div className="flex items-center justify-center">
                                        Delay/Early
                                        <AlertCircle className="ml-1 h-3 w-3" />
                                      </div>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p>Positive values indicate delays</p>
                                      <p>Negative values indicate early arrivals</p>
                                      {dept === "Operations" && (
                                        <p className="mt-1 font-medium">
                                          Operations: Arrivals up to {OPERATIONS_GRACE_PERIOD} minutes before
                                          scheduled time are considered on time (0min)
                                        </p>
                                      )}
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              </th>
                              <th className="border-b border-r p-2 text-center font-medium">
                                Work Time
                              </th>
                              <th className="border-b border-r p-2 text-center font-medium">
                                Punches
                              </th>
                              {showHistory && (
                                <th className="border-b p-2 text-center font-medium">
                                  History
                                </th>
                              )}
                            </tr>
                          </thead>
                          <tbody>
                            {filteredDates.map((date) => {
                              const record = employee.records[date];
                              const timeEntries = employee.allTimeEntries?.[date] || [];

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

                                return (
                                  <tr key={`${employee.id}-${date}`} className="hover:bg-muted/50">
                                    <td className="border-r p-2 text-left">{date}</td>
                                    <td className="border-r p-2 text-center">
                                      {scheduledTime !== "-" ? scheduledTime.substring(0, 5) : "-"}
                                    </td>
                                    <td className="border-r p-2 text-center">
                                      {record.arrivalTime}
                                    </td>
                                    <td className="border-r p-2 text-center">
                                      {record.departureTime}
                                    </td>
                                    <td className="border-r p-2 text-center">
                                      {delayValue !== "-" ? (
                                        <span
                                          className={
                                            isOnTime
                                              ? "text-blue-500 font-medium"
                                              : isDelay
                                              ? "text-red-500 font-medium"
                                              : "text-green-500 font-medium"
                                          }
                                        >
                                          {isOnTime ? "On time" : delayValue}
                                        </span>
                                      ) : (
                                        "-"
                                      )}
                                    </td>
                                    <td className="border-r p-2 text-center">
                                      {record.duration}
                                    </td>
                                    <td className="border-r p-2 text-center">
                                      {record.punchCount}
                                    </td>
                                    {showHistory && (
                                      <td className="p-2 text-center">
                                        {record.othersPunch.length > 0 ? (
                                          <div className="text-xs">
                                            {record.othersPunch.join(", ")}
                                          </div>
                                        ) : (
                                          <span className="text-xs text-muted-foreground">
                                            No entries
                                          </span>
                                        )}
                                      </td>
                                    )}
                                  </tr>
                                );
                              } else {
                                return (
                                  <tr key={`${employee.id}-${date}`} className="hover:bg-muted/50">
                                    <td className="border-r p-2 text-left">{date}</td>
                                    <td className="border-r p-2 text-center">-</td>
                                    <td className="border-r p-2 text-center">-</td>
                                    <td className="border-r p-2 text-center">-</td>
                                    <td className="border-r p-2 text-center">-</td>
                                    <td className="border-r p-2 text-center">-</td>
                                    <td className="border-r p-2 text-center">-</td>
                                    {showHistory && (
                                      <td className="p-2 text-center">-</td>
                                    )}
                                  </tr>
                                );
                              }
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ));
                })}
              </div>
            ) : (
              <div className="p-8 text-center">
                <p className="text-muted-foreground">
                  No data available for the selected department.
                </p>
              </div>
            )}
          </TabsContent>

          {hasOperationsDepartment && (
            <TabsContent value="shifts" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Operations Department Shift Assignments</CardTitle>
                </CardHeader>
                <CardContent>
                  {employeesByDepartment["Operations"] &&
                  employeesByDepartment["Operations"].length > 0 ? (
                    <div className="space-y-4">
                      <p className="text-sm text-muted-foreground">
                        Assign specific shifts to employees in the Operations
                        department. These assignments will be used to calculate
                        delays accurately.
                      </p>

                      <div className="p-4 bg-muted/20 rounded-md mb-4">
                        <h4 className="text-sm font-medium mb-2">
                          Operations Department Special Rules
                        </h4>
                        <p className="text-sm text-muted-foreground">
                          Employees in the Operations department have a{" "}
                          {OPERATIONS_GRACE_PERIOD}-minute grace period before
                          their scheduled start time. Arrivals within this
                          window are considered "on time" rather than "early".
                        </p>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {employeesByDepartment["Operations"].map((employee) => (
                          <Card key={employee.id} className="p-4">
                            <div className="font-medium">
                              {employee.firstName}
                            </div>
                            <div className="text-sm text-muted-foreground mb-2">
                              ID: {employee.id}
                            </div>
                            <ShiftAssignment
                              employee={employee}
                              onAssignShift={handleShiftAssignment}
                            />
                            <div className="text-xs text-muted-foreground mt-2">
                              Detected pattern: {detectShiftPattern(employee)}
                            </div>
                          </Card>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <p>
                      No Operations department employees found in the selected
                      data.
                    </p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          )}
        </Tabs>
      </CardContent>
    </Card>
  );
}

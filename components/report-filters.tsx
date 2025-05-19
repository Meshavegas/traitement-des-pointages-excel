"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, X } from "lucide-react";
import type { AttendanceReport } from "@/lib/actions";

interface ReportFiltersProps {
  report: AttendanceReport;
  onFiltersChange?: (filters: any) => void;
}

// Extraire les employeurs uniques à partir des données des employés
function extractEmployers(
  employees: Array<{ id: string; firstName: string; department: string }>
): string[] {
  // Extraire l'employeur à partir de l'ID de l'employé (format: EMPLOYER-ID)
  const employers = employees
    .map((emp) => {
      const parts = emp.id.split("-");
      return parts.length > 1 ? parts[0] : "Unknown";
    })
    .filter((value, index, self) => self.indexOf(value) === index) // Supprimer les doublons
    .sort(); // Trier par ordre alphabétique

  return employers;
}

export function ReportFilters({ report, onFiltersChange }: ReportFiltersProps) {
  const [filters, setFilters] = useState({
    search: "",
    department: "",
    employee: "",
    employer: "", // Ajout du filtre par employeur
    startDate: "",
    endDate: "",
  });

  // Update filters
  const updateFilters = (key: string, value: string) => {
    setFilters((prev) => {
      const newFilters = { ...prev, [key]: value };
      if (onFiltersChange) {
        onFiltersChange(newFilters);
      }
      return newFilters;
    });
  };

  // Reset filters
  const resetFilters = () => {
    setFilters({
      search: "",
      department: "",
      employee: "",
      employer: "", // Ajout du filtre par employeur
      startDate: "",
      endDate: "",
    });
    if (onFiltersChange) {
      onFiltersChange({
        search: "",
        department: "",
        employee: "",
        employer: "", // Ajout du filtre par employeur
        startDate: "",
        endDate: "",
      });
    }
  };

  // Set initial date range from report
  useEffect(() => {
    setFilters((prev) => ({
      ...prev,
      startDate: report.dateRange.start,
      endDate: report.dateRange.end,
    }));
  }, [report]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Filter Report</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
          <div className="space-y-2">
            <Label htmlFor="search">Search</Label>
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                id="search"
                placeholder="Search by name..."
                className="pl-8"
                value={filters.search}
                onChange={(e) => updateFilters("search", e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="department">Department</Label>
            <Select
              value={filters.department}
              onValueChange={(value) => updateFilters("department", value)}
            >
              <SelectTrigger id="department" className="w-full">
                <SelectValue placeholder="All Departments" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Departments</SelectItem>
                {report.departments.map((dept) => (
                  <SelectItem key={dept} value={dept || "unknown"}>
                    {dept || "Unknown"}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="employer">Employeur</Label>
            <Select
              value={filters.employer}
              onValueChange={(value) => updateFilters("employer", value)}
            >
              <SelectTrigger id="employer" className="w-full">
                <SelectValue placeholder="Tous les employeurs" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les employeurs</SelectItem>
                {extractEmployers(report.employees).map((employer) => (
                  <SelectItem key={employer} value={employer}>
                    {employer}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="employee">Employé</Label>
            <Select
              value={filters.employee}
              onValueChange={(value) => updateFilters("employee", value)}
            >
              <SelectTrigger id="employee" className="w-full">
                <SelectValue placeholder="Tous les employés" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les employés</SelectItem>
                {report.employees
                  .filter(
                    (emp) =>
                      !filters.employer ||
                      filters.employer === "all" ||
                      emp.id.startsWith(filters.employer + "-")
                  )
                  .map((emp) => (
                    <SelectItem key={emp.id} value={emp.id || "unknown"}>
                      {emp.firstName || "Unknown"} ({emp.id || "N/A"})
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="startDate">Start Date</Label>
            <Input
              id="startDate"
              type="date"
              value={filters.startDate}
              onChange={(e) => updateFilters("startDate", e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="endDate">End Date</Label>
            <Input
              id="endDate"
              type="date"
              value={filters.endDate}
              onChange={(e) => updateFilters("endDate", e.target.value)}
            />
          </div>
        </div>

        <div className="flex justify-end mt-4">
          <Button variant="outline" onClick={resetFilters}>
            <X className="mr-2 h-4 w-4" />
            Reset Filters
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Users } from "lucide-react"
import type { ProcessedRecord } from "@/lib/actions"

interface DashboardStatsProps {
  records: ProcessedRecord[]
}

export function DashboardStats({ records }: DashboardStatsProps) {
  // Calculate statistics
  const uniqueEmployees = new Set(records.map(record => record.employeeId));
  const totalEmployees = uniqueEmployees.size;
  
  const uniqueDepartments = new Set(records.map(record => record.department));
  const totalDepartments = uniqueDepartments.size;
  
  // Calculate unique dates
  const uniqueDates = new Set(records.map(record => record.date));
  const totalDays = uniqueDates.size;
  
  // Calculate average work duration
  let totalMinutes = 0;
  let validRecords = 0;
  
  records.forEach(record => {
    const durationMatch = record.duration.match(/(\d+)h\s+(\d+)m/);
    if (durationMatch) {
      const hours = Number.parseInt(durationMatch[1]);
      const minutes = Number.parseInt(durationMatch[2]);
      totalMinutes += (hours * 60) + minutes;
      validRecords++;
    }
  });
  
  const averageMinutes = validRecords > 0 ? totalMinutes / validRecords : 0;
  const averageHours = Math.floor(averageMinutes / 60);
  const averageRemainingMinutes = Math.floor(averageMinutes % 60);
  const averageDuration = `${averageHours}h ${averageRemainingMinutes}m`;
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Employees</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalEmployees}</div>
          <p className="text-xs text-muted-foreground">
            Across all reports
          </p>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">\

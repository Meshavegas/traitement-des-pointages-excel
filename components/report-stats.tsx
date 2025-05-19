"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, Clock, Calendar, Building } from "lucide-react"
import type { AttendanceReport } from "@/lib/actions"

interface ReportStatsProps {
  report: AttendanceReport
}

export function ReportStats({ report }: ReportStatsProps) {
  // Calculate statistics
  const totalEmployees = report.employees.length
  const totalDepartments = report.departments.length

  // Calculate unique dates
  const uniqueDates = new Set(report.processedRecords.map((record) => record.date))
  const totalDays = uniqueDates.size

  // Calculate average work duration
  let totalMinutes = 0
  let validRecords = 0

  report.processedRecords.forEach((record) => {
    const durationMatch = record.duration.match(/(\d+)h\s+(\d+)m/)
    if (durationMatch) {
      const hours = Number.parseInt(durationMatch[1])
      const minutes = Number.parseInt(durationMatch[2])
      totalMinutes += hours * 60 + minutes
      validRecords++
    }
  })

  const averageMinutes = validRecords > 0 ? totalMinutes / validRecords : 0
  const averageHours = Math.floor(averageMinutes / 60)
  const averageRemainingMinutes = Math.floor(averageMinutes % 60)
  const averageDuration = `${averageHours}h ${averageRemainingMinutes}m`

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Employees</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalEmployees}</div>
          <p className="text-xs text-muted-foreground">Across {totalDepartments} departments</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Average Duration</CardTitle>
          <Clock className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{averageDuration}</div>
          <p className="text-xs text-muted-foreground">Per employee per day</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Days</CardTitle>
          <Calendar className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalDays}</div>
          <p className="text-xs text-muted-foreground">In the current report</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Departments</CardTitle>
          <Building className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalDepartments}</div>
          <p className="text-xs text-muted-foreground">
            {report.departments.slice(0, 2).join(", ")}
            {report.departments.length > 2 ? "..." : ""}
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

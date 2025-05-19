"use client"

import { useState } from "react"
import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { FileSpreadsheet, Search, Calendar, Users, Building } from "lucide-react"
import type { AttendanceReport } from "@/lib/actions"

interface ReportsListProps {
  reports: AttendanceReport[]
}

export function ReportsList({ reports }: ReportsListProps) {
  const [searchTerm, setSearchTerm] = useState("")

  const filteredReports = reports.filter(
    (report) =>
      report.fileName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      report.dateRange.start.includes(searchTerm) ||
      report.dateRange.end.includes(searchTerm),
  )

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString()
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Search className="h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search reports..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-sm"
        />
      </div>

      {filteredReports.length > 0 ? (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>File Name</TableHead>
              <TableHead>Upload Date</TableHead>
              <TableHead>Date Range</TableHead>
              <TableHead>Employees</TableHead>
              <TableHead>Departments</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredReports.map((report) => (
              <TableRow key={report.id}>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <FileSpreadsheet className="h-4 w-4 text-muted-foreground" />
                    {report.fileName}
                  </div>
                </TableCell>
                <TableCell>{formatDate(report.uploadDate)}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    {formatDate(report.dateRange.start)} - {formatDate(report.dateRange.end)}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    {report.employees.length}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Building className="h-4 w-4 text-muted-foreground" />
                    {report.departments.length}
                  </div>
                </TableCell>
                <TableCell>
                  <Button asChild variant="ghost" size="sm">
                    <Link href={`/reports/${report.id}`}>View Report</Link>
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-10 text-center">
            <p className="text-muted-foreground">No matching reports found</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

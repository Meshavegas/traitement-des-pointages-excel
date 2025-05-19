"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Download, Printer } from "lucide-react"
import type { ProcessedRecord } from "@/lib/actions"

interface EmployeeScheduleProps {
  employeeName: string
  employeeId: string
  department: string
  records: ProcessedRecord[]
}

export function EmployeeSchedule({ employeeName, employeeId, department, records }: EmployeeScheduleProps) {
  const [selectedMonth, setSelectedMonth] = useState<string>("")

  // Group records by date
  const recordsByDate = records.reduce(
    (acc, record) => {
      if (!acc[record.date]) {
        acc[record.date] = record
      }
      return acc
    },
    {} as Record<string, ProcessedRecord>,
  )

  // Get unique months from records
  const months = [
    ...new Set(
      records.map((record) => {
        const date = new Date(record.date)
        return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`
      }),
    ),
  ].sort()

  // Filter records by selected month
  const filteredDates = selectedMonth
    ? Object.keys(recordsByDate).filter((date) => date.startsWith(selectedMonth))
    : Object.keys(recordsByDate).sort()

  // Print the schedule
  const handlePrint = () => {
    window.print()
  }

  // Export as CSV
  const handleExport = () => {
    const headers = ["Date", "Arrival", "Departure", "Duration", "Punches"]
    const rows = filteredDates.map((date) => {
      const record = recordsByDate[date]
      return [date, record.arrivalTime, record.departureTime, record.duration, record.punchCount]
    })

    const csvContent = [headers.join(","), ...rows.map((row) => row.join(","))].join("\n")

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.setAttribute("href", url)
    link.setAttribute("download", `schedule-${employeeName}-${selectedMonth || "all"}.csv`)
    link.style.visibility = "hidden"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <Card className="mt-6">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>{employeeName}</CardTitle>
          <p className="text-sm text-muted-foreground">
            ID: {employeeId} | Department: {department}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2">
            <Label htmlFor="month-select">Month:</Label>
            <Select value={selectedMonth} onValueChange={setSelectedMonth}>
              <SelectTrigger id="month-select" className="w-[180px]">
                <SelectValue placeholder="All months" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All months</SelectItem>
                {months.map((month) => (
                  <SelectItem key={month} value={month || "unknown"}>
                    {month
                      ? new Date(`${month}-01`).toLocaleDateString(undefined, { year: "numeric", month: "long" })
                      : "Unknown"}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button variant="outline" size="icon" onClick={handlePrint}>
            <Printer className="h-4 w-4" />
            <span className="sr-only">Print</span>
          </Button>
          <Button variant="outline" size="icon" onClick={handleExport}>
            <Download className="h-4 w-4" />
            <span className="sr-only">Export</span>
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <table className="w-full">
            <thead>
              <tr>
                <th colSpan={3} className="border-b p-2 text-center font-medium">
                  Employee Schedule
                </th>
              </tr>
              <tr>
                <th className="border-b border-r p-2 text-left font-medium"></th>
                <th className="border-b border-r p-2 text-center font-medium">Arrival</th>
                <th className="border-b border-r p-2 text-center font-medium">Departure</th>
                <th className="border-b p-2 text-center font-medium">Punches</th>
              </tr>
            </thead>
            <tbody>
              {filteredDates.length > 0 ? (
                filteredDates.map((date) => {
                  const record = recordsByDate[date]
                  return (
                    <tr key={date} className="hover:bg-muted/50">
                      <td className="border-r p-2 text-left">{date}</td>
                      <td className="border-r p-2 text-center">{record.arrivalTime}</td>
                      <td className="border-r p-2 text-center">{record.departureTime}</td>
                      <td className="p-2 text-center">{record.punchCount}</td>
                    </tr>
                  )
                })
              ) : (
                <tr>
                  <td colSpan={4} className="p-4 text-center text-muted-foreground">
                    No records found for this period
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  )
}

"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { useToast } from "@/components/ui/use-toast"
import { FileSpreadsheet, Calendar, MoreVertical, Download, Trash2, LayoutGrid } from "lucide-react"
import { deleteReport } from "@/lib/actions"
import type { AttendanceReport } from "@/lib/actions"
import Link from "next/link"

interface ReportHeaderProps {
  report: AttendanceReport
}

export function ReportHeader({ report }: ReportHeaderProps) {
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

  const handleDelete = async () => {
    try {
      const result = await deleteReport(report.id)

      if (result.success) {
        toast({
          title: "Report deleted",
          description: "The report has been successfully deleted",
        })
        router.push("/reports")
      } else {
        throw new Error("Failed to delete report")
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete the report",
        variant: "destructive",
      })
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString()
  }

  const handleExportCSV = () => {
    // Create CSV content
    const headers = [
      "Employee ID",
      "Name",
      "Department",
      "Date",
      "Arrival Time",
      "Departure Time",
      "Duration",
      "Punch Count",
    ]
    const rows = report.processedRecords.map((record) => [
      record.employeeId,
      record.firstName,
      record.department,
      record.date,
      record.arrivalTime,
      record.departureTime,
      record.duration,
      record.punchCount,
    ])

    const csvContent = [headers.join(","), ...rows.map((row) => row.join(","))].join("\n")

    // Create and download the file
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.setAttribute("href", url)
    link.setAttribute("download", `attendance-report-${report.id}.csv`)
    link.style.visibility = "hidden"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    toast({
      title: "Report exported",
      description: "The report has been exported as CSV",
    })
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="p-2 rounded-full bg-primary/10">
            <FileSpreadsheet className="h-8 w-8 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">{report.fileName}</h1>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Calendar className="h-4 w-4" />
              <span>
                {formatDate(report.dateRange.start)} - {formatDate(report.dateRange.end)}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" asChild>
            <Link href={`/reports/${report.id}/department-view`}>
              <LayoutGrid className="mr-2 h-4 w-4" />
              Department View
            </Link>
          </Button>

          <Button variant="outline" onClick={handleExportCSV}>
            <Download className="mr-2 h-4 w-4" />
            Export CSV
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setIsDeleteDialogOpen(true)}>
                <Trash2 className="mr-2 h-4 w-4" />
                Delete Report
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the report and all its data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

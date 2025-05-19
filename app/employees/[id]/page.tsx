import { getReports } from "@/lib/actions"
import { notFound } from "next/navigation"
import { EmployeeSchedule } from "@/components/employee-schedule"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"

interface EmployeePageProps {
  params: {
    id: string
  }
}

export default async function EmployeePage({ params }: EmployeePageProps) {
  const reports = await getReports()

  // Find all records for this employee across all reports
  const allRecords = reports.flatMap((report) =>
    report.processedRecords.filter((record) => record.employeeId === params.id),
  )

  if (allRecords.length === 0) {
    notFound()
  }

  // Get employee details from the first record
  const { firstName, department } = allRecords[0]

  return (
    <div className="container py-10">
      <div className="mb-6">
        <Button variant="outline" asChild>
          <Link href="/reports">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Reports
          </Link>
        </Button>
      </div>

      <div className="mb-6">
        <h1 className="text-3xl font-bold">{firstName}</h1>
        <p className="text-muted-foreground">
          Employee ID: {params.id} | Department: {department}
        </p>
      </div>

      <EmployeeSchedule employeeName={firstName} employeeId={params.id} department={department} records={allRecords} />
    </div>
  )
}

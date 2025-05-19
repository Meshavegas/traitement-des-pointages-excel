import { getReports } from "@/lib/actions"
import { ReportsList } from "@/components/reports-list"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Upload } from "lucide-react"

export default async function ReportsPage() {
  const reports = await getReports()

  return (
    <div className="container py-10">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold">Attendance Reports</h1>
        <Button asChild>
          <Link href="/#upload">
            <Upload className="mr-2 h-4 w-4" />
            Upload New File
          </Link>
        </Button>
      </div>

      {reports.length > 0 ? (
        <ReportsList reports={reports} />
      ) : (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <h2 className="text-2xl font-semibold mb-2">No reports found</h2>
          <p className="text-muted-foreground mb-6">Upload an XLSX file to generate your first attendance report</p>
          <Button asChild>
            <Link href="/#upload">
              <Upload className="mr-2 h-4 w-4" />
              Upload XLSX File
            </Link>
          </Button>
        </div>
      )}
    </div>
  )
}

import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Upload, FileSpreadsheet } from "lucide-react"

export function DashboardHeader() {
  return (
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">Overview of employee attendance data</p>
      </div>

      <div className="flex items-center gap-2">
        <Button variant="outline" asChild>
          <Link href="/reports">
            <FileSpreadsheet className="mr-2 h-4 w-4" />
            View Reports
          </Link>
        </Button>
        <Button asChild>
          <Link href="/#upload">
            <Upload className="mr-2 h-4 w-4" />
            Upload New Data
          </Link>
        </Button>
      </div>
    </div>
  )
}

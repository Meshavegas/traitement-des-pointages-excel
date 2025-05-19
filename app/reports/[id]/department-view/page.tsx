import { getReport } from "@/lib/actions";
import { notFound } from "next/navigation";
import { DepartmentReport } from "@/components/department-report";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

interface DepartmentViewPageProps {
  params: {
    id: string;
  };
}

export default async function DepartmentViewPage(context: {
  params: { id: string };
}) {
  const { id } = await context.params;

  const report = await getReport(id);

  if (!report) {
    notFound();
  }

  return (
    <div className="container py-10">
      <div className="mb-6">
        <Button variant="outline" asChild>
          <Link href={`/reports/${id}`}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Report
          </Link>
        </Button>
      </div>

      <div className="mb-6">
        <h1 className="text-3xl font-bold">Department View</h1>
        <p className="text-muted-foreground">
          Report: {report.fileName} | Date Range: {report.dateRange.start} to{" "}
          {report.dateRange.end}
        </p>
      </div>

      <DepartmentReport
        records={report.processedRecords}
        allRecords={report.attendanceRecords}
        startDate={report.dateRange.start}
        endDate={report.dateRange.end}
      />
    </div>
  );
}

import { getReports } from "@/lib/actions";
import { DashboardHeader } from "@/components/dashboard-header";
import { DashboardCharts } from "@/components/dashboard-charts";
import { DashboardStats } from "@/components/dashboard-stats";

export default async function DashboardPage() {
  const reports = await getReports();

  // Combine all processed records from all reports
  const allRecords = reports.flatMap((report) => report.processedRecords);

  return (
    <div className="container py-10">
      <DashboardHeader />
      <div className="mt-8 space-y-8">
        <DashboardStats records={allRecords} />
        <div className="grid grid-cols-1 lg:grid-cols-1 gap-8">
          <DashboardCharts records={allRecords} />
        </div>
      </div>
    </div>
  );
}

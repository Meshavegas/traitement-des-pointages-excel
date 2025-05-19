import { getReport } from "@/lib/actions";
import { notFound } from "next/navigation";
import { ReportHeader } from "@/components/report-header";
import { ReportFilters } from "@/components/report-filters";
import { ReportTable } from "@/components/report-table";
import { ReportStats } from "@/components/report-stats";

interface ReportPageProps {
  params: {
    id: string;
  };
}

export default async function ReportPage(context: { params: { id: string } }) {
  const { id } = await context.params;

  const report = await getReport(id);

  if (!report) {
    notFound();
  }

  return (
    <div className="container py-10">
      <ReportHeader report={report} />
      <div className="mt-8 space-y-8">
        <ReportFilters report={report} />
        <ReportStats report={report} />
        <ReportTable report={report} />
      </div>
    </div>
  );
}

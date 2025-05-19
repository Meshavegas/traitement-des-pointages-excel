import { Clock, FileSpreadsheet, Filter, Users, BarChart, Download } from "lucide-react"

export function Features() {
  return (
    <section className="w-full py-12 md:py-24 lg:py-32 bg-muted/40">
      <div className="container px-4 md:px-6">
        <div className="flex flex-col items-center justify-center space-y-4 text-center">
          <div className="space-y-2">
            <h2 className="text-3xl font-bold tracking-tighter md:text-4xl">Key Features</h2>
            <p className="mx-auto max-w-[700px] text-gray-500 md:text-xl dark:text-gray-400">
              Our platform offers powerful tools to analyze employee attendance data
            </p>
          </div>
        </div>
        <div className="mx-auto grid max-w-5xl grid-cols-1 gap-6 py-12 md:grid-cols-2 lg:grid-cols-3">
          <div className="flex flex-col items-center space-y-2 rounded-lg border p-6 shadow-sm">
            <FileSpreadsheet className="h-12 w-12 text-primary" />
            <h3 className="text-xl font-bold">XLSX Import</h3>
            <p className="text-center text-sm text-gray-500 dark:text-gray-400">
              Import attendance data directly from your access control system's XLSX files
            </p>
          </div>
          <div className="flex flex-col items-center space-y-2 rounded-lg border p-6 shadow-sm">
            <Clock className="h-12 w-12 text-primary" />
            <h3 className="text-xl font-bold">Arrival & Departure</h3>
            <p className="text-center text-sm text-gray-500 dark:text-gray-400">
              Automatically calculate employee arrival and departure times
            </p>
          </div>
          <div className="flex flex-col items-center space-y-2 rounded-lg border p-6 shadow-sm">
            <Filter className="h-12 w-12 text-primary" />
            <h3 className="text-xl font-bold">Advanced Filtering</h3>
            <p className="text-center text-sm text-gray-500 dark:text-gray-400">
              Filter reports by date range, employee name, or department
            </p>
          </div>
          <div className="flex flex-col items-center space-y-2 rounded-lg border p-6 shadow-sm">
            <Users className="h-12 w-12 text-primary" />
            <h3 className="text-xl font-bold">Employee Management</h3>
            <p className="text-center text-sm text-gray-500 dark:text-gray-400">
              Track attendance for unlimited employees across departments
            </p>
          </div>
          <div className="flex flex-col items-center space-y-2 rounded-lg border p-6 shadow-sm">
            <BarChart className="h-12 w-12 text-primary" />
            <h3 className="text-xl font-bold">Visual Analytics</h3>
            <p className="text-center text-sm text-gray-500 dark:text-gray-400">
              View attendance trends and patterns with interactive charts
            </p>
          </div>
          <div className="flex flex-col items-center space-y-2 rounded-lg border p-6 shadow-sm">
            <Download className="h-12 w-12 text-primary" />
            <h3 className="text-xl font-bold">Export Options</h3>
            <p className="text-center text-sm text-gray-500 dark:text-gray-400">
              Export reports in CSV, PDF, or Excel formats for further analysis
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}

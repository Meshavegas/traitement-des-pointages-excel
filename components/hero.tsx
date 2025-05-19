import { Button } from "@/components/ui/button"
import Link from "next/link"

export function Hero() {
  return (
    <section className="w-full py-12 md:py-24 lg:py-32 bg-background">
      <div className="container px-4 md:px-6">
        <div className="flex flex-col items-center space-y-4 text-center">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl lg:text-6xl">
              Employee Attendance Report Generator
            </h1>
            <p className="mx-auto max-w-[700px] text-gray-500 md:text-xl dark:text-gray-400">
              Generate comprehensive reports on employee workdays and departure times from your access control system
              data.
            </p>
          </div>
          <div className="space-x-4">
            <Button asChild>
              <Link href="#upload">Upload XLSX File</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/reports">View Reports</Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  )
}

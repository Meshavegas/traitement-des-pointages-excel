"use client";

import Link from "next/link";
import { ModeToggle } from "@/components/mode-toggle";
import { Button } from "@/components/ui/button";
import { FileSpreadsheet, Home, BarChart } from "lucide-react";
import { usePathname } from "next/navigation";

export function Header() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/6 flex items-center justify-center">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-2">
          <FileSpreadsheet className="h-6 w-6" />
          <Link href="/" className="text-lg font-bold">
            Attendance Reporter
          </Link>
        </div>

        <nav className="hidden md:flex items-center gap-6">
          <Link
            href="/"
            className={`text-sm font-medium transition-colors hover:text-primary ${
              pathname === "/" ? "text-primary" : "text-muted-foreground"
            }`}
          >
            Home
          </Link>
          <Link
            href="/reports"
            className={`text-sm font-medium transition-colors hover:text-primary ${
              pathname === "/reports" ? "text-primary" : "text-muted-foreground"
            }`}
          >
            Reports
          </Link>
          {/* <Link
            href="/dashboard"
            className={`text-sm font-medium transition-colors hover:text-primary ${
              pathname === "/dashboard"
                ? "text-primary"
                : "text-muted-foreground"
            }`}
          >
            Dashboard
          </Link> */}
        </nav>

        <div className="flex items-center gap-2">
          <ModeToggle />
          <div className="block md:hidden">
            <Button variant="ghost" size="icon" asChild>
              <Link href="/">
                <Home className="h-5 w-5" />
                <span className="sr-only">Home</span>
              </Link>
            </Button>
            <Button variant="ghost" size="icon" asChild>
              <Link href="/reports">
                <FileSpreadsheet className="h-5 w-5" />
                <span className="sr-only">Reports</span>
              </Link>
            </Button>
            <Button variant="ghost" size="icon" asChild>
              <Link href="/dashboard">
                <BarChart className="h-5 w-5" />
                <span className="sr-only">Dashboard</span>
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}

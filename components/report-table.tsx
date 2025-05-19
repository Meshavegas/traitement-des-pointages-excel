"use client"

import { useState, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"
import { Input } from "@/components/ui/input"
import { Search } from "lucide-react"
import Link from "next/link"
import type { AttendanceReport } from "@/lib/actions"

interface ReportTableProps {
  report: AttendanceReport
}

export function ReportTable({ report }: ReportTableProps) {
  const [currentPage, setCurrentPage] = useState(1)
  const [searchTerm, setSearchTerm] = useState("")
  const [filters, setFilters] = useState({
    department: "",
    employee: "",
    startDate: "",
    endDate: "",
  })

  const itemsPerPage = 10

  // Apply filters and search
  const filteredRecords = useMemo(() => {
    return report.processedRecords.filter((record) => {
      // Search term filter
      const searchMatch =
        record.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        record.employeeId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        record.department.toLowerCase().includes(searchTerm.toLowerCase())

      // Department filter
      const departmentMatch = !filters.department || record.department === filters.department

      // Employee filter
      const employeeMatch = !filters.employee || record.employeeId === filters.employee

      // Date range filter
      const dateObj = new Date(record.date)
      const startDateObj = filters.startDate ? new Date(filters.startDate) : null
      const endDateObj = filters.endDate ? new Date(filters.endDate) : null

      const dateMatch = (!startDateObj || dateObj >= startDateObj) && (!endDateObj || dateObj <= endDateObj)

      return searchMatch && departmentMatch && employeeMatch && dateMatch
    })
  }, [report.processedRecords, searchTerm, filters])

  // Calculate pagination
  const totalPages = Math.ceil(filteredRecords.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const paginatedRecords = filteredRecords.slice(startIndex, startIndex + itemsPerPage)

  // Handle page change
  const handlePageChange = (page: number) => {
    setCurrentPage(page)
  }

  // Update filters from ReportFilters component
  const handleFiltersChange = (newFilters: any) => {
    setSearchTerm(newFilters.search || "")
    setFilters({
      department: newFilters.department || "",
      employee: newFilters.employee || "",
      startDate: newFilters.startDate || "",
      endDate: newFilters.endDate || "",
    })
    setCurrentPage(1) // Reset to first page when filters change
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Attendance Records</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="mb-4 flex items-center gap-4">
          <Search className="h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search records..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value)
              setCurrentPage(1) // Reset to first page when search changes
            }}
            className="max-w-sm"
          />
          <div className="ml-auto text-sm text-muted-foreground">
            Showing {filteredRecords.length} of {report.processedRecords.length} records
          </div>
        </div>

        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Employee ID</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Arrival</TableHead>
                <TableHead>Departure</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead>Punches</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedRecords.length > 0 ? (
                paginatedRecords.map((record, index) => (
                  <TableRow key={`${record.employeeId}-${record.date}-${index}`}>
                    <TableCell>
                      <Link href={`/employees/${record.employeeId}`} className="text-primary hover:underline">
                        {record.employeeId}
                      </Link>
                    </TableCell>
                    <TableCell>{record.firstName}</TableCell>
                    <TableCell>{record.department}</TableCell>
                    <TableCell>{record.date}</TableCell>
                    <TableCell>{record.arrivalTime}</TableCell>
                    <TableCell>{record.departureTime}</TableCell>
                    <TableCell>{record.duration}</TableCell>
                    <TableCell>{record.punchCount}</TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={8} className="h-24 text-center">
                    No records found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {totalPages > 1 && (
          <div className="mt-4">
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    href="#"
                    onClick={(e) => {
                      e.preventDefault()
                      if (currentPage > 1) handlePageChange(currentPage - 1)
                    }}
                    className={currentPage === 1 ? "pointer-events-none opacity-50" : ""}
                  />
                </PaginationItem>

                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum

                  if (totalPages <= 5) {
                    // Show all pages if 5 or fewer
                    pageNum = i + 1
                  } else if (currentPage <= 3) {
                    // Near the start
                    pageNum = i + 1
                  } else if (currentPage >= totalPages - 2) {
                    // Near the end
                    pageNum = totalPages - 4 + i
                  } else {
                    // In the middle
                    pageNum = currentPage - 2 + i
                  }

                  return (
                    <PaginationItem key={pageNum}>
                      <PaginationLink
                        href="#"
                        onClick={(e) => {
                          e.preventDefault()
                          handlePageChange(pageNum)
                        }}
                        isActive={currentPage === pageNum}
                      >
                        {pageNum}
                      </PaginationLink>
                    </PaginationItem>
                  )
                })}

                {totalPages > 5 && currentPage < totalPages - 2 && (
                  <>
                    <PaginationItem>
                      <PaginationEllipsis />
                    </PaginationItem>
                    <PaginationItem>
                      <PaginationLink
                        href="#"
                        onClick={(e) => {
                          e.preventDefault()
                          handlePageChange(totalPages)
                        }}
                      >
                        {totalPages}
                      </PaginationLink>
                    </PaginationItem>
                  </>
                )}

                <PaginationItem>
                  <PaginationNext
                    href="#"
                    onClick={(e) => {
                      e.preventDefault()
                      if (currentPage < totalPages) handlePageChange(currentPage + 1)
                    }}
                    className={currentPage === totalPages ? "pointer-events-none opacity-50" : ""}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

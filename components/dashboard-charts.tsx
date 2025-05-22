"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from "@/components/ui/chart";
import {
  BarChart as RechartsBarChart,
  Bar,
  XAxis,
  YAxis,
  ResponsiveContainer,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
} from "recharts";
import type { ProcessedRecord } from "@/lib/actions";

interface DashboardChartsProps {
  records: ProcessedRecord[];
}

export function DashboardCharts({ records }: DashboardChartsProps) {
  // Calculate attendance status distribution
  const attendanceStats = records.reduce(
    (acc, record) => {
      const delayMatch = record.duration.match(/(\d+)h\s+(\d+)m/);
      if (!delayMatch) return acc;

      const scheduledTime = "08:00"; // Default scheduled time
      const [arrivalHours, arrivalMinutes] = record.arrivalTime
        .split(":")
        .map(Number);
      const [schedHours, schedMinutes] = scheduledTime.split(":").map(Number);

      const arrivalInMinutes = arrivalHours * 60 + arrivalMinutes;
      const schedInMinutes = schedHours * 60 + schedMinutes;

      const diff = arrivalInMinutes - schedInMinutes;

      if (diff <= -15) {
        acc.early++;
      } else if (diff <= 5) {
        acc.onTime++;
      } else {
        acc.late++;
      }

      return acc;
    },
    { early: 0, onTime: 0, late: 0 }
  );

  const attendanceData = [
    { name: "Early", value: attendanceStats.early, color: "#22c55e" },
    { name: "On Time", value: attendanceStats.onTime, color: "#3b82f6" },
    { name: "Late", value: attendanceStats.late, color: "#ef4444" },
  ];

  // Calculate department distribution
  const departmentStats = records.reduce((acc, record) => {
    acc[record.department] = (acc[record.department] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const departmentData = Object.entries(departmentStats)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);

  const chartConfig = {
    early: { label: "Early", color: "#22c55e" },
    onTime: { label: "On Time", color: "#3b82f6" },
    late: { label: "Late", color: "#ef4444" },
  };

  return (
    <div className="grid grid-cols-1 gap-4">
      <Card>
        <CardHeader>
          <CardTitle>Attendance Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ChartContainer config={chartConfig}>
              <RechartsPieChart>
                <ChartTooltip
                  content={({ active, payload }) => {
                    if (!active || !payload) return null;

                    return (
                      <ChartTooltipContent>
                        {payload.map((item: any) => (
                          <div
                            key={item.name}
                            className="flex items-center gap-2"
                          >
                            <div
                              className="h-2 w-2 rounded-full"
                              style={{ backgroundColor: item.payload.color }}
                            />
                            <span>{item.name}:</span>
                            <span className="font-bold">{item.value}</span>
                          </div>
                        ))}
                      </ChartTooltipContent>
                    );
                  }}
                />
                <Pie
                  data={attendanceData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  label={({ name, value }) => `${name}: ${value}`}
                >
                  {attendanceData.map((entry, index) => (
                    <Cell key={entry.name} fill={entry.color} />
                  ))}
                </Pie>
                <ChartLegend
                  content={({ payload }) => (
                    <ChartLegendContent payload={payload} />
                  )}
                />
              </RechartsPieChart>
            </ChartContainer>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Department Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <RechartsBarChart data={departmentData}>
                <XAxis dataKey="name" />
                <YAxis />
                <ChartTooltip
                  content={({ active, payload }) => {
                    if (!active || !payload) return null;

                    return (
                      <ChartTooltipContent>
                        {payload.map((item: any) => (
                          <div
                            key={item.name}
                            className="flex items-center gap-2"
                          >
                            <span>{item.name}:</span>
                            <span className="font-bold">{item.value}</span>
                          </div>
                        ))}
                      </ChartTooltipContent>
                    );
                  }}
                />
                <Bar dataKey="value" fill="#3b82f6" />
              </RechartsBarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

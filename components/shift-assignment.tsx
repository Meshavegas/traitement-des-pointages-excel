"use client";

import { useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { ShiftAssignmentProps } from "@/lib/types";
import { determineDefaultShift } from "@/lib/shift-utils";

/**
 * Composant pour la gestion de l'assignation des quarts de travail
 */
export function ShiftAssignment({
  employee,
  onAssignShift,
}: ShiftAssignmentProps) {
  const [selectedShift, setSelectedShift] = useState<string>(
    employee.department === "Operations" ? determineDefaultShift(employee) : "-"
  );

  const handleShiftChange = (value: string) => {
    setSelectedShift(value);
    onAssignShift(employee.id, value);
  };

  return (
    <div className="flex items-center gap-2 mt-1">
      <Select
        value={selectedShift}
        onValueChange={handleShiftChange}
        disabled={employee.department !== "Operations"}
      >
        <SelectTrigger className="h-7 text-xs w-[120px]">
          <SelectValue placeholder="Select shift" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="06:00:00">Morning (6:00)</SelectItem>
          <SelectItem value="13:00:00">Afternoon (13:00)</SelectItem>
          <SelectItem value="19:30:00">Evening (19:30)</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}

import { Clock01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useState } from "react";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const periods = [
  { value: "1h", label: "Last hour" },
  { value: "24h", label: "Last 24 hours" },
  { value: "7d", label: "Last 7 days" },
  { value: "30d", label: "Last 30 days" },
] as const;

export function PeriodSelector() {
  const [period, setPeriod] = useState("24h");

  const handleValueChange = (value: string | null) => {
    if (value) {
      setPeriod(value);
    }
  };

  return (
    <Select value={period} onValueChange={handleValueChange}>
      <SelectTrigger size="sm" className="gap-1.5">
        <HugeiconsIcon
          icon={Clock01Icon}
          size={12}
          className="text-muted-foreground"
        />
        <SelectValue />
      </SelectTrigger>
      <SelectContent align="end">
        {periods.map((p) => (
          <SelectItem key={p.value} value={p.value}>
            {p.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

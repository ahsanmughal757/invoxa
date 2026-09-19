"use client";

import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface DataTableProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export function DataTable({ className, children, ...props }: DataTableProps) {
  return (
    <div
      className={cn("overflow-hidden rounded-lg border bg-card", className)}
      {...props}
    >
      {children}
    </div>
  );
}

type SortOrder = "asc" | "desc";

interface SortableHeaderProps {
  label: string;
  sortKey: string;
  sortBy: string;
  sortOrder: SortOrder;
  onSort: (key: string) => void;
  align?: "left" | "right";
  className?: string;
}

export function SortableHeader({
  label,
  sortKey,
  sortBy,
  sortOrder,
  onSort,
  align = "left",
  className,
}: SortableHeaderProps) {
  const isActive = sortBy === sortKey;
  return (
    <th
      className={cn(
        "h-11 px-4 text-left align-middle font-medium text-muted-foreground",
        align === "right" && "text-right",
        className,
      )}
    >
      <button
        type="button"
        onClick={() => onSort(sortKey)}
        className={cn(
          "inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-wide transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded",
          isActive && "text-foreground",
        )}
      >
        {label}
        {isActive ? (
          sortOrder === "asc" ? (
            <ArrowUp className="h-3.5 w-3.5" />
          ) : (
            <ArrowDown className="h-3.5 w-3.5" />
          )
        ) : (
          <ArrowUpDown className="h-3.5 w-3.5 opacity-40" />
        )}
      </button>
    </th>
  );
}
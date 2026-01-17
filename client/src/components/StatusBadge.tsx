import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type TaskStatus = "pending" | "in_progress" | "completed";

interface StatusBadgeProps {
  status: TaskStatus;
  className?: string;
}

const statusConfig = {
  pending: {
    label: "Pending",
    className: "bg-gradient-to-r from-amber-100 to-orange-100 text-amber-800 border-amber-300 shadow-sm dark:from-amber-900/30 dark:to-orange-900/30 dark:text-amber-400 dark:border-amber-700",
  },
  in_progress: {
    label: "In Progress",
    className: "bg-gradient-to-r from-blue-100 to-cyan-100 text-blue-800 border-blue-300 shadow-sm dark:from-blue-900/30 dark:to-cyan-900/30 dark:text-blue-400 dark:border-blue-700",
  },
  completed: {
    label: "Completed",
    className: "bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 border-green-300 shadow-sm dark:from-green-900/30 dark:to-emerald-900/30 dark:text-green-400 dark:border-green-700",
  },
};

export default function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = statusConfig[status];
  
  return (
    <Badge 
      variant="outline"
      className={cn(
        "rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide",
        config.className,
        className
      )}
      data-testid={`badge-status-${status}`}
    >
      {config.label}
    </Badge>
  );
}

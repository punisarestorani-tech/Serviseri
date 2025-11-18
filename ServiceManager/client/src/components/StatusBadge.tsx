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
    className: "bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800",
  },
  in_progress: {
    label: "In Progress",
    className: "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800",
  },
  completed: {
    label: "Completed",
    className: "bg-green-100 text-green-800 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800",
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

import { Clock, Play, CheckCircle2 } from "lucide-react";

const statusConfig = {
  pending: {
    label: "Pendiente",
    color: "bg-amber-50 text-amber-800 ring-1 ring-amber-300",
    icon: Clock,
  },
  in_progress: {
    label: "En progreso",
    color: "bg-blue-50 text-blue-800 ring-1 ring-blue-300",
    icon: Play,
  },
  completed: {
    label: "Completado",
    color: "bg-emerald-50 text-emerald-800 ring-1 ring-emerald-300",
    icon: CheckCircle2,
  },
} as const;

type Status = keyof typeof statusConfig;

export function StatusBadge({ status }: { status: string }) {
  const config = statusConfig[status as Status] ?? statusConfig.pending;
  const Icon = config.icon;

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${config.color}`}
    >
      <Icon size={12} aria-hidden="true" />
      {config.label}
    </span>
  );
}

export function statusLabel(status: string): string {
  return statusConfig[status as Status]?.label ?? status;
}

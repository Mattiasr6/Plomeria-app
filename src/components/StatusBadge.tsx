const ClockIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="12" cy="12" r="10" />
    <polyline points="12 6 12 12 16 14" />
  </svg>
);

const PlayIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <polygon points="6 3 20 12 6 21 6 3" />
  </svg>
);

const CheckIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M20 6 9 17l-5-5" />
  </svg>
);

const statusConfig = {
  pending: {
    label: "Pendiente",
    color: "bg-amber-50 text-amber-800 ring-1 ring-amber-300",
    icon: ClockIcon,
  },
  in_progress: {
    label: "En progreso",
    color: "bg-blue-50 text-blue-800 ring-1 ring-blue-300",
    icon: PlayIcon,
  },
  completed: {
    label: "Completado",
    color: "bg-emerald-50 text-emerald-800 ring-1 ring-emerald-300",
    icon: CheckIcon,
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
      <Icon />
      {config.label}
    </span>
  );
}

export function statusLabel(status: string): string {
  return statusConfig[status as Status]?.label ?? status;
}

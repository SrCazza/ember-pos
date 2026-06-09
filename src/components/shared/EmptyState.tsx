import { cn } from "@/lib/utils"

interface EmptyStateProps {
  icon?: string | React.ReactNode
  title: string
  description?: string
  action?: React.ReactNode
  className?: string
  variant?: "light" | "dark"
}

export function EmptyState({ icon = "📭", title, description, action, className, variant = "light" }: EmptyStateProps) {
  const isDark = variant === "dark"
  return (
    <div className={cn("flex flex-col items-center justify-center py-16 text-center", className)}>
      {typeof icon === "string" ? (
        <div className="text-4xl mb-3">{icon}</div>
      ) : (
        <div className="mb-4">{icon}</div>
      )}
      <h3 className={cn("text-base font-medium", isDark ? "text-zinc-100" : "text-zinc-900")}>{title}</h3>
      {description && (
        <p className={cn("text-sm mt-1 max-w-xs", isDark ? "text-zinc-400" : "text-zinc-500")}>{description}</p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}

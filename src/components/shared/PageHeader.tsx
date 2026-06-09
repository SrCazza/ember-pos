import { cn } from "@/lib/utils"

interface PageHeaderProps {
  title: string
  description?: string
  actions?: React.ReactNode
  className?: string
  variant?: "light" | "dark"
}

export function PageHeader({ title, description, actions, className, variant = "light" }: PageHeaderProps) {
  const isDark = variant === "dark"
  return (
    <div className={cn("flex items-start justify-between gap-4", className)}>
      <div>
        <h1 className={cn("text-xl font-semibold", isDark ? "text-zinc-100" : "text-zinc-900")}>{title}</h1>
        {description && (
          <p className={cn("text-sm mt-0.5", isDark ? "text-zinc-500" : "text-zinc-500")}>{description}</p>
        )}
      </div>
      {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
    </div>
  )
}

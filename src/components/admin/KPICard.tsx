import { type Icon } from "@phosphor-icons/react"
import { cn } from "@/lib/utils"

interface KPICardProps {
  title: string
  value: string | number
  subtitle?: string
  icon: Icon
  iconBg?: string
  iconColor?: string
  className?: string
}

export function KPICard({
  title,
  value,
  subtitle,
  icon: IconComponent,
  iconBg = "bg-zinc-800",
  iconColor = "text-zinc-400",
  className,
}: KPICardProps) {
  return (
    <div className={cn(
      "bg-zinc-900 rounded-xl border border-zinc-800 p-5 hover:border-zinc-700 transition-colors",
      className
    )}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-semibold text-zinc-500 uppercase tracking-widest">{title}</p>
          <p className="text-3xl font-bold text-zinc-100 mt-2 tabular-nums leading-none">{value}</p>
          {subtitle && <p className="text-xs text-zinc-600 mt-1.5">{subtitle}</p>}
        </div>
        <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center shrink-0", iconBg)}>
          <IconComponent weight="duotone" className={cn("w-5 h-5", iconColor)} />
        </div>
      </div>
    </div>
  )
}

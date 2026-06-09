import { getCategoryIconEntry } from "@/lib/utils/category-icons"

interface CategoryIconProps {
  icon: string
  className?: string
  weight?: "thin" | "light" | "regular" | "bold" | "fill" | "duotone"
}

export function CategoryIcon({ icon, className = "w-5 h-5", weight = "duotone" }: CategoryIconProps) {
  const entry = getCategoryIconEntry(icon)
  if (entry) {
    const { Component } = entry
    return <Component className={className} weight={weight} />
  }
  return <span className="text-base leading-none">{icon}</span>
}

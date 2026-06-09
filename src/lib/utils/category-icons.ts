import {
  ForkKnifeIcon,
  FlameIcon,
  LeafIcon,
  CoffeeIcon,
  FishIcon,
  StarIcon,
  HeartIcon,
  DropIcon,
  SunIcon,
  FireIcon,
  ChefHatIcon,
  WineIcon,
  PizzaIcon,
  HamburgerIcon,
  BowlFoodIcon,
  BreadIcon,
  PepperIcon,
  EggIcon,
  CakeIcon,
  IceCreamIcon,
  ShrimpIcon,
  MartiniIcon,
} from "@phosphor-icons/react/dist/ssr"
import type { Icon } from "@phosphor-icons/react"

export interface CategoryIconEntry {
  name: string
  label: string
  Component: Icon
}

export const CATEGORY_ICONS: CategoryIconEntry[] = [
  { name: "fork-knife",  label: "Comida general",   Component: ForkKnifeIcon },
  { name: "flame",       label: "Parrilla / Carnes", Component: FlameIcon },
  { name: "bowl-food",   label: "Platos de fondo",  Component: BowlFoodIcon },
  { name: "pizza",       label: "Pizza / Pasta",    Component: PizzaIcon },
  { name: "hamburger",   label: "Hamburguesas",     Component: HamburgerIcon },
  { name: "fish",        label: "Mariscos / Pesca",  Component: FishIcon },
  { name: "shrimp",      label: "Mariscos",         Component: ShrimpIcon },
  { name: "leaf",        label: "Vegetariano",      Component: LeafIcon },
  { name: "egg",         label: "Huevos / Brunch",  Component: EggIcon },
  { name: "bread",       label: "Pan / Panadería",  Component: BreadIcon },
  { name: "pepper",      label: "Picante / Especias", Component: PepperIcon },
  { name: "cake",        label: "Postres / Tortas",  Component: CakeIcon },
  { name: "ice-cream",   label: "Helados / Fríos",  Component: IceCreamIcon },
  { name: "coffee",      label: "Café / Infusiones", Component: CoffeeIcon },
  { name: "drop",        label: "Bebidas",          Component: DropIcon },
  { name: "wine",        label: "Vinos / Bar",      Component: WineIcon },
  { name: "martini",     label: "Cócteles",         Component: MartiniIcon },
  { name: "fire",        label: "Picante",          Component: FireIcon },
  { name: "chef-hat",    label: "Chef's picks",     Component: ChefHatIcon },
  { name: "star",        label: "Especiales",       Component: StarIcon },
  { name: "heart",       label: "Favoritos",        Component: HeartIcon },
  { name: "sun",         label: "Desayuno",         Component: SunIcon },
]

export function getCategoryIconEntry(name: string): CategoryIconEntry | undefined {
  return CATEGORY_ICONS.find((e) => e.name === name)
}

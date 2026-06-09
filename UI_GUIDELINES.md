# UI Guidelines — Restaurante POS

> Principios de diseño extraídos y adaptados de Claude Design para este stack:
> Next.js 15 + shadcn/ui + Tailwind CSS v4 + touch-first UI

---

## 1. Filosofía de diseño

Actúa como un diseñador experto, no como un generador de código. Antes de implementar cualquier componente de UI, entiende el vocabulario visual del sistema: paleta, tipografía, densidad, patrones de hover/click, estilos de sombra y card, ritmo de layout.

**Cuando agregues UI a una vista existente:**
- Observa primero el patrón visual vigente y sígüelo.
- Iguala el estilo de copywriting, espaciado, estados hover/active, y densidad.
- No inventes colores nuevos. Usa los tokens definidos en el Design System de este proyecto o usa `oklch` para colores armónicos si el sistema es muy restrictivo.

---

## 2. Reglas de contenido

**No agregar contenido de relleno.** Cada elemento debe justificar su presencia. Si una sección se ve vacía, es un problema de layout y composición, no una invitación a inventar contenido.

**No preguntar antes de agregar secciones, copy o datos** — simplemente no los agregues si no fueron pedidos. El usuario conoce sus requerimientos mejor que Claude.

**Evitar "data slop":** números, íconos o stats innecesarios que no aportan información real. Menos es más.

---

## 3. Anti-patterns a evitar (AI slop)

Nunca usar estos patrones en este proyecto:

- Fondos con gradientes agresivos
- Emojis (a menos que sean parte explícita de la UI)
- Containers con `border-left` de color como acento
- Dibujar íconos o ilustraciones con SVG inline desde cero — usar los de lucide-react o placeholders
- Fuentes genéricas de fallback (Roboto, Arial) — este proyecto usa **Inter** via `next/font`
- `rounded-xl` fuera de modales/overlays (usar `rounded-lg` para cards)

---

## 4. Escala y targets táctiles

Este sistema opera en **iPad (768px) e iPhone (390px)**. Reglas no negociables:

- `min-h-[44px] min-w-[44px]` en **todos** los botones del flujo waiter y kitchen.
- Texto en kitchen display: mesa `text-4xl font-bold`, ítems `text-lg font-medium`.
- Texto mínimo en cualquier UI operativa: `text-sm` (14px). Nunca menor.
- Hit targets en mobile: nunca menos de 44px. Verificar en DevTools antes de marcar como terminado.

---

## 5. Variaciones y exploración

Cuando se pida diseñar o rediseñar una pantalla, ofrecer **al menos 2–3 variaciones** que exploren:

- Una variación conservadora (sigue patrones existentes de shadcn/ui)
- Una variación con tratamiento de color o layout más marcado
- Una variación con diferente densidad o jerarquía visual

No presentar una sola opción como definitiva sin haberla comparado contra alternativas.

---

## 6. Sistema visual establecido

### Colores (tokens del proyecto)

| Token | Valor | Uso |
|-------|-------|-----|
| Primary | `emerald-600` (#059669) | Botones, acciones positivas |
| Background | `white` / `zinc-50` | Surfaces |
| Text primary | `zinc-900` | Body principal |
| Text secondary | `zinc-500` | Labels, metadata |
| Border | `zinc-200` | Divisores, card borders |
| Status pending | `amber-500` | Orden pendiente |
| Status in_kitchen | `blue-600` | En cocina |
| Status ready | `emerald-600` | Lista para entregar |
| Status delivered | `zinc-400` | Entregada |
| Kitchen urgency | `red-500` | >15 min sin resolver |

### Tipografía

- Fuente: **Inter** via `next/font`. Variable CSS: `--font-inter`
- Body: `text-base` | Labels: `text-sm`
- Kitchen — mesa: `text-4xl font-bold` | ítems: `text-lg font-medium`

### Espaciado y forma

- Cards: `rounded-lg shadow-sm`
- Modales/overlays: `rounded-xl shadow-md`
- Touch buttons: `min-h-[44px]`

---

## 7. Uso de color con oklch

Si los tokens actuales son insuficientes para una nueva pantalla, usar `oklch` para definir colores armónicos:

```css
/* Ejemplo: variante más clara del primary */
--color-primary-subtle: oklch(95% 0.05 160);
```

No inventar colores HEX arbitrarios. Si el tono no tiene relación con la paleta emerald/zinc existente, es incorrecto.

---

## 8. CSS avanzado permitido

Aprovechar capacidades modernas de CSS que muchos ignoran:

- `text-wrap: pretty` para párrafos
- CSS Grid con `grid-template-areas` para layouts complejos de kitchen display
- `@container` queries para componentes que cambian según su contexto (CardPanel en mobile vs tablet)
- `transition` y `animation` para estados de orden (pending → in_kitchen → ready)

---

## 9. Integración con 21st.dev (Magic UI MCP)

Cuando se use el MCP de 21st.dev para traer componentes:

1. **Antes de usar un componente de 21st.dev**, verificar que sigue el vocabulary visual de este proyecto (colores, radios, tipografía).
2. Si el componente trae sus propios tokens de color, reemplazarlos con los tokens del Design System de este proyecto.
3. No usar componentes de 21st.dev como están si usan gradientes, bordes de acento, o fuentes distintas a Inter.
4. Preferir componentes minimalistas de 21st.dev sobre los ornamentados.

---

## 10. Handoff a Claude Code

Cuando un diseño en HTML/prototipo esté aprobado y deba implementarse en Next.js:

- Documentar los componentes shadcn/ui usados
- Especificar qué partes son `"use client"` (interactividad) vs Server Component (datos)
- Listar las clases Tailwind no-estándar que necesitan configuración en `tailwind.config.ts`
- Señalar los Realtime subscriptions que necesita el componente (si aplica)

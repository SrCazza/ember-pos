# IMPROVEMENTS.md — Restaurante POS
Mejoras y correcciones de bugs basadas en revisión del estado actual vs referencia Zillo.

---

## 🐛 BUGS CRÍTICOS (arreglar primero)

### BUG-01: Tiempo real no funciona en cocina
**Síntoma:** Las órdenes nuevas no aparecen en la pantalla de cocina hasta que se recarga la página manualmente.
**Causa probable:** La suscripción a Supabase Realtime no está activa o no se está manejando correctamente.
**Solución esperada:** Implementar `supabase.channel().on('postgres_changes', ...)` en el componente de cocina. Las órdenes deben aparecer automáticamente en menos de 2 segundos sin ninguna acción del usuario.

### BUG-02: "Marcar como listo" no hace nada
**Síntoma:** Al presionar "Marcar como listo" en una orden de cocina, los ítems quedan con el check pero la orden no desaparece, no cambia de estado y el camarero no recibe notificación.
**Solución esperada:**
- Al marcar como listo, el estado de la orden debe cambiar a `ready` en la base de datos.
- La orden debe desaparecer de la vista activa de cocina (o moverse a una sección "Listas").
- En la vista "Mis órdenes" del camarero, esa orden debe mostrar el badge `Lista ✓` en lugar de `En Cocina`.
- La mesa correspondiente en el camarero debe mostrar una indicación visual de que hay una orden lista para servir.

---

## 🎨 MEJORAS DE UI/UX

### UI-01: Vista de cocina — cambiar a layout Kanban
**Estado actual:** Lista vertical simple con una sola columna, fondo negro, una card por orden.
**Mejora:** Implementar layout de 3 columnas tipo Kanban:
- Columna 1 — **En cola** (fondo/header morado o naranja oscuro): órdenes recién llegadas
- Columna 2 — **Preparando** (fondo/header naranja): órdenes en proceso
- Columna 3 — **Listas** (fondo/header verde): órdenes terminadas esperando ser recogidas

Cada card debe mostrar: número de mesa, nombre del camarero, tiempo transcurrido desde que llegó la orden, lista de ítems con checkbox individual por ítem, y botón de acción principal según columna ("Iniciar" / "Marcar lista").

Mantener el fondo oscuro para cocina ya que es correcto para ese ambiente.

### UI-02: Indicador de tiempo y alerta de demora en cocina
**Estado actual:** El timer muestra el tiempo transcurrido pero no hay alerta visual cuando se pasa de un umbral.
**Mejora:** Si una orden lleva más de 15 minutos sin marcarse como lista, el timer debe cambiar a color rojo y la card debe tener un borde rojo o badge "Demorada". Esto es crítico para cocina.

### UI-03: Vista de mesas del camarero — reducir tamaño de cards
**Estado actual:** Las cards de mesa son extremadamente grandes (casi un cuarto de pantalla). Con 10 mesas se necesita scroll.
**Mejora:** Reducir el tamaño de las cards para que quepan todas las mesas en una sola pantalla sin scroll en tablet. Estilo más compacto similar a Zillo: número grande centrado, status badge abajo, capacidad abajo. Tamaño aproximado: que entren 4-5 columnas y 2-3 filas visible sin scroll.

### UI-04: Cards de mesa — mostrar info de orden activa
**Estado actual:** Las cards ocupadas solo muestran "OCUPADA" en rojo.
**Mejora:** Cuando una mesa tiene una orden activa, la card debe mostrar adicionalmente:
- Tiempo desde que se tomó la orden (ej. "hace 23 min")
- Nombre del camarero asignado
- Badge del estado actual de la orden (Pendiente / En Cocina / Lista)

Si la orden está "Lista" (cocina la marcó como ready), la card debe resaltarse de forma especial (ej. borde verde pulsante o ícono de campana) para que el camarero sepa que debe ir a recogerla.

### UI-05: Vista de menú del camarero — panel de orden persistente en desktop/tablet
**Estado actual:** El carrito se abre como un drawer lateral que oscurece el menú.
**Mejora:** En pantallas >= 768px (tablet horizontal y desktop), mostrar el panel de orden siempre visible a la derecha (layout de dos columnas: menú a la izquierda, resumen de orden fijo a la derecha). El drawer solo se usa en móvil vertical. El panel derecho debe mostrar: ítems agregados con cantidad y precio, nota por ítem, total, y botón "Enviar a cocina".

### UI-06: Vista "Mis órdenes" del camarero — mejorar diseño
**Estado actual:** Lista simple con poco contraste visual entre estados.
**Mejora:**
- Usar cards con borde de color según estado (amarillo=Pendiente, naranja=En Cocina, verde=Lista, gris=Entregada)
- Mostrar tiempo transcurrido de forma más prominente
- Cuando estado es "Lista", mostrar botón "Marcar como entregada" directamente en la card
- Al marcar como entregada, la mesa vuelve a estado "Libre"

### UI-07: Formulario de nuevo plato — subida de imagen
**Estado actual:** El formulario de "Nuevo plato" no tiene campo para imagen. Los platos en el menú del camarero muestran fotos pero no hay forma de subirlas desde admin.
**Mejora:** Agregar campo de upload de imagen en el formulario de creación/edición de plato:
- Botón "Subir imagen" que abre el selector de archivos (acepta jpg, png, webp, max 2MB)
- Preview de la imagen seleccionada antes de guardar
- Al guardar, subir la imagen a Supabase Storage (bucket: `menu-images`, carpeta: `dishes/`)
- Guardar la URL pública en el campo `image_url` del plato
- Si no se sube imagen, usar un placeholder genérico de comida
- En la edición de plato, mostrar la imagen actual con opción de reemplazarla

### UI-08: Reportes — mejorar gráfica de Top platos
**Estado actual:** La gráfica de barras horizontales tiene las barras del mismo tamaño (bug de escala) y no muestra valores.
**Mejora:**
- Corregir la escala del eje X para que refleje correctamente la cantidad de veces pedido
- Mostrar el valor numérico al final de cada barra
- Agregar colores distintos por barra o usar el color primario con opacidad variable
- Agregar debajo de la gráfica una tabla simple: Plato | Veces pedido | Revenue generado

---

## ✨ FEATURES NUEVAS

### FEAT-01: Estado "Entregada" y flujo completo de orden
**Contexto:** Actualmente el flujo se corta en "Listo" (cocina). Falta el último paso.
**Implementar flujo completo:**
```
Pendiente → En Cocina → Lista → Entregada → (mesa vuelve a Libre)
```
- Cuando cocina marca como "Lista", el camarero ve la notificación en su vista de mesas y en "Mis órdenes"
- El camarero tiene botón "Marcar como entregada" 
- Al marcar entregada, aparece opción "Marcar como pagada" (con método: Efectivo / Tarjeta)
- Al marcar pagada, la mesa vuelve a Libre y la orden queda archivada en historial

### FEAT-02: Notificación visual cuando una orden está lista
**Contexto:** El camarero no sabe cuándo cocina terminó su orden sin revisar activamente.
**Implementar:**
- Cuando una orden cambia a estado `ready`, mostrar un badge numérico en el tab "Mis órdenes" del bottom nav del camarero (ej. el ícono de clipboard con un "1" en rojo)
- La card de la mesa correspondiente debe cambiar visualmente (borde verde + ícono de campana)
- Opcional: sonido de notificación suave (usar Web Audio API, un beep corto)

### FEAT-03: Agregar ítems a una orden ya enviada
**Contexto:** Es común que una mesa pida más cosas después de haber enviado la primera orden.
**Implementar:**
- Desde la card de una mesa ocupada en la vista de mesas del camarero, mostrar botón "Agregar ítems"
- Esto abre el menú nuevamente para esa mesa, y al enviar crea una nueva orden vinculada a la misma mesa (no reemplaza la anterior)
- En cocina, llega como una nueva card con el mismo número de mesa, marcado como "Adición"

### FEAT-04: Dashboard admin — agregar gráfica de órdenes por hora
**Contexto:** El dashboard actual tiene métricas de texto pero solo una vista estática de mesas.
**Implementar:**
- Agregar gráfica de línea o barras que muestre volumen de órdenes por hora del día (eje X: horas 12pm-11pm, eje Y: cantidad de órdenes)
- Usar los datos reales del día seleccionado (Hoy / 7 días / 30 días)
- Esto permite al gerente identificar horas pico

---

### FEAT-05: Notificación de nueva orden en cocina
**Contexto:** El cocinero puede no darse cuenta visualmente de que llegó una nueva orden si está ocupado.
**Implementar:**
- Cuando el camarero envía una orden, reproducir un sonido de notificación corto en la pantalla de cocina (usar Web Audio API, tono suave tipo "ding")
- Mostrar un toast en la esquina superior derecha: "Nueva orden — Mesa X" que desaparece después de 4 segundos
- La nueva card de orden debe aparecer con una animación de entrada (slide-in o fade-in) para que sea visualmente obvio que es nueva

---

### UI-09: Reemplazar librería de iconos por Phosphor Icons
**Estado actual:** Los iconos actuales son básicos y no encajan bien con la estética de la app.
**Mejora:**
- Instalar `@phosphor-icons/react`
- Reemplazar todos los iconos actuales de la app por equivalentes de Phosphor, usando peso `regular` por defecto y `bold` o `fill` para estados activos/seleccionados
- Phosphor tiene variantes por peso que permiten diferenciar estados sin cambiar el icono: por ejemplo, nav item inactivo = `regular`, activo = `fill`
- Aplicar de forma consistente en toda la app: navegación, botones, badges de estado, formularios

---

## 🔧 MEJORAS MENORES

### MINOR-01: Nombre de usuario en lugar de email
En todas las vistas del camarero, mostrar el nombre del usuario (ej. "Juan") en lugar del email completo en el header. Agregar campo `name` a la tabla de usuarios si no existe.

### MINOR-02: Confirmación antes de enviar a cocina
Antes de enviar la orden, mostrar un modal de confirmación con el resumen: mesa, ítems, total. Botones: "Revisar" y "Confirmar y enviar". Evita envíos accidentales.

### MINOR-03: Búsqueda de platos en el menú del camarero
El campo de búsqueda ya existe visualmente pero verificar que esté funcionando. Debe filtrar en tiempo real por nombre de plato mientras el camarero escribe.

### MINOR-04: Estado vacío en cocina
Cuando no hay órdenes activas, la pantalla de cocina muestra un fondo negro vacío. Agregar un estado vacío con ícono y texto: "Sin órdenes activas" centrado en pantalla.

---

## 📋 ORDEN DE IMPLEMENTACIÓN RECOMENDADO

1. BUG-01 (tiempo real cocina) — bloquea todo lo demás
2. BUG-02 (marcar como listo) — flujo roto
3. FEAT-01 (flujo completo Entregada + Pagada)
4. FEAT-02 (notificación orden lista al camarero)
5. FEAT-05 (notificación nueva orden a cocina)
6. UI-07 (upload de imagen en platos)
7. UI-01 (kanban cocina)
8. UI-02 (alerta demora cocina)
9. UI-04 (info orden en card de mesa)
10. UI-05 (panel orden persistente tablet)
11. UI-03 (cards mesas más compactas)
12. UI-06 (mis órdenes mejorado)
13. FEAT-03 (agregar ítems a orden existente)
14. UI-08 (reportes gráfica corregida)
15. FEAT-04 (gráfica órdenes por hora)
16. UI-09 (reemplazo de iconos con Phosphor)
17. MINOR-01 al MINOR-04

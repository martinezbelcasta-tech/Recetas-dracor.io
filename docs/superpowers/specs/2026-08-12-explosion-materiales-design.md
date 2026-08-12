# Explosión de materiales (BOM) en Consolidado

**Fecha:** 2026-08-12
**Estado:** aprobado, listo para implementar

## Objetivo

En el módulo **Consolidado**, agregar un botón **"Ver explosión"** en cada fila (junto al código).
Al pulsarlo se abre un **panel lateral (drawer)** que muestra la **explosión de materiales hacia
abajo** del producto: todo lo que lleva, multinivel, hasta materia prima, con un **roll-up** de totales
separado por Materia Prima / Empaque. Inspirado en el ERP Sanchia ("Materiales por Producto").

Fuente de recetas: **hoy** las recetas ya creadas en Supabase (Productos Terminados + Semiterminados).
**Mañana** una API externa las reemplaza — el diseño aísla la fuente para que ese cambio sea de una
sola función.

## Modelo de datos (existente)

- **PT** `productos_terminados` → `producto_items`: `{ comp_codigo, comp_nombre, unidad, cantidad, ubi_codigo, ubi_nombre }`. `foto_url` en la cabecera.
- **ST** `semiterminados` → `semiterminado_items`: `{ mp_codigo, mp_nombre, kg, unidad, ubi_codigo, ubi_nombre }`. `foto_url` en la cabecera.
- Consolidado: ítems `{ codigo, nombre, categoria }` desde API Sanchia (sin foto). La foto sale de la receta.

## Arquitectura

Tres piezas desacopladas + el cableado:

### 1. `src/lib/explosion.js` — lógica pura (sin React)

Contratos exactos:

```js
// Receta normalizada (unifica PT y ST a una sola forma)
// receta = {
//   codigo, nombre, tipo: 'PT' | 'ST', foto,               // foto = foto_url | null
//   componentes: [{ codigo, nombre, cantidad, unidad, ubi_codigo, ubi_nombre }]
// }

// buildRecipeIndex({ productos, semiterminados }) -> Map<string, receta>
//   productos:      array tal cual lo devuelve getProductosTerminados()
//   semiterminados: array tal cual lo devuelve getSemiterminados()
//   Normaliza: PT.items.comp_codigo/comp_nombre/cantidad -> componente;
//              ST.items.mp_codigo/mp_nombre/kg           -> componente (cantidad = kg).
//   Clave del Map = codigo. Si un codigo choca PT vs ST, gana PT (poco probable).
export function buildRecipeIndex({ productos = [], semiterminados = [] }) { ... }

// Nodo del arbol de explosion
// nodo = {
//   codigo, nombre, tipo,               // tipo: 'PT' | 'ST' | 'MP' (hoja sin receta)
//   cantidad, unidad, ubi_nombre,
//   esHoja: boolean,                    // true si no tiene receta en el index
//   ciclo: boolean,                     // true si se corto por referencia circular
//   hijos: [nodo, ...]
// }
// explotar(codigo, index, { maxDepth = 20 } = {}) -> nodo (el nodo raiz = el propio producto, cantidad 1)
//   Recursivo. Guarda anti-ciclos con un Set de codigos visitados POR RAMA.
//   Al superar maxDepth, corta y marca esHoja.
export function explotar(codigo, index, opts = {}) { ... }

// rollupMaterias(nodoRaiz) -> { materiaPrima: linea[], empaque: linea[] }
//   linea = { codigo, nombre, unidad, cantidad }
//   Suma SOLO las hojas, agrupando por (codigo + unidad). Cantidad efectiva = producto
//   de cantidades bajando por la rama. Clasifica por prefijo del codigo:
//   'ME' -> empaque, resto -> materiaPrima.
export function rollupMaterias(nodoRaiz) { ... }
```

Deja **un self-check con asserts** (`explosion.selfcheck.js` o `if (import.meta.vitest)`... — sin
framework, un `demo()` con asserts sirve) que verifique: explosión de 2 niveles, roll-up multiplicando
cantidades, y corte de ciclo A→B→A.

### 2. `getRecetasParaExplosion()` en `src/lib/db.js` — la fuente (punto de extensión)

```js
// Hoy: junta lo que ya existe. Manana: se reemplaza por la API.
export async function getRecetasParaExplosion() {
  const [productos, semiterminados] = await Promise.all([
    getProductosTerminados(),
    getSemiterminados(),
  ])
  return { productos, semiterminados }
}
```

### 3. `src/components/ExplosionDrawer.jsx` — panel lateral

Props: `{ codigo, index, onClose }` (recibe el `index` ya construido; no hace fetch).
- Drawer desde la derecha con overlay; cierra con **Esc** y click en overlay (mismo patrón que los
  modales existentes, ver `ProductoTerminadoForm` `SearchModal` y `ZoomableImg`). Usa `createPortal`.
- Cabecera: **foto** del producto (de la receta) + código + nombre.
- Cuerpo: tabla multinivel con columnas **Material (código + nombre) · Unidad · Cantidad · Ubicación de
  Salida**. Cada nodo con hijos se puede **expandir/colapsar** (indentado). Nivel 1 expandido por defecto.
- Pie: **Total roll-up** en dos bloques, **Materia Prima** y **Empaque**.
- Estados: `index` sin el código → "Este producto no tiene receta cargada"; nodo con `ciclo` → marca ⟳.

### 4. Cableado en `src/pages/Consolidado.jsx`

- Botón **"Ver explosión"** por fila, junto al código.
- Carga de recetas **perezosa** (al primer click) con `getRecetasParaExplosion()` → `buildRecipeIndex`,
  guardada en estado y **cacheada en memoria** (no re-fetch por click). Muestra spinner mientras carga.
- Abre `<ExplosionDrawer codigo={...} index={...} onClose={...} />`.

## Flujo

click "Ver explosión" → (1ª vez) `getRecetasParaExplosion()` → `buildRecipeIndex` → guardar index →
render `ExplosionDrawer` → `explotar(codigo, index)` + `rollupMaterias` → árbol + totales.

## Casos borde

- **Ciclos**: Set de visitados por rama → corta, marca ⟳, no cuelga.
- **Profundidad**: `maxDepth` de seguridad (20).
- **Unidades mixtas** (u / kg): el roll-up agrupa por (código + unidad), nunca suma unidades distintas.
- **Cantidades vacías / NaN**: tratar como 0.
- **Hoja sin receta**: es MP/empaque, se muestra como fila final sin hijos.

## Fuera de alcance (YAGNI)

- Where-used / implosión hacia arriba.
- Exportar a Excel/PDF.
- Costeo (precios). Solo cantidades.
- Persistir la explosión; se calcula al vuelo.

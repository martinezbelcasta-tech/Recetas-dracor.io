// Explosión de materiales (BOM) — lógica pura, sin React ni red.
// Contratos exactos según docs/superpowers/specs/2026-08-12-explosion-materiales-design.md

// receta = {
//   codigo, nombre, tipo: 'PT' | 'ST', foto,
//   componentes: [{ codigo, nombre, cantidad, unidad, ubi_codigo, ubi_nombre }]
// }

// Convierte cualquier valor a número; vacío/NaN → 0.
function num(v) {
  const n = Number(v)
  return Number.isFinite(n) ? n : 0
}

// buildRecipeIndex({ productos, semiterminados }) -> Map<codigo, receta>
// Normaliza PT y ST a una sola forma. Si un código choca PT vs ST, gana PT.
export function buildRecipeIndex({ productos = [], semiterminados = [] } = {}) {
  const index = new Map()

  // ST primero: si un código choca, el PT lo sobrescribe después (gana PT).
  for (const st of semiterminados) {
    const receta = {
      codigo: st.codigo,
      nombre: st.nombre,
      tipo: 'ST',
      foto: st.foto_url ?? st.foto_preview ?? null,
      componentes: (st.items || []).map(it => ({
        codigo: it.mp_codigo,
        nombre: it.mp_nombre,
        cantidad: num(it.kg),
        unidad: it.unidad,
        ubi_codigo: it.ubi_codigo,
        ubi_nombre: it.ubi_nombre,
      })),
    }
    index.set(receta.codigo, receta)
  }

  for (const pt of productos) {
    const receta = {
      codigo: pt.codigo,
      nombre: pt.nombre,
      tipo: 'PT',
      foto: pt.foto_url ?? pt.foto_preview ?? null,
      componentes: (pt.items || []).map(it => ({
        codigo: it.comp_codigo,
        nombre: it.comp_nombre,
        cantidad: num(it.cantidad),
        unidad: it.unidad,
        ubi_codigo: it.ubi_codigo,
        ubi_nombre: it.ubi_nombre,
      })),
    }
    index.set(receta.codigo, receta) // PT gana ante ST con el mismo código
  }

  return index
}

// nodo = {
//   codigo, nombre, tipo, cantidad, unidad, ubi_nombre,
//   esHoja: boolean, ciclo: boolean, hijos: [nodo, ...]
// }
// explotar(codigo, index, { maxDepth = 20 }) -> nodo raíz (cantidad 1)
export function explotar(codigo, index, { maxDepth = 20 } = {}) {
  // Construye un nodo a partir de un componente (o del raíz) y recursa.
  function build(comp, visitados, depth) {
    const receta = index.get(comp.codigo)

    const nodo = {
      codigo: comp.codigo,
      nombre: comp.nombre,
      tipo: receta ? receta.tipo : 'MP',
      cantidad: comp.cantidad,
      unidad: comp.unidad,
      ubi_nombre: comp.ubi_nombre,
      esHoja: false,
      ciclo: false,
      hijos: [],
    }

    // Sin receta en el index → hoja (MP/empaque).
    if (!receta) {
      nodo.esHoja = true
      return nodo
    }

    // Referencia circular en esta rama → cortar y marcar.
    if (visitados.has(comp.codigo)) {
      nodo.ciclo = true
      nodo.esHoja = true
      return nodo
    }

    // Límite de profundidad → cortar.
    if (depth >= maxDepth) {
      nodo.esHoja = true
      return nodo
    }

    // Clon del set por rama (no compartir entre hermanos).
    const visitadosRama = new Set(visitados)
    visitadosRama.add(comp.codigo)

    nodo.hijos = receta.componentes.map(c => build(c, visitadosRama, depth + 1))
    return nodo
  }

  const receta = index.get(codigo)
  const raizComp = {
    codigo,
    nombre: receta ? receta.nombre : codigo,
    cantidad: 1,
    unidad: receta ? receta.tipo : undefined,
    ubi_nombre: undefined,
  }

  return build(raizComp, new Set(), 0)
}

// rollupMaterias(nodoRaiz) -> { materiaPrima: linea[], empaque: linea[] }
// linea = { codigo, nombre, unidad, cantidad }
// Suma SOLO las hojas, agrupando por (codigo + '|' + unidad).
// Cantidad efectiva = producto de cantidades bajando por la rama (raíz cuenta como 1).
// 'ME' -> empaque, resto -> materiaPrima.
export function rollupMaterias(nodoRaiz) {
  const acum = new Map() // clave = codigo|unidad -> linea

  function recorrer(nodo, factorPadre) {
    const factor = factorPadre * num(nodo.cantidad)

    if (nodo.esHoja) {
      const unidad = nodo.unidad ?? ''
      const clave = nodo.codigo + '|' + unidad
      const prev = acum.get(clave)
      if (prev) {
        prev.cantidad += factor
      } else {
        acum.set(clave, {
          codigo: nodo.codigo,
          nombre: nodo.nombre,
          unidad: nodo.unidad,
          cantidad: factor,
        })
      }
      return
    }

    for (const hijo of nodo.hijos) recorrer(hijo, factor)
  }

  // La raíz cuenta como 1: arrancamos el factor en 1 y multiplicamos su cantidad (=1).
  recorrer(nodoRaiz, 1)

  const materiaPrima = []
  const empaque = []
  for (const linea of acum.values()) {
    if ((linea.codigo || '').startsWith('ME')) empaque.push(linea)
    else materiaPrima.push(linea)
  }

  return { materiaPrima, empaque }
}

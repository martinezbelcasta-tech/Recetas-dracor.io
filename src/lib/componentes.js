// Unión de las fuentes del buscador de componentes. Aparte del form para poder
// verificarla en Node.

// Orden de prioridad = orden de las fuentes. Ante código repetido gana la
// primera, por eso las recetas de la app van antes que el catálogo: su nombre
// es el más actual. `codigoPropio` se excluye para que una receta no se
// contenga a sí misma.
export function unirComponentes(fuentes, codigoPropio) {
  const vistos = new Set(codigoPropio ? [codigoPropio] : [])
  const out = []
  for (const item of fuentes.flat()) {
    if (!item?.codigo || vistos.has(item.codigo)) continue
    vistos.add(item.codigo)
    out.push(item)
  }
  return out
}

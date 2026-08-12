import { useState, useMemo, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { explotar, rollupMaterias } from '../lib/explosion'
import ExplosionAnimacion from './ExplosionAnimacion'

// Badge de tipo por prefijo del código (mismo criterio que ProductoTerminadoForm).
// ST -> violeta, ME/PT -> azul, resto -> gris.
function getCategoriaBadge(codigo = '') {
  if (codigo.startsWith('ST-') || codigo.startsWith('ST'))
    return { label: 'Semiterminado', cls: 'bg-violet-100 text-violet-700' }
  if (codigo.startsWith('ME') || codigo.startsWith('PT'))
    return { label: 'Empaque/PT', cls: 'bg-blue-100 text-blue-700' }
  return { label: 'Material', cls: 'bg-gray-100 text-gray-600' }
}

// Formatea cantidades: hasta 3 decimales, sin ceros sobrantes.
function fmtCant(n) {
  const num = Number(n)
  if (!Number.isFinite(num)) return '0'
  return num.toLocaleString('es-AR', { maximumFractionDigits: 3 })
}

// Fila recursiva del árbol de explosión.
function NodoFila({ nodo, depth }) {
  // Nivel 1 (hijos directos de la raíz, depth === 1) expandido por defecto;
  // más profundo colapsado.
  const [abierto, setAbierto] = useState(depth <= 1)
  const tieneHijos = nodo.hijos && nodo.hijos.length > 0
  const badge = getCategoriaBadge(nodo.codigo)
  // Indentación proporcional a la profundidad.
  const padLeft = 12 + depth * 20

  return (
    <>
      <tr className="border-b border-gray-50 hover:bg-slate-50/60 transition-colors">
        <td className="py-2 pr-3 align-top">
          <div className="flex items-start gap-2" style={{ paddingLeft: padLeft }}>
            {tieneHijos ? (
              <button
                onClick={() => setAbierto(a => !a)}
                className="w-5 h-5 flex items-center justify-center rounded text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 transition-colors shrink-0 mt-0.5"
                aria-label={abierto ? 'Colapsar' : 'Expandir'}
              >
                <span className={`inline-block transition-transform text-xs ${abierto ? 'rotate-90' : ''}`}>▶</span>
              </button>
            ) : (
              <span className="w-5 shrink-0" />
            )}
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className={`font-mono text-xs px-2 py-0.5 rounded-md shrink-0 ${badge.cls}`}>
                  {nodo.codigo}
                </span>
                {nodo.ciclo && (
                  <span className="inline-flex items-center gap-1 text-xs text-amber-600 font-medium">
                    <span>⟳</span> referencia circular
                  </span>
                )}
              </div>
              <div className="text-sm text-gray-800 leading-snug mt-0.5">{nodo.nombre}</div>
            </div>
          </div>
        </td>
        <td className="py-2 px-3 align-top text-sm text-gray-600 whitespace-nowrap">{nodo.unidad || '—'}</td>
        <td className="py-2 px-3 align-top text-sm text-gray-800 text-right whitespace-nowrap tabular-nums">{fmtCant(nodo.cantidad)}</td>
        <td className="py-2 px-3 align-top text-sm text-gray-500">{nodo.ubi_nombre || '—'}</td>
      </tr>
      {tieneHijos && abierto &&
        nodo.hijos.map((hijo, i) => (
          <NodoFila key={`${hijo.codigo}#${i}`} nodo={hijo} depth={depth + 1} />
        ))}
    </>
  )
}

// Bloque del roll-up (Materia Prima o Empaque).
function BloqueRollup({ titulo, lineas }) {
  if (!lineas || lineas.length === 0) return null
  return (
    <div>
      <h4 className="text-xs font-semibold uppercase tracking-wide text-emerald-700 mb-2">{titulo}</h4>
      <div className="divide-y divide-gray-100 rounded-xl border border-gray-100 bg-white overflow-hidden">
        {lineas.map((l, i) => (
          <div key={`${l.codigo}#${l.unidad}#${i}`} className="flex items-center gap-2 px-3 py-2">
            <span className="font-mono text-xs px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 shrink-0">{l.codigo}</span>
            <span className="text-sm text-gray-700 flex-1 leading-snug min-w-0">{l.nombre}</span>
            <span className="text-sm text-gray-900 font-medium tabular-nums whitespace-nowrap">
              {fmtCant(l.cantidad)} <span className="text-gray-400 font-normal">{l.unidad}</span>
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

// Panel lateral (drawer) con la explosión de materiales hacia abajo de un producto.
// Props: { codigo, index, onClose }. El index es un Map<codigo, receta> ya construido.
export default function ExplosionDrawer({ codigo, index, onClose }) {
  const raiz = useMemo(() => explotar(codigo, index), [codigo, index])
  const totales = useMemo(() => rollupMaterias(raiz), [raiz])

  // Cerrar con tecla Esc.
  useEffect(() => {
    const onKey = e => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const receta = index?.get(codigo)
  const foto = receta?.foto
  // Sin receta cargada: raíz es hoja sin hijos, o el código no está en el index.
  const sinReceta = !receta || (raiz.esHoja && (!raiz.hijos || raiz.hijos.length === 0))
  const hayTotales =
    (totales.materiaPrima && totales.materiaPrima.length > 0) ||
    (totales.empaque && totales.empaque.length > 0)

  return createPortal(
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Overlay: cierra al hacer click */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      />
      {/* Panel deslizado desde la derecha */}
      <div className="relative h-full w-full max-w-2xl bg-white shadow-2xl flex flex-col">
        {/* Cabecera */}
        <div className="flex items-start gap-4 px-6 pt-5 pb-4 border-b border-gray-100">
          {foto ? (
            <div className="w-20 h-20 shrink-0 rounded-xl border border-gray-200 bg-gray-50 flex items-center justify-center overflow-hidden">
              <img src={foto} alt={receta?.nombre || codigo} className="max-w-full max-h-full object-contain" />
            </div>
          ) : (
            <div className="w-20 h-20 shrink-0 rounded-xl border border-gray-200 bg-gray-50 flex items-center justify-center text-gray-300 text-xs">
              sin foto
            </div>
          )}
          <div className="flex-1 min-w-0 pt-0.5">
            <span className="font-mono text-xs px-2 py-1 rounded-md bg-slate-100 text-slate-600 inline-block">{codigo}</span>
            <h2 className="text-lg font-semibold text-gray-900 mt-1.5 leading-tight">
              {receta?.nombre || raiz.nombre || 'Producto'}
            </h2>
            <p className="text-xs text-gray-400 mt-0.5">Explosión de materiales</p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors text-lg shrink-0"
            aria-label="Cerrar"
          >×</button>
        </div>

        {/* Cuerpo: árbol multinivel con scroll interno */}
        <div className="flex-1 overflow-y-auto">
          {sinReceta ? (
            <div className="h-full flex flex-col items-center justify-center text-center px-6 py-20 text-gray-400">
              <div className="text-4xl mb-3">📄</div>
              <p className="text-sm">Este producto no tiene receta cargada</p>
            </div>
          ) : (
            <>
            {/* Prototipo opción D: armado animado con las fotos reales de los componentes */}
            <ExplosionAnimacion productoNombre={receta?.nombre} productoFoto={foto} />
            <table className="w-full text-left">
              <thead className="sticky top-0 bg-white border-b border-gray-200 z-10">
                <tr className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  <th className="py-2.5 pr-3 pl-3">Material</th>
                  <th className="py-2.5 px-3">Unidad</th>
                  <th className="py-2.5 px-3 text-right">Cantidad</th>
                  <th className="py-2.5 px-3">Ubicación de Salida</th>
                </tr>
              </thead>
              <tbody>
                {raiz.hijos.map((hijo, i) => (
                  <NodoFila key={`${hijo.codigo}#${i}`} nodo={hijo} depth={1} />
                ))}
              </tbody>
            </table>
            </>
          )}
        </div>

        {/* Pie: total roll-up */}
        {hayTotales && (
          <div className="border-t border-gray-200 bg-gray-50 px-6 py-4 space-y-4 max-h-[40vh] overflow-y-auto">
            <h3 className="text-sm font-semibold text-gray-900">Total roll-up</h3>
            <BloqueRollup titulo="Materia Prima" lineas={totales.materiaPrima} />
            <BloqueRollup titulo="Empaque" lineas={totales.empaque} />
          </div>
        )}
      </div>
    </div>,
    document.body
  )
}

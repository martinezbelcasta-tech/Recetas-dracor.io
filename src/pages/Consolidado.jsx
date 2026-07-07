import { useState, useMemo, useEffect } from 'react'
import { PRODUCTOS } from '../data/consolidado'
import { getCatalogoExtra, addCatalogoExtra, deleteCatalogoExtra, logAction } from '../lib/db'

function AgregarModal({ onClose, onSave }) {
  const [form, setForm] = useState({ codigo: '', nombre: '', categoria: 'Prod. Terminado' })
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))
  const canSave = form.codigo.trim() && form.nombre.trim()

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900">Nuevo Producto</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 text-xl">×</button>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Código</label>
            <input value={form.codigo} onChange={e => set('codigo', e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Ej: PT10999000010" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Nombre</label>
            <input value={form.nombre} onChange={e => set('nombre', e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Nombre del producto" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Tipo</label>
            <select value={form.categoria} onChange={e => set('categoria', e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
              <option>Prod. Terminado</option>
              <option>Semiterminado</option>
              <option>Empaque</option>
              <option>Otro</option>
            </select>
          </div>
        </div>
        <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-100 bg-gray-50 rounded-b-2xl">
          <button onClick={onClose} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 font-medium">Cancelar</button>
          <button onClick={() => onSave(form)} disabled={!canSave}
            className="px-5 py-2 text-sm bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
            Agregar
          </button>
        </div>
      </div>
    </div>
  )
}

const CAT_STYLE = {
  'Prod. Terminado': { cls: 'bg-blue-50 text-blue-700',    dot: 'bg-blue-500' },
  'Semiterminado':   { cls: 'bg-violet-50 text-violet-700', dot: 'bg-violet-500' },
  'Empaque':         { cls: 'bg-amber-50 text-amber-700',   dot: 'bg-amber-500' },
  'Otro':            { cls: 'bg-slate-100 text-slate-600',  dot: 'bg-slate-400' },
}

const CATEGORIAS = ['Todos', 'Prod. Terminado', 'Semiterminado', 'Empaque', 'Otro']
const PER_PAGE = 50

export default function Consolidado() {
  const [extras, setExtras] = useState([])
  const [search, setSearch] = useState('')
  const [cat, setCat] = useState('Todos')
  const [page, setPage] = useState(1)
  const [modal, setModal] = useState(false)

  useEffect(() => {
    getCatalogoExtra().then(setExtras).catch(console.error)
  }, [])

  const all = useMemo(() => [...extras, ...PRODUCTOS], [extras])

  const handleSave = async (item) => {
    try {
      const saved = await addCatalogoExtra(item)
      setExtras(e => [saved, ...e])
      logAction('crear', 'Consolidado', saved.nombre)
    } catch (e) { console.error(e) }
    setSearch(''); setCat('Todos'); setPage(1); setModal(false)
  }

  const handleDelete = async (id) => {
    const item = extras.find(x => x.id === id)
    try {
      await deleteCatalogoExtra(id)
      setExtras(e => e.filter(x => x.id !== id))
      logAction('eliminar', 'Consolidado', item?.nombre || '')
    } catch (e) { console.error(e) }
  }

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return all.filter(p => {
      const matchSearch = !q || p.codigo.toLowerCase().includes(q) || p.nombre.toLowerCase().includes(q)
      const matchCat = cat === 'Todos' || p.categoria === cat
      return matchSearch && matchCat
    })
  }, [all, search, cat])

  const totalPages = Math.ceil(filtered.length / PER_PAGE)
  const paginated = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE)

  const counts = useMemo(() =>
    Object.fromEntries(CATEGORIAS.slice(1).map(c => [c, all.filter(p => p.categoria === c).length]))
  , [all])

  function handleSearch(val) { setSearch(val); setPage(1) }
  function handleCat(val) { setCat(val); setPage(1) }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Consolidado</h2>
          <p className="text-gray-500 text-sm mt-0.5">
            Catálogo completo de productos · {all.length.toLocaleString()} registros
          </p>
        </div>
        <div className="flex items-center gap-4">
          <button onClick={() => setModal(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors shadow-sm shadow-blue-200">
            <span className="text-lg leading-none">+</span> Agregar Producto
          </button>
        </div>
      </div>
      {/* Totals */}
      <div className="flex gap-3 mb-6">
        {CATEGORIAS.slice(1).map(c => (
          <div key={c} className="text-center bg-white rounded-xl border border-gray-200 px-4 py-3 min-w-[90px]">
            <p className="text-xl font-bold text-gray-900">{counts[c].toLocaleString()}</p>
            <p className="text-xs text-gray-400">{c}</p>
          </div>
        ))}
      </div>

      {/* Category pills */}
      <div className="flex flex-wrap gap-2 mb-5">
        {CATEGORIAS.map(c => {
          const isActive = cat === c
          const style = CAT_STYLE[c]
          const count = c === 'Todos' ? PRODUCTOS.length : counts[c]
          return (
            <button
              key={c}
              onClick={() => handleCat(c)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                isActive
                  ? c === 'Todos'
                    ? 'bg-slate-900 text-white border-slate-900'
                    : `${style.cls} border-current`
                  : 'bg-white text-gray-500 border-gray-200 hover:border-gray-400'
              }`}
            >
              {style && <span className={`w-1.5 h-1.5 rounded-full ${isActive ? style.dot : 'bg-gray-300'}`} />}
              {c}
              <span className={isActive ? 'opacity-60' : 'text-gray-400'}>{count.toLocaleString()}</span>
            </button>
          )
        })}
      </div>

      {/* Search + result count */}
      <div className="flex items-center gap-3 mb-5">
        <div className="relative">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input
            value={search}
            onChange={e => handleSearch(e.target.value)}
            className="border border-gray-200 rounded-lg pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white w-80"
            placeholder="Buscar por código o nombre…"
          />
        </div>
        {search && (
          <button onClick={() => handleSearch('')} className="text-sm text-gray-400 hover:text-gray-700 transition-colors">
            Limpiar
          </button>
        )}
        <span className="text-sm text-gray-400 ml-auto">
          {filtered.length.toLocaleString()} resultado{filtered.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="text-left px-6 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider w-48">Código</th>
              <th className="text-left px-6 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Producto</th>
              <th className="text-center px-6 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider w-40">Tipo</th>
              <th className="w-12" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {paginated.length === 0 && (
              <tr>
                <td colSpan={4} className="px-6 py-16 text-center text-gray-400 text-sm">
                  Sin resultados para &ldquo;{search}&rdquo;
                </td>
              </tr>
            )}
            {paginated.map(p => {
              const style = CAT_STYLE[p.categoria]
              return (
                <tr key={p.codigo} className="hover:bg-gray-50/80 transition-colors group">
                  <td className="px-6 py-3.5">
                    <span className="font-mono text-sm bg-slate-100 text-slate-700 px-2 py-1 rounded-md whitespace-nowrap">
                      {p.codigo}
                    </span>
                  </td>
                  <td className="px-6 py-3.5 text-sm text-gray-800">{p.nombre}</td>
                  <td className="px-6 py-3.5 text-center">
                    <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full ${style.cls}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${style.dot}`} />
                      {p.categoria}
                    </span>
                  </td>
                  <td className="px-3 py-3.5 text-center">
                    {p.id && (
                      <button
                        onClick={() => handleDelete(p.id)}
                        className="opacity-0 group-hover:opacity-100 text-gray-300 hover:text-red-500 transition-all p-1 rounded"
                        title="Eliminar"
                      >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="15" height="15">
                          <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/>
                        </svg>
                      </button>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 bg-gray-50">
            <p className="text-sm text-gray-500">
              Mostrando {((page - 1) * PER_PAGE) + 1}–{Math.min(page * PER_PAGE, filtered.length)} de {filtered.length.toLocaleString()}
            </p>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1.5 text-sm rounded-lg border border-gray-200 text-gray-600 hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                ← Anterior
              </button>
              {/* Page number pills — show at most 7 */}
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter(n => n === 1 || n === totalPages || Math.abs(n - page) <= 2)
                .reduce((acc, n, i, arr) => {
                  if (i > 0 && n - arr[i - 1] > 1) acc.push('…')
                  acc.push(n)
                  return acc
                }, [])
                .map((n, i) =>
                  n === '…'
                    ? <span key={`e${i}`} className="px-1 text-gray-400 text-sm">…</span>
                    : (
                      <button
                        key={n}
                        onClick={() => setPage(n)}
                        className={`w-8 h-8 text-sm rounded-lg transition-colors ${
                          page === n
                            ? 'bg-blue-600 text-white font-semibold'
                            : 'text-gray-600 hover:bg-gray-100'
                        }`}
                      >
                        {n}
                      </button>
                    )
                )}
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-3 py-1.5 text-sm rounded-lg border border-gray-200 text-gray-600 hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                Siguiente →
              </button>
            </div>
          </div>
        )}
      </div>

      {modal && <AgregarModal onClose={() => setModal(false)} onSave={handleSave} />}
    </div>
  )
}

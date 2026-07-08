import { useState, useEffect } from 'react'
import SemiterminadoForm from './SemiterminadoForm'
import { exportSemiterminado, exportSemiterminadoCSV } from '../utils/excelExport'
import { getSemiterminados, saveSemiterminado, deleteSemiterminado, logAction, marcarRevisado } from '../lib/db'
import Pagination from '../components/Pagination'

const SPECIAL_CODES = new Set(['MODIREC01', 'CFAB01'])
const PER_PAGE = 10

function fmt(n) {
  if (!isFinite(n) || n === 0) return '—'
  return n.toFixed(4)
}

function fmtFecha(iso) {
  if (!iso) return ''
  return new Date(iso).toLocaleDateString('es', { day: '2-digit', month: 'short', year: 'numeric' })
}

function DownloadIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
      <polyline points="7 10 12 15 17 10"/>
      <line x1="12" y1="15" x2="12" y2="3"/>
    </svg>
  )
}

function DetailView({ item, onBack, onEdit, onRevisar }) {
  const dims    = ['ancho', 'alto', 'largo', 'profundidad'].filter(d => item[d])
  const pesoNum = parseFloat(item.peso) || 0

  const totalKg = item.items
    .filter(i => !SPECIAL_CODES.has(i.mp_codigo))
    .reduce((s, i) => s + (parseFloat(i.kg) || 0), 0)

  return (
    <div className="p-8">
      <button onClick={onBack}
        className="flex items-center gap-2 text-sm font-semibold text-red-600 bg-red-50 border border-red-200 hover:bg-red-100 hover:border-red-400 px-3 py-1.5 rounded-lg mb-6 transition-colors">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <polyline points="15 18 9 12 15 6"/>
        </svg>
        Volver a la lista
      </button>

      <div className="flex items-start justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">{item.nombre}</h2>
          <div className="flex flex-wrap items-center gap-3 mt-1.5">
            <span className="font-mono text-sm bg-slate-100 text-slate-600 px-2 py-0.5 rounded">{item.codigo}</span>
            {item.peso && (
              <span className="text-sm text-gray-500">
                Peso: <strong className="text-gray-800">{item.peso} {item.peso_unidad}</strong>
              </span>
            )}
            {dims.length > 0 && (
              <span className="text-sm text-gray-500">
                {dims.map(d => `${d.charAt(0).toUpperCase() + d.slice(1)}: ${item[d]}cm`).join(' · ')}
              </span>
            )}
          </div>
          {!item.revisado ? (
            <div className="flex items-center gap-2 mt-2">
              <span className="inline-flex items-center gap-1.5 bg-emerald-500 text-white text-xs font-bold px-2.5 py-1 rounded-full">
                ● NUEVA
              </span>
              <span className="text-xs text-gray-400">Creada el {fmtFecha(item.created_at)}</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 mt-2">
              <span className="inline-flex items-center gap-1.5 bg-gray-100 text-gray-500 text-xs font-medium px-2.5 py-1 rounded-full">
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>
                Revisado por {item.revisado_por} · {fmtFecha(item.revisado_at)}
              </span>
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          {!item.revisado && (
            <button onClick={() => onRevisar(item.id)}
              className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>
              Marcar revisado
            </button>
          )}
          <button onClick={async () => exportSemiterminado(item)}
            className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-emerald-700 border border-emerald-300 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-colors">
            <DownloadIcon />
            Descargar Excel
          </button>
          <button onClick={() => exportSemiterminadoCSV(item)}
            className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-blue-700 border border-blue-300 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors">
            <DownloadIcon />
            Descargar CSV
          </button>
          <button onClick={onEdit}
            className="bg-amber-500 hover:bg-amber-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
            Editar receta
          </button>
        </div>
      </div>

      <div className="grid grid-cols-5 gap-5">
        {item.foto_preview && (
          <div className="col-span-2 bg-white rounded-xl border border-gray-200 shadow-sm p-4">
            <img src={item.foto_preview} alt={item.nombre}
              className="w-full h-52 object-contain rounded-lg bg-gray-50" />
          </div>
        )}

        <div className={`${item.foto_preview ? 'col-span-3' : 'col-span-5'} bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden`}>
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <h3 className="font-semibold text-gray-900">Materias Primas</h3>
            {totalKg > 0 && (
              <span className="text-xs text-gray-400">
                Total mezcla: <strong className="text-gray-700">{totalKg.toFixed(2)} KG</strong>
              </span>
            )}
          </div>
          <div className="overflow-y-auto" style={{ maxHeight: '420px' }}>
            <table className="w-full text-sm">
              <thead className="sticky top-0 z-10">
                <tr className="bg-gray-50 border-b border-gray-200 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  <th className="text-left px-4 py-3">Codigo MP</th>
                  <th className="text-left px-4 py-3">Nombre</th>
                  <th className="text-center px-4 py-3 w-24">Unidad</th>
                  <th className="text-right px-4 py-3 w-24">KG</th>
                  <th className="text-right px-4 py-3 w-20">%</th>
                  <th className="text-right px-4 py-3 w-28">{item.peso_unidad}/pieza</th>
                  <th className="text-left px-4 py-3">Ubicacion Salida</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {item.items.map(i => {
                  const isSpecial = SPECIAL_CODES.has(i.mp_codigo)
                  const kg        = parseFloat(i.kg) || 0
                  const pct       = (!isSpecial && totalKg > 0) ? (kg / totalKg) * 100 : null
                  const xPieza   = (!isSpecial && totalKg > 0 && pesoNum > 0) ? (kg / totalKg) * pesoNum : null

                  return (
                    <tr key={i.id}
                      className={`transition-colors ${isSpecial ? 'bg-amber-50/50' : 'hover:bg-gray-50'}`}>
                      <td className="px-4 py-3">
                        <span className={`font-mono text-xs px-2 py-1 rounded-md ${
                          isSpecial ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-700'
                        }`}>{i.mp_codigo}</span>
                      </td>
                      <td className="px-4 py-3 text-gray-800 font-medium">{i.mp_nombre}</td>
                      <td className="px-4 py-3 text-center">
                        {isSpecial
                          ? <span className="text-xs font-bold bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">UNIDAD</span>
                          : <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">KG</span>}
                      </td>
                      <td className="px-4 py-3 text-right font-semibold text-gray-800">
                        {isSpecial ? (pesoNum > 0 ? pesoNum.toFixed(4) : '—') : (kg > 0 ? kg.toFixed(2) : '—')}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {pct !== null
                          ? <span className="font-semibold text-indigo-600">{pct.toFixed(2)}%</span>
                          : <span className="text-gray-300">—</span>}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {isSpecial
                          ? (pesoNum > 0
                              ? <span className="font-semibold text-amber-600">{pesoNum.toFixed(4)}</span>
                              : <span className="text-gray-300">—</span>)
                          : (xPieza !== null
                              ? <span className="font-semibold text-emerald-600">{fmt(xPieza)}</span>
                              : <span className="text-gray-300">—</span>)
                        }
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono text-xs bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded shrink-0">{i.ubi_codigo}</span>
                          <span className="text-xs text-gray-500 leading-tight">{i.ubi_nombre}</span>
                        </div>
                      </td>
                    </tr>
                  )
                })}

                {totalKg > 0 && (
                  <tr className="bg-gray-50 border-t-2 border-gray-200 font-semibold">
                    <td colSpan={2} className="px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wide">Total mezcla</td>
                    <td />
                    <td className="px-4 py-3 text-right text-sm font-bold text-gray-900">{totalKg.toFixed(2)}</td>
                    <td className="px-4 py-3 text-right text-sm font-bold text-indigo-600">100%</td>
                    <td className="px-4 py-3 text-right">
                      {pesoNum > 0 && (
                        <span className="text-sm font-bold text-emerald-600">
                          {pesoNum.toFixed(4)} <span className="text-xs font-normal text-gray-400">{item.peso_unidad}</span>
                        </span>
                      )}
                    </td>
                    <td />
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function Semiterminados() {
  const [list, setList]         = useState([])
  const [loading, setLoading]   = useState(true)
  const [saving, setSaving]     = useState(false)
  const [view, setView]         = useState(null)
  const [formData, setFormData] = useState(null)
  const [search, setSearch]     = useState('')
  const [page, setPage]         = useState(1)

  const load = async () => {
    setLoading(true)
    try { setList(await getSemiterminados()) } catch (e) { console.error(e) }
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const filtered = list
    .filter(i =>
      i.nombre.toLowerCase().includes(search.toLowerCase()) ||
      i.codigo.toLowerCase().includes(search.toLowerCase())
    )
    .sort((a, b) => (a.revisado === b.revisado ? 0 : a.revisado ? 1 : -1))

  const paginated = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE)

  const handleSave = async (form) => {
    setSaving(true)
    try {
      const saved = await saveSemiterminado(form)
      logAction(form.id ? 'editar' : 'crear', 'Semiterminado', form.nombre)
      setList(l => form.id
        ? l.map(i => i.id === saved.id ? saved : i)
        : [saved, ...l]
      )
      setFormData(null)
    } catch (e) {
      console.error(e)
      alert('Error al guardar: ' + (e?.message || JSON.stringify(e)))
    }
    setSaving(false)
  }

  const handleReplicar = (item) => {
    setFormData({
      ...item,
      id: undefined,
      codigo: '',
      nombre: 'Copia - ' + item.nombre,
      foto: null,
      foto_preview: null,
      revisado: false,
      revisado_por: null,
      revisado_at: null,
    })
  }

  const handleRevisar = async (id) => {
    try {
      await marcarRevisado('semiterminados', id)
      const newList = await getSemiterminados()
      setList(newList)
      setView(v => v?.id === id ? (newList.find(i => i.id === id) || null) : v)
    } catch (e) { console.error(e) }
  }

  const remove = async (id, nombre) => {
    if (!confirm('Eliminar esta receta?')) return
    try {
      await deleteSemiterminado(id)
      setList(l => l.filter(i => i.id !== id))
      logAction('eliminar', 'Semiterminado', nombre)
    } catch (e) { console.error(e) }
  }

  if (formData !== null) {
    return (
      <SemiterminadoForm
        initial={formData === 'new' ? null : formData}
        onSave={handleSave}
        onCancel={() => setFormData(null)}
        saving={saving}
      />
    )
  }

  if (view) {
    return (
      <DetailView
        item={view}
        onBack={() => setView(null)}
        onEdit={() => { setFormData(view); setView(null) }}
        onRevisar={handleRevisar}
      />
    )
  }

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="text-center">
        <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-sm text-gray-400">Cargando recetas…</p>
      </div>
    </div>
  )

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Semiterminados</h2>
          <p className="text-gray-500 text-sm mt-0.5">Recetas de componentes intermedios · {list.length} registros</p>
        </div>
        <button onClick={() => setFormData('new')}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors shadow-sm shadow-blue-200">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          Nueva Receta
        </button>
      </div>

      <div className="relative mb-5">
        <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
        </svg>
        <input value={search} onChange={e => { setSearch(e.target.value); setPage(1) }}
          className="w-full max-w-xs border border-gray-200 rounded-lg pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          placeholder="Buscar por nombre o codigo..." />
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200 text-xs font-semibold text-gray-500 uppercase tracking-wider">
              <th className="text-left px-6 py-3.5 w-36">Codigo</th>
              <th className="text-left px-6 py-3.5">Nombre</th>
              <th className="text-left px-6 py-3.5 w-28">Peso</th>
              <th className="text-left px-6 py-3.5 w-32">Materiales</th>
              <th className="text-left px-6 py-3.5 w-16">Foto</th>
              <th className="text-right px-6 py-3.5 w-44">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {filtered.length === 0 && (
              <tr>
                <td colSpan={6} className="px-6 py-16 text-center">
                  <p className="text-gray-400 text-sm">
                    {search ? `Sin resultados para "${search}"` : 'No hay recetas. Crea la primera.'}
                  </p>
                </td>
              </tr>
            )}
            {paginated.map(item => (
              <tr key={item.id} className="hover:bg-blue-50/20 transition-colors">
                <td className="px-6 py-4">
                  <span className="font-mono text-sm bg-slate-100 text-slate-700 px-2 py-1 rounded-md">{item.codigo}</span>
                </td>
                <td className="px-6 py-4 font-medium text-gray-900">
                  <div className="flex items-center gap-2">
                    {item.nombre}
                    {!item.revisado && (
                      <span className="inline-flex items-center gap-1 bg-emerald-500 text-white text-xs font-bold px-2 py-0.5 rounded-full shrink-0">
                        NUEVA
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 text-sm text-gray-500">
                  {item.peso ? `${item.peso} ${item.peso_unidad}` : '—'}
                </td>
                <td className="px-6 py-4">
                  <span className="text-xs bg-violet-50 text-violet-700 font-semibold px-2.5 py-1 rounded-full">
                    {item.items.length} MP
                  </span>
                </td>
                <td className="px-6 py-4">
                  {item.foto_preview
                    ? <img src={item.foto_preview} alt="" className="w-9 h-9 object-cover rounded-lg border border-gray-200" />
                    : <span className="text-gray-300 text-xs">—</span>}
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex items-center justify-end gap-1">
                    <button onClick={() => setView(item)}
                      className="px-3 py-1.5 text-xs font-medium text-gray-500 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors">Ver</button>
                    <button onClick={async () => exportSemiterminado(item)}
                      title="Descargar Excel"
                      className="px-2 py-1.5 text-gray-400 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors">
                      <DownloadIcon />
                    </button>
                    <button onClick={() => exportSemiterminadoCSV(item)}
                      title="Descargar CSV (Olimpo)"
                      className="px-2 py-1.5 text-gray-400 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors">
                      <DownloadIcon />
                    </button>
                    {!item.revisado ? (
                      <button onClick={() => handleRevisar(item.id)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-amber-700 bg-amber-50 border border-amber-300 hover:bg-amber-100 rounded-lg transition-colors">
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                        Por revisar
                      </button>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-300 rounded-lg">
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>
                        Revisado
                      </span>
                    )}
                    <button onClick={() => handleReplicar(item)}
                      className="px-3 py-1.5 text-xs font-medium text-gray-500 hover:text-violet-700 hover:bg-violet-50 rounded-lg transition-colors">Replicar</button>
                    <button onClick={() => setFormData(item)}
                      className="px-3 py-1.5 text-xs font-medium text-gray-500 hover:text-amber-700 hover:bg-amber-50 rounded-lg transition-colors">Editar</button>
                    <button onClick={() => remove(item.id, item.nombre)}
                      className="px-3 py-1.5 text-xs font-medium text-gray-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors">Eliminar</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <Pagination page={page} total={filtered.length} perPage={PER_PAGE} onPage={setPage} />
      </div>
    </div>
  )
}

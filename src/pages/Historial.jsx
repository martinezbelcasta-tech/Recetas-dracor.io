import { useState, useEffect } from 'react'
import { getActivityLog } from '../lib/db'

const ACCION = {
  crear:    { label: 'Crear',    cls: 'bg-emerald-100 text-emerald-700' },
  editar:   { label: 'Editar',   cls: 'bg-amber-100 text-amber-700' },
  eliminar: { label: 'Eliminar', cls: 'bg-red-100 text-red-600' },
}

const MODULO_CLS = {
  'Semiterminado':  'bg-violet-100 text-violet-700',
  'Prod. Terminado':'bg-blue-100 text-blue-700',
  'Materia Prima':  'bg-orange-100 text-orange-700',
  'Ubicación':      'bg-teal-100 text-teal-700',
  'Consolidado':    'bg-indigo-100 text-indigo-700',
}

function fmt(ts) {
  const d = new Date(ts)
  return d.toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' })
    + ' · ' + d.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })
}

export default function Historial() {
  const [logs, setLogs]           = useState([])
  const [loading, setLoading]     = useState(true)
  const [search, setSearch]       = useState('')
  const [filterAccion, setFilterAccion] = useState('')
  const [filterModulo, setFilterModulo] = useState('')

  const load = () => {
    setLoading(true)
    getActivityLog().then(setLogs).catch(console.error).finally(() => setLoading(false))
  }

  useEffect(load, [])

  const modulos = [...new Set(logs.map(l => l.modulo))]

  const filtered = logs.filter(l => {
    const q = search.toLowerCase()
    return (!q || l.detalle?.toLowerCase().includes(q) || l.usuario?.toLowerCase().includes(q))
      && (!filterAccion || l.accion === filterAccion)
      && (!filterModulo || l.modulo === filterModulo)
  })

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Historial de Acciones</h2>
          <p className="text-gray-500 text-sm mt-0.5">
            Registro de todos los cambios del sistema · {logs.length} entradas
          </p>
        </div>
        <button onClick={load}
          className="flex items-center gap-1.5 px-3 py-2 text-sm text-gray-500 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M23 4v6h-6M1 20v-6h6"/>
            <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
          </svg>
          Actualizar
        </button>
      </div>

      {/* Filtros */}
      <div className="flex items-center gap-3 mb-5">
        <div className="relative">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4"
            viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input value={search} onChange={e => setSearch(e.target.value)}
            className="border border-gray-200 rounded-lg pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white w-60"
            placeholder="Buscar usuario o ítem…" />
        </div>

        <select value={filterAccion} onChange={e => setFilterAccion(e.target.value)}
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
          <option value="">Todas las acciones</option>
          <option value="crear">Crear</option>
          <option value="editar">Editar</option>
          <option value="eliminar">Eliminar</option>
        </select>

        <select value={filterModulo} onChange={e => setFilterModulo(e.target.value)}
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
          <option value="">Todos los módulos</option>
          {modulos.map(m => <option key={m} value={m}>{m}</option>)}
        </select>

        {(search || filterAccion || filterModulo) && (
          <button onClick={() => { setSearch(''); setFilterAccion(''); setFilterModulo('') }}
            className="text-sm text-gray-400 hover:text-gray-600 transition-colors">
            Limpiar filtros
          </button>
        )}
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <div className="w-7 h-7 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                <th className="text-left px-6 py-3.5 w-52">Fecha y Hora</th>
                <th className="text-left px-6 py-3.5 w-52">Usuario</th>
                <th className="text-left px-6 py-3.5 w-28">Acción</th>
                <th className="text-left px-6 py-3.5 w-40">Módulo</th>
                <th className="text-left px-6 py-3.5">Detalle</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-16 text-center text-gray-400 text-sm">
                    {search || filterAccion || filterModulo
                      ? 'Sin resultados para los filtros aplicados.'
                      : 'No hay acciones registradas aún.'}
                  </td>
                </tr>
              ) : filtered.map(log => {
                const accion   = ACCION[log.accion] || { label: log.accion, cls: 'bg-gray-100 text-gray-600' }
                const modCls   = MODULO_CLS[log.modulo] || 'bg-gray-100 text-gray-600'
                return (
                  <tr key={log.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-3.5 font-mono text-xs text-gray-400 whitespace-nowrap">
                      {fmt(log.created_at)}
                    </td>
                    <td className="px-6 py-3.5">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-slate-700 flex items-center justify-center text-white text-xs font-bold shrink-0">
                          {log.usuario?.charAt(0).toUpperCase()}
                        </div>
                        <span className="text-sm text-gray-700 truncate max-w-36">{log.usuario}</span>
                      </div>
                    </td>
                    <td className="px-6 py-3.5">
                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${accion.cls}`}>
                        {accion.label}
                      </span>
                    </td>
                    <td className="px-6 py-3.5">
                      <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${modCls}`}>
                        {log.modulo}
                      </span>
                    </td>
                    <td className="px-6 py-3.5 text-sm text-gray-800">{log.detalle || '—'}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}

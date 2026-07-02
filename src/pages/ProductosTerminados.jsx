import { useState, useEffect } from 'react'
import ProductoTerminadoForm from './ProductoTerminadoForm'
import { exportProductoTerminado } from '../utils/excelExport'
import { getProductosTerminados, saveProductoTerminado, deleteProductoTerminado, logAction } from '../lib/db'

const SPECIAL_CODES = new Set(['MODIREC01', 'CFAB01'])

function getCategoriaBadge(codigo) {
  if (SPECIAL_CODES.has(codigo)) return { label: 'Costo', cls: 'bg-amber-100 text-amber-700' }
  if (codigo.startsWith('ST-') || codigo.startsWith('ST'))
    return { label: 'Semiterminado', cls: 'bg-violet-100 text-violet-700' }
  if (codigo.startsWith('ME') || codigo.startsWith('PT'))
    return { label: 'Empaque', cls: 'bg-blue-100 text-blue-700' }
  return { label: 'Material', cls: 'bg-gray-100 text-gray-600' }
}

const SAMPLE_DATA = [
  {
    id: 1,
    nombre: 'Caja Xtreme 5 Cajones Rojo',
    codigo: 'PT-CX5CR',
    peso_neto: '1.250', peso_neto_unidad: 'kg',
    peso_bruto: '1.450', peso_bruto_unidad: 'kg',
    tiene_medidas: true, ancho: '35', alto: '80', largo: '40', profundidad: '',
    foto: null, foto_preview: null,
    items: [
      { id: 1, comp_codigo: 'ST-CX',    comp_nombre: 'Caja Xtreme (Semiterminado)', unidad: 'Unidad',    cantidad: '1',    ubi_codigo: 'UBI07PRODUCCION', ubi_nombre: 'Cargos a la Produccion de Maquinas' },
      { id: 2, comp_codigo: 'ME001',     comp_nombre: 'Bolsa Transparente',          unidad: 'Unidad',    cantidad: '1',    ubi_codigo: 'UBI07EMPAQUE',    ubi_nombre: 'Cargos a la Produccion Empaques y Suministros' },
      { id: 3, comp_codigo: 'ME002',     comp_nombre: 'Caja de Cartón',              unidad: 'Unidad',    cantidad: '1',    ubi_codigo: 'UBI07EMPAQUE',    ubi_nombre: 'Cargos a la Produccion Empaques y Suministros' },
      { id: 4, comp_codigo: 'MODIREC01', comp_nombre: 'Mano de Obra Directa',        unidad: 'Unidad',    cantidad: '1',    ubi_codigo: 'UBI07GIF',        ubi_nombre: 'Costos Directos de Fabricacion' },
      { id: 5, comp_codigo: 'CFAB01',    comp_nombre: 'Carga Fabril',                unidad: 'Unidad',    cantidad: '1',    ubi_codigo: 'UBI07GIF',        ubi_nombre: 'Costos Directos de Fabricacion' },
    ],
  },
]

function DetailView({ item, onBack, onEdit }) {
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
            <span className="font-mono text-sm bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded border border-emerald-200">{item.codigo}</span>
            <span className="text-xs bg-emerald-100 text-emerald-700 font-semibold px-2 py-0.5 rounded-full">Producto Terminado</span>
            {item.peso_neto && (
              <span className="text-sm text-gray-500">
                Neto: <strong className="text-gray-800">{item.peso_neto} {item.peso_neto_unidad}</strong>
              </span>
            )}
            {item.peso_bruto && (
              <span className="text-sm text-gray-500">
                Bruto: <strong className="text-gray-800">{item.peso_bruto} {item.peso_bruto_unidad}</strong>
              </span>
            )}
            {['ancho','alto','largo','profundidad'].filter(d => item[d]).map(d => (
              <span key={d} className="text-sm text-gray-500">
                {d.charAt(0).toUpperCase()+d.slice(1)}: <strong className="text-gray-800">{item[d]}cm</strong>
              </span>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={async () => exportProductoTerminado(item)}
            className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-emerald-700 border border-emerald-300 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-colors">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <polyline points="7 10 12 15 17 10"/>
              <line x1="12" y1="15" x2="12" y2="3"/>
            </svg>
            Descargar Excel
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
            <h3 className="font-semibold text-gray-900">Componentes del Producto</h3>
            <span className="text-xs text-gray-400">{item.items.length} componentes</span>
          </div>
          <div className="overflow-y-auto" style={{ maxHeight: '420px' }}>
            <table className="w-full text-sm">
              <thead className="sticky top-0 z-10">
                <tr className="bg-gray-50 border-b border-gray-200 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  <th className="text-left px-4 py-3">Código</th>
                  <th className="text-left px-4 py-3">Nombre Componente</th>
                  <th className="text-center px-4 py-3 w-28">Tipo</th>
                  <th className="text-center px-4 py-3 w-28">Unidad</th>
                  <th className="text-right px-4 py-3 w-24">Cantidad</th>
                  <th className="text-left px-4 py-3">Ubicación Salida</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {item.items.map(i => {
                  const isSpecial = SPECIAL_CODES.has(i.comp_codigo)
                  const badge     = getCategoriaBadge(i.comp_codigo)
                  return (
                    <tr key={i.id}
                      className={`transition-colors ${isSpecial ? 'bg-amber-50/50' : 'hover:bg-gray-50'}`}>
                      <td className="px-4 py-3">
                        <span className={`font-mono text-xs px-2 py-1 rounded-md whitespace-nowrap ${
                          isSpecial ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-700'
                        }`}>{i.comp_codigo}</span>
                      </td>
                      <td className="px-4 py-3 text-gray-800 font-medium">{i.comp_nombre}</td>
                      <td className="px-4 py-3 text-center">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${badge.cls}`}>{badge.label}</span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                          {isSpecial ? 'UNIDAD' : i.unidad}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right font-bold text-gray-900">
                        {isSpecial ? '1' : i.cantidad}
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
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function ProductosTerminados() {
  const [list, setList]         = useState([])
  const [loading, setLoading]   = useState(true)
  const [saving, setSaving]     = useState(false)
  const [view, setView]         = useState(null)
  const [formData, setFormData] = useState(null)
  const [search, setSearch]     = useState('')

  const load = async () => {
    setLoading(true)
    try { setList(await getProductosTerminados()) } catch (e) { console.error(e) }
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const filtered = list.filter(i =>
    i.nombre.toLowerCase().includes(search.toLowerCase()) ||
    i.codigo.toLowerCase().includes(search.toLowerCase())
  )

  const handleSave = async (form) => {
    setSaving(true)
    try {
      await saveProductoTerminado(form)
      await load()
      logAction(form.id ? 'editar' : 'crear', 'Prod. Terminado', form.nombre)
      setFormData(null)
    } catch (e) {
      console.error(e)
      alert('Error al guardar: ' + (e?.message || JSON.stringify(e)))
    }
    setSaving(false)
  }

  const remove = async (id, nombre) => {
    if (!confirm('¿Eliminar esta receta?')) return
    try {
      await deleteProductoTerminado(id)
      setList(l => l.filter(i => i.id !== id))
      logAction('eliminar', 'Prod. Terminado', nombre)
    } catch (e) { console.error(e) }
  }

  if (formData !== null) {
    return (
      <ProductoTerminadoForm
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
      />
    )
  }

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="text-center">
        <div className="w-8 h-8 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-sm text-gray-400">Cargando recetas…</p>
      </div>
    </div>
  )

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Productos Terminados</h2>
          <p className="text-gray-500 text-sm mt-0.5">Recetas con semiterminados y empaque · {list.length} registros</p>
        </div>
        <button onClick={() => setFormData('new')}
          className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors shadow-sm shadow-emerald-200">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          Nueva Receta PT
        </button>
      </div>

      <div className="relative mb-5">
        <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
        </svg>
        <input value={search} onChange={e => setSearch(e.target.value)}
          className="w-full max-w-xs border border-gray-200 rounded-lg pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
          placeholder="Buscar por nombre o código…" />
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200 text-xs font-semibold text-gray-500 uppercase tracking-wider">
              <th className="text-left px-6 py-3.5 w-40">Código</th>
              <th className="text-left px-6 py-3.5">Nombre</th>
              <th className="text-left px-6 py-3.5 w-32">Componentes</th>
              <th className="text-left px-6 py-3.5 w-16">Foto</th>
              <th className="text-right px-6 py-3.5 w-36">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {filtered.length === 0 && (
              <tr>
                <td colSpan={5} className="px-6 py-16 text-center">
                  <p className="text-gray-400 text-sm">
                    {search ? `Sin resultados para "${search}"` : 'No hay recetas. Crea la primera.'}
                  </p>
                </td>
              </tr>
            )}
            {filtered.map(item => (
              <tr key={item.id} className="hover:bg-emerald-50/20 transition-colors">
                <td className="px-6 py-4">
                  <span className="font-mono text-sm bg-emerald-50 text-emerald-700 px-2 py-1 rounded-md border border-emerald-100">{item.codigo}</span>
                </td>
                <td className="px-6 py-4 font-medium text-gray-900">{item.nombre}</td>
                <td className="px-6 py-4">
                  <span className="text-xs bg-violet-50 text-violet-700 font-semibold px-2.5 py-1 rounded-full">
                    {item.items.length} comp.
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
                    <button onClick={async () => exportProductoTerminado(item)}
                      title="Descargar Excel"
                      className="px-3 py-1.5 text-xs font-medium text-gray-500 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors">
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="inline">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                        <polyline points="7 10 12 15 17 10"/>
                        <line x1="12" y1="15" x2="12" y2="3"/>
                      </svg>
                    </button>
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
      </div>
    </div>
  )
}

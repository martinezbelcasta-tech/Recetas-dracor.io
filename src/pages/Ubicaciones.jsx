import { useState, useMemo, useEffect } from 'react'
import { getUbiExtra, addUbiExtra, deleteUbiExtra, logAction } from '../lib/db'

const RAW = [
  { codigo: 'UBI0021-05', nombre: 'CONSIGNA_ANGEL TORRES REYES (Mejicanos Ayutuxte)', nivel: 4 },
  { codigo: 'UBI0021-08', nombre: 'CONSIGNA_ISRAEL ANTONIO AYALA HERNANDEZ', nivel: 4 },
  { codigo: 'UBI0021-01', nombre: 'CONSIGNA_JUAN CARLOS SANCHEZ ORTIZ', nivel: 4 },
  { codigo: 'UBI0021-06', nombre: 'CONSIGNA_KEVIN ARMANDO RUIZ A.(Soyapango)', nivel: 4 },
  { codigo: 'UBI0021-03', nombre: 'CONSIGNA_MAURICIO SALVADOR RIVAS REYES', nivel: 4 },
  { codigo: 'UBI0021-11', nombre: 'CONSIGNA_NOE ALEXANDER CORTEZ ALFARO', nivel: 4 },
  { codigo: 'UBI0021-02', nombre: 'CONSIGNA_NOE PEREZ ALVARADO', nivel: 4 },
  { codigo: 'UBI0021-04', nombre: 'CONSIGNA_RECOINSA, S.A. DE C.V.', nivel: 4 },
  { codigo: 'UBI0021-12', nombre: 'CONSIGNA_RENE MAURICIO ZELAYA LORENZANA', nivel: 4 },
  { codigo: 'UBI0021-07', nombre: 'CONSIGNA_RICARDO AYALA HERNANDEZ', nivel: 4 },
  { codigo: 'UBI0021-10', nombre: 'CONSIGNA_ROSALIO ORTIZ ORTEGA', nivel: 4 },
  { codigo: 'UBI0021-09', nombre: 'CONSIGNA_V.M.W.', nivel: 4 },
  { codigo: 'UBI0022',    nombre: 'ACCESORIOS PROMOCIONAL DE MOTOS', nivel: 3 },
  { codigo: 'UBI0021',    nombre: 'CONSIGNACION MOTOS', nivel: 3 },
  { codigo: 'UBI0028',    nombre: 'Devoluciones Eairpods', nivel: 3 },
  { codigo: 'VEND07',     nombre: 'Devoluciones y Cambios-2', nivel: 3 },
  { codigo: 'UBI0030',    nombre: 'Piezas Malas Ensamble', nivel: 3 },
  { codigo: 'UBI0004',    nombre: 'Piezas Malas Kg', nivel: 3 },
  { codigo: 'UBI0002',    nombre: 'Piezas Malas Produccion', nivel: 3 },
  { codigo: 'UBI0021-14', nombre: 'Piezas Malas Produccion_2', nivel: 3 },
  { codigo: 'UBI0021-13', nombre: 'Piezas Para Reparacion', nivel: 3 },
  { codigo: 'UBI0018',    nombre: 'PLANTA - AUTOMOTORES', nivel: 3 },
  { codigo: 'UBI0021-15', nombre: 'Producto Retornable', nivel: 3 },
  { codigo: 'UBI001',     nombre: 'Rebabas/Melcocha', nivel: 3 },
  { codigo: 'UBI0023',    nombre: 'TALLER/DISP/VENTA', nivel: 3 },
  { codigo: 'UBI0019',    nombre: 'TALLER-ENSAMBLADO-MOTOS', nivel: 3 },
  { codigo: '10ACCELAV',  nombre: 'Accesorios de Lavadora', nivel: 2 },
  { codigo: '11ACCVENT',  nombre: 'Accesorios de Ventiladores', nivel: 2 },
  { codigo: 'UBI0001',    nombre: 'ALMACEN PIEZAS MALAS PARA RECICLAJE', nivel: 2 },
  { codigo: 'UBI0017',    nombre: 'AUTOMOTORES', nivel: 2 },
  { codigo: 'UBI0025',    nombre: 'AVERIAS SAN MIGUEL', nivel: 2 },
  { codigo: 'UBI07ENSAMBLE',   nombre: 'Cargos a la Produccion de Ensamble', nivel: 2 },
  { codigo: 'UBI07PRODUCCION', nombre: 'Cargos a la Produccion de Maquinas', nivel: 2 },
  { codigo: 'UBI07EMPAQUE',    nombre: 'Cargos a la Produccion Empaques y Suministros', nivel: 2 },
  { codigo: 'UBI0029',    nombre: 'Cargos a la Produccion Impresion Laser', nivel: 2 },
  { codigo: 'UBI0031',    nombre: 'CENTRO DISTRIBUCION PT', nivel: 2 },
  { codigo: 'UBI0039',    nombre: 'CLEARING HOUSE', nivel: 2 },
  { codigo: 'UBI07GIF',   nombre: 'Costos Directos de Fabricacion', nivel: 2 },
  { codigo: 'UBI0015',    nombre: 'Cuentas Por Liquidar en Inventario', nivel: 2 },
  { codigo: 'UBI0003',    nombre: 'Devoluciones y Cambios', nivel: 2 },
  { codigo: 'INVTR003',   nombre: 'DIFERENCIAS EN TOMAS FISICAS', nivel: 2 },
  { codigo: 'UBI0027',    nombre: 'DISPONIBLE PARA VENTA SAN MIGUEL', nivel: 2 },
  { codigo: '05MATEMP',   nombre: 'Empaques y Suministros', nivel: 2 },
  { codigo: '02MATPRIM',  nombre: 'Envios Prestamos cxc Materia Prima', nivel: 2 },
  { codigo: 'UBI0032',    nombre: 'FACTURACION', nivel: 2 },
  { codigo: 'UBI0034',    nombre: 'FACTURACION LOCAL', nivel: 2 },
  { codigo: 'INVTR002',   nombre: 'Fundas y Cojines en transito', nivel: 2 },
  { codigo: 'VEND05',     nombre: 'Inventario al 1-12-2021', nivel: 2 },
  { codigo: '01MATPRIM',  nombre: 'Materia Prima', nivel: 2 },
  { codigo: '06MERCADERIA', nombre: 'Mercaderia', nivel: 2 },
  { codigo: 'UBI0035',    nombre: 'MP Fabrica', nivel: 2 },
  { codigo: 'ADM01',      nombre: 'Muestras Vendedores', nivel: 2 },
  { codigo: 'UBI0026',    nombre: 'PIEZAS DE CAMBIOS SAN MIGUEL', nivel: 2 },
  { codigo: 'UBI0005',    nombre: 'Producto de Segunda', nivel: 2 },
  { codigo: 'UBI0013',    nombre: 'Producto en Ruta Preventa', nivel: 2 },
  { codigo: 'UBI0014',    nombre: 'Producto Promocional Para KIT', nivel: 2 },
  { codigo: '03PTERMIN',  nombre: 'Producto Terminado', nivel: 2 },
  { codigo: 'UBI0033',    nombre: 'Productos en Revision', nivel: 2 },
  { codigo: 'VEND02',     nombre: 'Raquel Noemy Recinos Peña', nivel: 2 },
  { codigo: '03MATPRIM',  nombre: 'Recepcion cxp Prestamos Materia Prima', nivel: 2 },
  { codigo: '09REPAUTO',  nombre: 'Repuestos Automotores', nivel: 2 },
  { codigo: '07REPMAQU',  nombre: 'Repuestos Maquinas', nivel: 2 },
  { codigo: '08REPMOTO',  nombre: 'Repuestos Motocicletas', nivel: 2 },
  { codigo: '04REPYACC',  nombre: 'Repuestos Y Accesorios', nivel: 2 },
  { codigo: 'VEND03',     nombre: 'Rosemary Yamileth Zepeda Flores', nivel: 2 },
  { codigo: '01OFICINA',  nombre: 'Sala de Ventas Mostrador', nivel: 2 },
  { codigo: '01OFIESTU',  nombre: 'Sala Estudio de Fotos', nivel: 2 },
  { codigo: 'VEND04',     nombre: 'SANCHIA HONDURAS-DEVOLUCION', nivel: 2 },
  { codigo: '02SEMITER',  nombre: 'Semiterminado', nivel: 2 },
  { codigo: 'VTRANSTO',   nombre: 'TRANSITO RETORNBLE', nivel: 2 },
  { codigo: 'UBI0009',    nombre: 'Unicomer', nivel: 2 },
  { codigo: 'VEND01',     nombre: 'Venta a Clientes Ruta1', nivel: 2 },
  { codigo: 'UBI0012',    nombre: 'VENTAS INTERNAS', nivel: 2 },
  { codigo: 'ACTFIJO15',  nombre: 'AREA DE IMPRESIÓN', nivel: 1 },
  { codigo: 'ACTFIJO12',  nombre: 'AREA DE MANTENIMIENTO', nivel: 1 },
  { codigo: 'ACTFIJO13',  nombre: 'AREA DE TALLER', nivel: 1 },
  { codigo: 'ACTFIJO14',  nombre: 'AREA ENSAMBLE', nivel: 1 },
  { codigo: '01NAVES',    nombre: 'COMPLEJO NAVE INDUSTRIAL', nivel: 1 },
  { codigo: 'UBI0036',    nombre: 'DEVOLUCION POR FACTURACION PV IVA', nivel: 1 },
  { codigo: 'ACTFIJO09',  nombre: 'Edificios y Construcciones', nivel: 1 },
  { codigo: 'ACTFIJO02',  nombre: 'Equipo de Computo', nivel: 1 },
  { codigo: 'ACTFIJO05',  nombre: 'Herramientas', nivel: 1 },
  { codigo: 'INVTR001',   nombre: 'INVENTARIO EN TRANSITO', nivel: 1 },
  { codigo: 'INV00',      nombre: 'INVENTARIO GENERAL', nivel: 1 },
  { codigo: 'ACTFIJO07',  nombre: 'Maquinaria', nivel: 1 },
  { codigo: 'ACTFIJO01',  nombre: 'Mobiliario y Equ. de Oficina', nivel: 1 },
  { codigo: 'ACTFIJO06',  nombre: 'Modulo y Diviciones', nivel: 1 },
  { codigo: 'ACTFIJO08',  nombre: 'Moldes', nivel: 1 },
  { codigo: 'VEND_MUESTRAS', nombre: 'MUESTRAS DE VENTAS', nivel: 1 },
  { codigo: 'ACTFIJO03',  nombre: 'Otros Mob. Y Equipos', nivel: 1 },
  { codigo: 'UBI0007',    nombre: 'PRODUCCIONES EN PROCESO', nivel: 1 },
  { codigo: 'UBI0020',    nombre: 'PRODUCTO PARA LA VENTA', nivel: 1 },
  { codigo: 'UBI0016',    nombre: 'Productos Por Facturar', nivel: 1 },
  { codigo: 'ACTFIJO11',  nombre: 'Proyectos en Proceso', nivel: 1 },
  { codigo: 'UBI0024',    nombre: 'SAN MIGUEL', nivel: 1 },
  { codigo: 'ACTFIJO10',  nombre: 'Terrenos', nivel: 1 },
  { codigo: '_UBI_DEFAULT_', nombre: 'UBICACION DEFAULT', nivel: 1 },
  { codigo: 'UBI0010',    nombre: 'Uniformes y Camisas', nivel: 1 },
  { codigo: 'ACTFIJO04',  nombre: 'Vehiculos', nivel: 1 },
  { codigo: 'ACTFIJO',    nombre: 'ACTIVOS FIJOS', nivel: 0 },
  { codigo: 'F.CAMILA',   nombre: 'FARMACIAS CAMILA (CONSIGNACION)', nivel: 0 },
  { codigo: 'UBI0038',    nombre: 'MAQUILA DPA', nivel: 0 },
  { codigo: 'UBI0037',    nombre: 'Mezclas Producción', nivel: 0 },
  { codigo: 'UBI0040',    nombre: 'PELETIZADO PV', nivel: 0 },
  { codigo: '01PLANTA',   nombre: 'PLANTA GENERAL', nivel: 0 },
]

const NIVEL_BADGE = {
  0: { label: 'Raíz',     cls: 'bg-slate-100 text-slate-600' },
  1: { label: 'Nivel 1',  cls: 'bg-blue-50 text-blue-700' },
  2: { label: 'Nivel 2',  cls: 'bg-violet-50 text-violet-700' },
  3: { label: 'Nivel 3',  cls: 'bg-amber-50 text-amber-700' },
  4: { label: 'Nivel 4',  cls: 'bg-rose-50 text-rose-700' },
}

const NIVEL_OPTIONS = [
  { value: '', label: 'Todos los niveles' },
  { value: '0', label: 'Raíz' },
  { value: '1', label: 'Nivel 1' },
  { value: '2', label: 'Nivel 2' },
  { value: '3', label: 'Nivel 3' },
  { value: '4', label: 'Nivel 4' },
]

const EMPTY = { codigo: '', nombre: '', nivel: '1' }

function AgregarModal({ onClose, onSave }) {
  const [form, setForm] = useState(EMPTY)
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))
  const canSave = form.codigo.trim() && form.nombre.trim()

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900">Nueva Ubicación</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 text-xl">×</button>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Código</label>
            <input value={form.codigo} onChange={e => set('codigo', e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Ej: UBI0041" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Nombre</label>
            <input value={form.nombre} onChange={e => set('nombre', e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Nombre de la ubicación" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Nivel</label>
            <select value={form.nivel} onChange={e => set('nivel', e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
              <option value="0">Raíz</option>
              <option value="1">Nivel 1</option>
              <option value="2">Nivel 2</option>
              <option value="3">Nivel 3</option>
              <option value="4">Nivel 4</option>
            </select>
          </div>
        </div>
        <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-100 bg-gray-50 rounded-b-2xl">
          <button onClick={onClose} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 font-medium">Cancelar</button>
          <button onClick={() => onSave({ ...form, nivel: Number(form.nivel) })} disabled={!canSave}
            className="px-5 py-2 text-sm bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
            Agregar
          </button>
        </div>
      </div>
    </div>
  )
}

export default function Ubicaciones() {
  const [extras, setExtras] = useState([])
  const [search, setSearch] = useState('')
  const [nivelFilter, setNivelFilter] = useState('')
  const [modal, setModal] = useState(false)

  useEffect(() => {
    getUbiExtra().then(setExtras).catch(console.error)
  }, [])

  const all = useMemo(() => [...extras, ...RAW], [extras])

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return all.filter(u => {
      const matchSearch = !q || u.codigo.toLowerCase().includes(q) || u.nombre.toLowerCase().includes(q)
      const matchNivel = nivelFilter === '' || u.nivel === Number(nivelFilter)
      return matchSearch && matchNivel
    })
  }, [all, search, nivelFilter])

  const handleSave = async (item) => {
    try {
      const saved = await addUbiExtra(item)
      setExtras(e => [...e, saved])
      logAction('crear', 'Ubicación', saved.nombre)
    } catch (e) { console.error(e) }
    setSearch(''); setNivelFilter(''); setModal(false)
  }

  const handleDelete = async (id) => {
    const item = extras.find(x => x.id === id)
    try {
      await deleteUbiExtra(id)
      setExtras(e => e.filter(x => x.id !== id))
      logAction('eliminar', 'Ubicación', item?.nombre || '')
    } catch (e) { console.error(e) }
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Ubicaciones</h2>
          <p className="text-gray-500 text-sm mt-0.5">
            Catálogo de ubicaciones · {all.length} registros
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => setModal(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors shadow-sm shadow-blue-200">
            <span className="text-lg leading-none">+</span> Agregar Ubicación
          </button>
        </div>
      </div>

      {/* Level count badges */}
      <div className="flex items-center gap-2 mb-6">
        {Object.entries(NIVEL_BADGE).map(([n, { label, cls }]) => (
          <span key={n} className={`text-xs font-medium px-2.5 py-1 rounded-full ${cls}`}>
            {label}: {all.filter(u => u.nivel === Number(n)).length}
          </span>
        ))}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 mb-5">
        <div className="relative">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="border border-gray-200 rounded-lg pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white w-72"
            placeholder="Buscar por código o nombre…"
          />
        </div>
        <select
          value={nivelFilter}
          onChange={e => setNivelFilter(e.target.value)}
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-700"
        >
          {NIVEL_OPTIONS.map(o => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
        {(search || nivelFilter) && (
          <button
            onClick={() => { setSearch(''); setNivelFilter('') }}
            className="text-sm text-gray-400 hover:text-gray-700 transition-colors"
          >
            Limpiar
          </button>
        )}
        <span className="text-sm text-gray-400 ml-auto">
          {filtered.length} resultado{filtered.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="text-left px-6 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider w-44">Código</th>
              <th className="text-left px-6 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Nombre</th>
              <th className="text-center px-6 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider w-32">Nivel</th>
              <th className="w-12" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {filtered.length === 0 && (
              <tr>
                <td colSpan={4} className="px-6 py-16 text-center text-gray-400 text-sm">
                  Sin resultados para &ldquo;{search}&rdquo;
                </td>
              </tr>
            )}
            {filtered.map(u => {
              const badge = NIVEL_BADGE[u.nivel]
              return (
                <tr key={u.codigo} className="hover:bg-blue-50/20 transition-colors group">
                  <td className="px-6 py-3.5">
                    <span className="font-mono text-sm bg-slate-100 text-slate-700 px-2 py-1 rounded-md whitespace-nowrap">
                      {u.codigo}
                    </span>
                  </td>
                  <td className="px-6 py-3.5 text-sm text-gray-800 font-medium">
                    {u.nombre}
                  </td>
                  <td className="px-6 py-3.5 text-center">
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${badge.cls}`}>
                      {badge.label}
                    </span>
                  </td>
                  <td className="px-3 py-3.5 text-center">
                    {u.id && (
                      <button
                        onClick={() => handleDelete(u.id)}
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
      </div>

      {modal && <AgregarModal onClose={() => setModal(false)} onSave={handleSave} />}
    </div>
  )
}

import { useState, useMemo, useEffect } from 'react'
import { getMpExtra, addMpExtra, deleteMpExtra, logAction } from '../lib/db'
import Pagination from '../components/Pagination'

const PER_PAGE = 10

const RAW = [
  { codigo: 'MP10102', nombre: 'POLIPROPILENO LLD' },
  { codigo: 'MP10109', nombre: 'POLIPROPILENO VIRGEN PIGMENTADO BLANCO' },
  { codigo: 'MP10110', nombre: 'POLIPROPILENO INACTIVO' },
  { codigo: 'MP10112', nombre: 'POLIPROPILENO VIRGEN HOMOPOLIMERO MELT 13 DENSIDAD 0.90 RESISTENCIA 35' },
  { codigo: 'MP10113', nombre: 'POLIPROPILENO TRANSPARENTE ROJIZO' },
  { codigo: 'MP10114', nombre: 'POLIPROPILENO TRANSPARENTE VERDE' },
  { codigo: 'MP10115', nombre: 'POLIPROPILENO VIRGEN 9162' },
  { codigo: 'MP10116', nombre: 'POLIPROPILENO FUERA DE GRADO TAIWAN' },
  { codigo: 'MP190100001', nombre: 'PP HOMOPOLIMERO TRANSPARENTE MI12 VIRGEN' },
  { codigo: 'MP190100002', nombre: 'PP HOMOPOLIMERO BLANCO FUERA_GRADO' },
  { codigo: 'MP190100003', nombre: 'PP MATERIA PRIMA MULTICOLOR CONTAMINADA' },
  { codigo: 'MP190100004', nombre: 'PP HOMOPOLIMERO TRANSPARENTE MI26 VIRGEN' },
  { codigo: 'MP190100005', nombre: 'PP HOMOPOLIMERO TRANSPARENTE MI20 VIRGEN' },
  { codigo: 'MP190100006', nombre: 'PP HOMOPOLIMERO TRANSPARENTE MI27 VIRGEN' },
  { codigo: 'MP190100007', nombre: 'POLIETILENO DE ALTA DENSIDAD TRANSPARENTE' },
  { codigo: 'MP190100008', nombre: 'POLIESTIRENO CRISTAL' },
  { codigo: 'MP190100010', nombre: 'PP HOMOPOLIMERO TRANSPARENTE FUERA_GRADO' },
  { codigo: 'MP190100011', nombre: 'PP HOMOPOLIMERO TRANSPARENTE MI25 VIRGEN' },
  { codigo: 'MP190100012', nombre: 'PP HOMOPOLIMERO TRANSPARENTE MI24 VIRGEN' },
  { codigo: 'MP190100013', nombre: 'PP PBM1' },
  { codigo: 'MP190100015', nombre: 'POLIETILENO LINEAL DE BAJA DENSIDAD (LLDPE)' },
  { codigo: 'MP190100017', nombre: 'PP HOMOPOLIMERO TRANSPARENTE MI8 VIRGEN' },
  { codigo: 'MP190101001', nombre: 'PP HOMOPOLIMERO AZUL FUERA_GRADO GRAY' },
  { codigo: 'MP190101002', nombre: 'Polipropileno Azul Oscuro' },
  { codigo: 'MP190101014', nombre: 'POLIPROPILENO VIRGEN HOMOPOLIMERO 20 DENSIDAD 0,905' },
  { codigo: 'MP190101016', nombre: 'PVC RIGIDO - VIRGEN' },
  { codigo: 'MP190102003', nombre: 'Polipropileno Molido Color Azul Hl' },
  { codigo: 'MP190104001', nombre: 'Polipropileno Molido Color Morado Hl' },
  { codigo: 'MP190108001', nombre: 'PP HOMOPOLIMERO BLANCO TAIWAN FUERA_GRADO' },
  { codigo: 'MP190108002', nombre: 'PP GRAY A BLANCO' },
  { codigo: 'MP190108003', nombre: 'PP HOMOPOLIMERO BLANCO HUEZO FUERA_GRADO' },
  { codigo: 'MP190108004', nombre: 'PP HOMOPOLIMERO BLANCO ABS' },
  { codigo: 'MP190108005', nombre: 'PP COPOLIMERO VIRGEN TRANSPARENTE' },
  { codigo: 'MP190108006', nombre: 'PP COPOLIMERO VIRGEN TRANSPARENTE 8.0' },
  { codigo: 'MP190108007', nombre: 'Polipropileno natural blanco' },
  { codigo: 'MP190108008', nombre: 'PP HOMOPOLIMERO BEIGE TAIWAN' },
  { codigo: 'MP190109001', nombre: 'PP HOMOPOLIMERO NEGRO FUERA_GRADO GREY' },
  { codigo: 'MP190109002', nombre: 'PP HOMOPOLIMERO MATERIAL NEGRO PVC VIRGEN' },
  { codigo: 'MP190109003', nombre: 'Polipropileno Molido Color Negro Hl' },
  { codigo: 'MP190109009', nombre: 'Polvo Blanco Pvc-Cynpol' },
  { codigo: 'MP190110010', nombre: 'Polvo Blanco Pvc-Sg8' },
  { codigo: 'MP190111001', nombre: 'PP HOMOPOLIMERO CAFÉ FUERA_GRADO GRAY' },
  { codigo: 'MP190111002', nombre: 'PP HOMOPOLIMERO CAFÉ_CLARO FUERA_GRADO GRAY' },
  { codigo: 'MP190111003', nombre: 'PP HOMOPOLIMERO CAFÉ MI08 GRAY' },
  { codigo: 'MP190111004', nombre: 'Polipropileno Molido Cafe Hl' },
  { codigo: 'MP190112001', nombre: 'POLIPROPILENO MULTICOLOR' },
  { codigo: 'MP1901M0001', nombre: 'PP HOMOPOLIMERO TRANSPARENTE FUERA_GRADO PRUEBAS' },
  { codigo: 'MP1901M0002', nombre: 'PP HOMOPOLIMERO BLANCO' },
  { codigo: 'MP1901M0003', nombre: 'MUESTRA MATERIA PRIMA NYLON PA6' },
  { codigo: 'MP1901M0004', nombre: 'MUESTRA POLIETILENO DE BAJA DENSIDAD LDF2023S1' },
  { codigo: 'MP1901M0005', nombre: 'POLIPROPILENO MULTICOLOR RECICLADO' },
  { codigo: 'MP190200001', nombre: 'PELETIZADO TRANSPARENTE POLIESTIRENO' },
  { codigo: 'MP190201001', nombre: 'PELETIZADO COLOR AZUL' },
  { codigo: 'MP190201002', nombre: 'PELETIZADO POLIETILENO AZUL' },
  { codigo: 'MP190201003', nombre: 'PELETIZADO COLOR AZUL MARINO' },
  { codigo: 'MP190202001', nombre: 'PELETIZADO VERDE' },
  { codigo: 'MP190202002', nombre: 'PELETIZADO POLIETILENO VERDE' },
  { codigo: 'MP190206001', nombre: 'PELETIZADO ROJO' },
  { codigo: 'MP190206002', nombre: 'PELETIZADO POLIETILENO ROJO' },
  { codigo: 'MP190208001', nombre: 'PELETIZADO HDPE BLANCO POLIETILENO' },
  { codigo: 'MP190208002', nombre: 'PELETIZADO BLANCO' },
  { codigo: 'MP190209001', nombre: 'PELETIZADO NEGRO ABS' },
  { codigo: 'MP190209002', nombre: 'PELETIZADO COLOR NEGRO' },
  { codigo: 'MP190210001', nombre: 'PELETIZADO POLIETILENO AMARILLO' },
  { codigo: 'MP190210002', nombre: 'PELETIZADO COLOR AMARILLO' },
  { codigo: 'MP190211001', nombre: 'Peletizado Color Cafe' },
  { codigo: 'MP190212001', nombre: 'PELETIZADO MULTICOLOR POLIETILENO' },
  { codigo: 'MP190212002', nombre: 'PELETIZADO MULTICOLOR POLIPROPILENO' },
  { codigo: 'MP190213001', nombre: 'PELETIZADO COLOR GRIS' },
  { codigo: 'MP190300004', nombre: 'MATERIAL NEGRO PARA XTREME VIRGEN' },
  { codigo: 'MP190300005', nombre: 'RECICLADO POLIESTIRENO CRISTAL' },
  { codigo: 'MP190300006', nombre: 'RECICLADO PVC FLEXIBLE' },
  { codigo: 'MP190301001', nombre: 'RECICLADO AZUL' },
  { codigo: 'MP190303001', nombre: 'RECICLADO ROSADO' },
  { codigo: 'MP190308001', nombre: 'RECICLADO BLANCO' },
  { codigo: 'MP190308002', nombre: 'RECICLADO BLANCO ABS' },
  { codigo: 'MP190309001', nombre: 'RECICLADO NEGRO' },
  { codigo: 'MP190309002', nombre: 'RECICLADO NEGRO PVC' },
  { codigo: 'MP190309005', nombre: 'RECICLADO NEGRO ABS' },
  { codigo: 'MP190311001', nombre: 'RECICLADO CAFÉ' },
  { codigo: 'MP190312001', nombre: 'RECICLADO MULTICOLOR' },
  { codigo: 'MP190312002', nombre: 'RECICLADO MULTICOLOR ABS' },
  { codigo: 'MP190312003', nombre: 'PVC RIGIDO RECICLADO' },
  { codigo: 'MP190401001', nombre: 'COLORANTE AZUL' },
  { codigo: 'MP190401002', nombre: 'COLORANTE AZUL TAIWAN' },
  { codigo: 'MP190401003', nombre: 'COLORANTE AZUL 513' },
  { codigo: 'MP190401004', nombre: 'COLORANTE AZUL X037' },
  { codigo: 'MP190401005', nombre: 'COLORANTE AZUL SPLASH' },
  { codigo: 'MP190401006', nombre: 'COLORANTE MENTA CARIBE (MB AQUA 207)' },
  { codigo: 'MP190401007', nombre: 'COLORANTE CELESTE AZUL CARIBE 03010 (0408)' },
  { codigo: 'MP190401008', nombre: 'COLORANTE MB CELESTE' },
  { codigo: 'MP190402001', nombre: 'COLORANTE VERDE' },
  { codigo: 'MP190402002', nombre: 'COLORANTE VERDE 003' },
  { codigo: 'MP190402003', nombre: 'COLORANTE VERDE 605' },
  { codigo: 'MP190402004', nombre: 'COLORANTE VERDE SPLASH' },
  { codigo: 'MP190403001', nombre: 'COLORANTE ROSADO' },
  { codigo: 'MP190403002', nombre: 'COLORANTE ROSADO CARIBE 07001 (1149)' },
  { codigo: 'MP190403003', nombre: 'COLORANTE MB ROSADO' },
  { codigo: 'MP190404001', nombre: 'COLORANTE MORADO' },
  { codigo: 'MP190404002', nombre: 'COLORANTE MORADO SPLASH' },
  { codigo: 'MP190404003', nombre: 'COLORANTE VIOLETA 001' },
  { codigo: 'MP190405001', nombre: 'COLORANTE TERRACOTA' },
  { codigo: 'MP190406001', nombre: 'COLORANTE ROJO' },
  { codigo: 'MP190406002', nombre: 'COLORANTE ROJO VINO' },
  { codigo: 'MP190406003', nombre: 'COLORANTE ROJO SPLASH' },
  { codigo: 'MP190406004', nombre: 'COLORANTE ROJO TAIWAN' },
  { codigo: 'MP190407001', nombre: 'COLORANTE NARANJA' },
  { codigo: 'MP190408001', nombre: 'COLORANTE BLANCO' },
  { codigo: 'MP190408002', nombre: 'COLORANTE BLANCO HUEZO' },
  { codigo: 'MP190408003', nombre: 'COLORANTE BLANCO POLVO' },
  { codigo: 'MP190408004', nombre: 'COLORANTE BLANCO ME' },
  { codigo: 'MP190408005', nombre: 'ADITIVO TRANSPARENTE' },
  { codigo: 'MP190409001', nombre: 'COLORANTE NEGRO' },
  { codigo: 'MP190410001', nombre: 'COLORANTE AMARILLO' },
  { codigo: 'MP190410002', nombre: 'COLORANTE AMARILLO TAIWAN' },
  { codigo: 'MP190410003', nombre: 'COLORANTE AMARILLO CARIBE 04059W' },
  { codigo: 'MP190411001', nombre: 'COLORANTE CAFÉ' },
  { codigo: 'MP190411002', nombre: 'COLORANTE CAFÉ 004' },
  { codigo: 'MP190411003', nombre: 'COLORANTE CAFÉ SPLASH' },
  { codigo: 'MP190411004', nombre: 'COLORANTE CAFE 838' },
  { codigo: 'MP190413001', nombre: 'COLORANTE CHACOIL-GRAY' },
  { codigo: 'MP190413002', nombre: 'COLORANTE PLATA' },
  { codigo: 'MP190413003', nombre: 'COLORANTE GRIS COCOA194' },
  { codigo: 'MP190413004', nombre: 'Colorante Gris Metalico' },
  { codigo: 'MP20102', nombre: 'POLIPROPILENO GRAY TAIWAN VERDE' },
  { codigo: 'MP20103', nombre: 'POLIPROPILENO GRAY TAIWAN ROSADO' },
  { codigo: 'MP20104', nombre: 'POLIPROPILENO GRAY TAIWAN MORADO' },
  { codigo: 'MP20105', nombre: 'POLIPROPILENO GRAY TAIWAN TERRACOTA' },
  { codigo: 'MP20106', nombre: 'POLIPROPILENO GRAY TAIWAN ROJO' },
  { codigo: 'MP20107', nombre: 'POLIPROPILENO GRAY TAIWAN NARANJA' },
  { codigo: 'MP20108', nombre: 'POLIPROPILENO GRAY TAIWAN BLANCO' },
  { codigo: 'MP30103', nombre: 'PELETIZADO COLOR ROSADO' },
  { codigo: 'MP30104', nombre: 'PELETIZADO COLOR MORADO' },
  { codigo: 'MP30105', nombre: 'PELETIZADO COLOR TERRACOTA' },
  { codigo: 'MP30107', nombre: 'PELETIZADO COLOR NARANJA' },
  { codigo: 'MP3010801', nombre: 'PELETIZADO COLOR BLANCO POLIETILENO' },
  { codigo: 'MP30109', nombre: 'PELETIZADO COLOR VERDE CLASICO' },
  { codigo: 'MP30110', nombre: 'PELETIZADO COLOR AZUL CLASICO' },
  { codigo: 'MP30113', nombre: 'MATERIAL BLANCO' },
  { codigo: 'MP40128', nombre: 'COLORANTE OCRE' },
  { codigo: 'MP50102', nombre: 'RECICLADO VERDE' },
  { codigo: 'MP50104', nombre: 'RECICLADO MORADO' },
  { codigo: 'MP50105', nombre: 'RECICLADO TERRACOTA' },
  { codigo: 'MP50106', nombre: 'RECICLADO ROJO' },
  { codigo: 'MP50107', nombre: 'RECICLADO NARANJA' },
  { codigo: 'MP50109', nombre: 'POLIPROPILENO RECICLADO TAIWAN 0918' },
  { codigo: 'MP50114', nombre: 'RECICLADO RABO COLORES' },
  { codigo: 'MP50125', nombre: 'RECICLADO AMARILLO' },
  { codigo: 'MP50127', nombre: 'RECICLADO COCOA GRAY' },
  { codigo: 'MP70101', nombre: 'POLIPROPILENO MOLIDO AZUL' },
  { codigo: 'MP70104', nombre: 'POLIPROPILENO MOLIDO MORADO' },
  { codigo: 'MP70107', nombre: 'POLIPROPILENO MOLIDO NARANJA' },
  { codigo: 'MP70108', nombre: 'GRAY BLANCO HUEZO' },
  { codigo: 'MP80108', nombre: 'POLIPROPILENO CLARIFICADO TAIWAN' },
  { codigo: 'ME20002600010', nombre: 'TINTA IMPRESORA SUNTHINKS NEGRA' },
  { codigo: 'ME20002600101', nombre: 'TINTA IMPRESORA SUNTHINKS CYAN' },
  { codigo: 'ME20002600214', nombre: 'TINTA IMPRESORA SUNTHINKS AMARILLO' },
  { codigo: 'ME20002600308', nombre: 'TINTA IMPRESORA SUNTHINKS BLANCO' },
  { codigo: 'ME20002600404', nombre: 'TINTA IMPRESORA SUNTHINKS MAGENTA' },
]

function getCategoria(nombre) {
  const n = nombre.toUpperCase()
  if (n.includes('TINTA')) return 'Tinta'
  if (n.includes('COLORANTE') || n.includes('ADITIVO')) return 'Colorante'
  if (n.includes('PELETIZADO') || n.includes('PELET')) return 'Peletizado'
  if (n.includes('RECICLADO')) return 'Reciclado'
  if (n.includes('MUESTRA')) return 'Muestra'
  if (n.includes('MOLIDO')) return 'Molido'
  if (n.includes('GRAY TAIWAN')) return 'Gray Taiwan'
  if (n.includes('CLARIFICADO')) return 'Clarificado'
  return 'Virgen / Base'
}

const CATEGORIA_STYLE = {
  'Virgen / Base': { cls: 'bg-blue-50 text-blue-700',      dot: 'bg-blue-500' },
  'Peletizado':    { cls: 'bg-violet-50 text-violet-700',  dot: 'bg-violet-500' },
  'Reciclado':     { cls: 'bg-green-50 text-green-700',    dot: 'bg-green-500' },
  'Colorante':     { cls: 'bg-pink-50 text-pink-700',      dot: 'bg-pink-500' },
  'Molido':        { cls: 'bg-amber-50 text-amber-700',    dot: 'bg-amber-500' },
  'Gray Taiwan':   { cls: 'bg-slate-100 text-slate-700',   dot: 'bg-slate-500' },
  'Clarificado':   { cls: 'bg-cyan-50 text-cyan-700',      dot: 'bg-cyan-500' },
  'Muestra':       { cls: 'bg-orange-50 text-orange-700',  dot: 'bg-orange-400' },
  'Tinta':         { cls: 'bg-fuchsia-50 text-fuchsia-700', dot: 'bg-fuchsia-500' },
}

const DATA = RAW.map(r => ({ ...r, categoria: getCategoria(r.nombre) }))
const CATEGORIAS = ['Todos', ...Object.keys(CATEGORIA_STYLE)]

function AgregarModal({ onClose, onSave }) {
  const [form, setForm] = useState({ codigo: '', nombre: '' })
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))
  const canSave = form.codigo.trim() && form.nombre.trim()

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900">Nueva Materia Prima</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 text-xl">×</button>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Código</label>
            <input value={form.codigo} onChange={e => set('codigo', e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Ej: MP190414001" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Nombre</label>
            <input value={form.nombre} onChange={e => set('nombre', e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Nombre de la materia prima" />
          </div>
          {form.nombre && (
            <p className="text-xs text-gray-400">
              Categoría detectada: <span className="font-semibold text-gray-600">{getCategoria(form.nombre)}</span>
            </p>
          )}
        </div>
        <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-100 bg-gray-50 rounded-b-2xl">
          <button onClick={onClose} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 font-medium">Cancelar</button>
          <button onClick={() => onSave({ ...form, categoria: getCategoria(form.nombre) })} disabled={!canSave}
            className="px-5 py-2 text-sm bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
            Agregar
          </button>
        </div>
      </div>
    </div>
  )
}

export default function MateriaPrima() {
  const [extras, setExtras] = useState([])
  const [search, setSearch] = useState('')
  const [cat, setCat] = useState('Todos')
  const [modal, setModal] = useState(false)
  const [page, setPage] = useState(1)

  useEffect(() => {
    getMpExtra().then(data => setExtras(data.map(r => ({ ...r, categoria: getCategoria(r.nombre) })))).catch(console.error)
  }, [])

  const all = useMemo(() => [...extras, ...DATA], [extras])

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return all.filter(m => {
      const matchSearch = !q || m.codigo.toLowerCase().includes(q) || m.nombre.toLowerCase().includes(q)
      const matchCat = cat === 'Todos' || m.categoria === cat
      return matchSearch && matchCat
    })
  }, [all, search, cat])

  const counts = useMemo(() =>
    Object.fromEntries(
      Object.keys(CATEGORIA_STYLE).map(c => [c, all.filter(m => m.categoria === c).length])
    ), [all])

  const paginated = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE)

  const handleSave = async (item) => {
    try {
      const saved = await addMpExtra(item)
      setExtras(e => [...e, { ...saved, categoria: getCategoria(saved.nombre) }])
      logAction('crear', 'Materia Prima', saved.nombre)
    } catch (e) { console.error(e) }
    setSearch(''); setCat('Todos'); setModal(false)
  }

  const handleDelete = async (id) => {
    const item = extras.find(x => x.id === id)
    try {
      await deleteMpExtra(id)
      setExtras(e => e.filter(x => x.id !== id))
      logAction('eliminar', 'Materia Prima', item?.nombre || '')
    } catch (e) { console.error(e) }
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Materia Prima</h2>
          <p className="text-gray-500 text-sm mt-0.5">Catálogo de materias primas · {all.length} registros</p>
        </div>
        <button onClick={() => setModal(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors shadow-sm shadow-blue-200">
          <span className="text-lg leading-none">+</span> Agregar Materia Prima
        </button>
      </div>

      {/* Category pills */}
      <div className="flex flex-wrap gap-2 mb-5">
        {CATEGORIAS.map(c => {
          const isActive = cat === c
          const style = CATEGORIA_STYLE[c]
          return (
            <button
              key={c}
              onClick={() => { setCat(c); setPage(1) }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                isActive
                  ? c === 'Todos'
                    ? 'bg-slate-900 text-white border-slate-900'
                    : `${style.cls} border-current`
                  : 'bg-white text-gray-500 border-gray-200 hover:border-gray-400'
              }`}
            >
              {style && (
                <span className={`w-1.5 h-1.5 rounded-full ${isActive ? style.dot : 'bg-gray-300'}`} />
              )}
              {c}
              {c !== 'Todos' && (
                <span className={`ml-0.5 ${isActive ? 'opacity-70' : 'text-gray-400'}`}>
                  {counts[c]}
                </span>
              )}
              {c === 'Todos' && (
                <span className={`ml-0.5 ${isActive ? 'opacity-70' : 'text-gray-400'}`}>
                  {DATA.length}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {/* Search + count */}
      <div className="flex items-center gap-3 mb-5">
        <div className="relative">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1) }}
            className="border border-gray-200 rounded-lg pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white w-72"
            placeholder="Buscar por código o nombre…"
          />
        </div>
        {search && (
          <button onClick={() => setSearch('')} className="text-sm text-gray-400 hover:text-gray-700 transition-colors">
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
              <th className="text-center px-6 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider w-36">Categoría</th>
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
            {paginated.map(m => {
              const style = CATEGORIA_STYLE[m.categoria]
              return (
                <tr key={m.codigo} className="hover:bg-gray-50/80 transition-colors group">
                  <td className="px-6 py-3.5">
                    <span className="font-mono text-sm bg-slate-100 text-slate-700 px-2 py-1 rounded-md whitespace-nowrap">
                      {m.codigo}
                    </span>
                  </td>
                  <td className="px-6 py-3.5 text-sm text-gray-800 font-medium">{m.nombre}</td>
                  <td className="px-6 py-3.5 text-center">
                    <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full ${style.cls}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${style.dot}`} />
                      {m.categoria}
                    </span>
                  </td>
                  <td className="px-3 py-3.5 text-center">
                    {m.id && (
                      <button
                        onClick={() => handleDelete(m.id)}
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
        <Pagination page={page} total={filtered.length} perPage={PER_PAGE} onPage={setPage} />
      </div>

      {modal && <AgregarModal onClose={() => setModal(false)} onSave={handleSave} />}
    </div>
  )
}

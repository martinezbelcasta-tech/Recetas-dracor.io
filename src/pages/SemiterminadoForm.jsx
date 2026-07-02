import { useState, useMemo, useRef, useEffect } from 'react'
import { MP_LIST } from '../data/materias-primas'
import { UBI_LIST } from '../data/ubicaciones'
import { getMpExtra, getUbiExtra } from '../lib/db'

/* Ítems de costo que siempre usan el peso de la pieza como cantidad */
const COST_ITEMS = [
  { codigo: 'MODIREC01', nombre: 'Mano de Obra Directa' },
  { codigo: 'CFAB01',    nombre: 'Carga Fabril' },
]
const SPECIAL_CODES = new Set(['MODIREC01', 'CFAB01'])

function matchTokens(query, item) {
  if (!query.trim()) return true
  const haystack = `${item.codigo} ${item.nombre}`.toLowerCase()
  return query.toLowerCase().trim().split(/\s+/).every(t => haystack.includes(t))
}

function SearchModal({ title, data, onSelect, onClose }) {
  const [query, setQuery] = useState('')
  const inputRef = useRef(null)

  useEffect(() => { inputRef.current?.focus() }, [])
  useEffect(() => {
    const h = (e) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', h)
    return () => document.removeEventListener('keydown', h)
  }, [onClose])

  const results = useMemo(() =>
    data.filter(d => matchTokens(query, d)).slice(0, 80)
  , [data, query])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6"
      style={{ background: 'rgba(15,23,42,0.5)', backdropFilter: 'blur(4px)' }}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl flex flex-col"
        style={{ maxHeight: '80vh' }}>
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-gray-100">
          <div>
            <h3 className="text-base font-semibold text-gray-900">{title}</h3>
            <p className="text-xs text-gray-400 mt-0.5">
              {results.length} resultado{results.length !== 1 ? 's' : ''}{query && ` para "${query}"`}
            </p>
          </div>
          <button onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors text-lg">×</button>
        </div>
        <div className="px-6 py-3 border-b border-gray-100">
          <div className="relative">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4"
              viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <input ref={inputRef} value={query} onChange={e => setQuery(e.target.value)}
              className="w-full border border-gray-200 rounded-xl pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Escribe nombre, código o abreviatura…" />
            {query && (
              <button onClick={() => setQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-300 hover:text-gray-600 text-lg leading-none">×</button>
            )}
          </div>
        </div>
        <div className="overflow-y-auto flex-1">
          {results.length === 0
            ? <div className="py-16 text-center text-gray-400 text-sm">Sin resultados para &ldquo;{query}&rdquo;</div>
            : <div className="divide-y divide-gray-50">
                {results.map(item => (
                  <button key={item.codigo} onClick={() => { onSelect(item); onClose() }}
                    className="w-full text-left px-6 py-3.5 hover:bg-blue-50 transition-colors flex items-start gap-4 group">
                    <span className={`font-mono text-xs px-2 py-1 rounded-md shrink-0 mt-0.5 transition-colors ${
                      SPECIAL_CODES.has(item.codigo)
                        ? 'bg-amber-50 text-amber-700 group-hover:bg-amber-100'
                        : 'bg-slate-100 text-slate-600 group-hover:bg-blue-100 group-hover:text-blue-700'
                    }`}>
                      {item.codigo}
                    </span>
                    <div className="flex-1">
                      <span className="text-sm text-gray-800 leading-snug group-hover:text-blue-900">{item.nombre}</span>
                      {SPECIAL_CODES.has(item.codigo) && (
                        <span className="ml-2 text-xs bg-amber-100 text-amber-600 px-1.5 py-0.5 rounded font-medium">UNIDAD · usa peso pieza</span>
                      )}
                    </div>
                  </button>
                ))}
              </div>
          }
        </div>
        <div className="px-6 py-3 border-t border-gray-100 bg-gray-50 rounded-b-2xl">
          <p className="text-xs text-gray-400">
            {data.length} registros · <kbd className="bg-gray-200 text-gray-600 px-1.5 py-0.5 rounded text-xs font-mono">Esc</kbd> para cerrar
          </p>
        </div>
      </div>
    </div>
  )
}

function PickerField({ value, placeholder, onOpen, onClear }) {
  return (
    <div className="flex items-center gap-1.5 w-full">
      <button type="button" onClick={onOpen}
        className={`flex-1 text-left border rounded-lg px-3 py-1.5 text-sm transition-colors hover:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
          value ? 'border-gray-300 text-gray-800 bg-white' : 'border-gray-300 text-gray-400 bg-white'
        }`}>
        {value || placeholder}
      </button>
      {value && (
        <button type="button" onClick={onClear}
          className="w-6 h-6 flex items-center justify-center text-gray-300 hover:text-red-500 rounded transition-colors shrink-0 text-lg leading-none">×</button>
      )}
    </div>
  )
}

function Toggle({ value, onChange, label }) {
  return (
    <button type="button" onClick={() => onChange(!value)} className="flex items-center gap-2.5 group">
      <div className={`relative w-10 h-5 rounded-full transition-colors ${value ? 'bg-blue-600' : 'bg-gray-200'}`}>
        <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow-sm transition-transform ${value ? 'translate-x-5' : ''}`} />
      </div>
      <span className="text-sm font-medium text-gray-700 group-hover:text-gray-900">{label}</span>
    </button>
  )
}

function autoCodigo(nombre) {
  if (!nombre.trim()) return ''
  const words = nombre.trim().toUpperCase().replace(/[^A-Z0-9 ]/g, '').split(/\s+/).filter(w => w.length > 1)
  return 'ST-' + words.map(w => w[0]).join('').slice(0, 5)
}

function newItem() {
  return { id: Date.now() + Math.random(), mp_codigo: '', mp_nombre: '', kg: '', ubi_codigo: '', ubi_nombre: '' }
}

function fmt(n) {
  if (!isFinite(n) || n === 0) return '—'
  return n.toFixed(4)
}

export default function SemiterminadoForm({ initial, onSave, onCancel, saving }) {
  const [form, setForm] = useState(() => initial ? { ...initial } : {
    nombre: '', codigo: '',
    peso: '', peso_unidad: 'g',
    foto: null, foto_preview: null,
    tiene_medidas: false, ancho: '', alto: '', largo: '', profundidad: '',
    items: [newItem()],
  })
  const [modal, setModal] = useState(null)
  const [codigoManual, setCodigoManual] = useState(!!initial)
  const [mpExtras, setMpExtras] = useState([])
  const [ubiExtras, setUbiExtras] = useState([])

  useEffect(() => {
    getMpExtra().then(setMpExtras).catch(() => {})
    getUbiExtra().then(setUbiExtras).catch(() => {})
  }, [])

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const handleNombre = (v) =>
    setForm(f => ({ ...f, nombre: v, codigo: codigoManual ? f.codigo : autoCodigo(v) }))

  const handleFoto = (e) => {
    const file = e.target.files[0]; if (!file) return
    setForm(f => {
      if (f.foto_preview?.startsWith('blob:')) URL.revokeObjectURL(f.foto_preview)
      return { ...f, foto: file, foto_preview: URL.createObjectURL(file) }
    })
  }

  const addItem    = () => set('items', [...form.items, newItem()])
  const removeItem = (id) => set('items', form.items.filter(i => i.id !== id))
  const updateItem = (id, patch) => set('items', form.items.map(i => i.id === id ? { ...i, ...patch } : i))

  const fillAllUbi = () => {
    const first = form.items.find(i => i.ubi_codigo)
    if (!first) return
    set('items', form.items.map(i => ({ ...i, ubi_codigo: first.ubi_codigo, ubi_nombre: first.ubi_nombre })))
  }

  const pesoNum  = parseFloat(form.peso) || 0
  const pesoUnit = form.peso_unidad

  /* totalKg excluye los ítems especiales (MODIREC01, CFAB01) */
  const totalKg = useMemo(() =>
    form.items
      .filter(i => !SPECIAL_CODES.has(i.mp_codigo))
      .reduce((s, i) => s + (parseFloat(i.kg) || 0), 0)
  , [form.items])

  const canSave = form.nombre.trim() && form.codigo.trim() && form.items.length > 0

  return (
    <div className="p-8">
      {/* Top bar */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <button onClick={onCancel}
            className="flex items-center gap-1.5 text-sm font-semibold text-red-600 bg-red-50 border border-red-200 hover:bg-red-100 hover:border-red-400 px-3 py-1.5 rounded-lg transition-colors">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <polyline points="15 18 9 12 15 6"/>
            </svg>
            Volver
          </button>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              {initial ? 'Editar Receta' : 'Nueva Receta Semiterminado'}
            </h2>
            <p className="text-gray-400 text-sm mt-0.5">% y {pesoUnit}/pieza se calculan automáticamente según el peso ingresado</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
            Cancelar
          </button>
          <button onClick={() => canSave && !saving && onSave(form)} disabled={!canSave || saving}
            className="px-5 py-2.5 text-sm font-semibold bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors shadow-sm shadow-blue-200 flex items-center gap-2">
            {saving && <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />}
            {saving ? 'Guardando…' : initial ? 'Guardar cambios' : 'Crear receta'}
          </button>
        </div>
      </div>

      {/* Datos generales + Foto */}
      <div className="grid grid-cols-5 gap-5 mb-5">
        <div className="col-span-3 bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-5">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Datos generales</p>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Nombre del producto <span className="text-red-400">*</span>
            </label>
            <input value={form.nombre} onChange={e => handleNombre(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Nombre del producto" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Código <span className="text-xs text-gray-400 font-normal">(auto, editable)</span>
              </label>
              <input value={form.codigo}
                onChange={e => { setCodigoManual(true); set('codigo', e.target.value) }}
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="ST-..." />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Peso de la pieza
                <span className="text-xs text-gray-400 font-normal ml-1">(base para calcular x/pieza)</span>
              </label>
              <div className="flex gap-2">
                <input type="number" min="0" step="0.001" value={form.peso}
                  onChange={e => set('peso', e.target.value)}
                  className="flex-1 border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="0.000" />
                <select value={form.peso_unidad} onChange={e => set('peso_unidad', e.target.value)}
                  className="w-16 border border-gray-300 rounded-lg px-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option>g</option><option>kg</option>
                </select>
              </div>
            </div>
          </div>
          <div className="space-y-3">
            <Toggle value={form.tiene_medidas} onChange={v => set('tiene_medidas', v)} label="El producto tiene medidas" />
            {form.tiene_medidas && (
              <div className="grid grid-cols-4 gap-3 pt-1">
                {['ancho', 'alto', 'largo', 'profundidad'].map(dim => (
                  <div key={dim}>
                    <label className="block text-xs font-medium text-gray-500 mb-1 capitalize">{dim} (cm)</label>
                    <input type="number" min="0" step="0.1" value={form[dim]}
                      onChange={e => set(dim, e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="0" />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Foto */}
        <div className="col-span-2 bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">Foto del producto</p>
          <label className="cursor-pointer block">
            {form.foto_preview ? (
              <div className="relative group h-52">
                <img src={form.foto_preview} alt="preview"
                  className="w-full h-full object-contain rounded-lg border border-gray-200 bg-gray-50" />
                <div className="absolute inset-0 bg-black/40 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <span className="text-white text-sm font-semibold">Cambiar foto</span>
                </div>
              </div>
            ) : (
              <div className="h-52 border-2 border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center gap-3 hover:border-blue-400 hover:bg-blue-50/20 transition-colors">
                <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-gray-400">
                    <rect x="3" y="3" width="18" height="18" rx="2"/>
                    <circle cx="8.5" cy="8.5" r="1.5"/>
                    <polyline points="21 15 16 10 5 21"/>
                  </svg>
                </div>
                <div className="text-center">
                  <p className="text-sm font-medium text-gray-500">Click para subir foto</p>
                  <p className="text-xs text-gray-300 mt-0.5">JPG, PNG, WEBP</p>
                </div>
              </div>
            )}
            <input type="file" accept="image/*" className="hidden" onChange={handleFoto} onClick={e => { e.target.value = '' }} />
          </label>
          {form.foto_preview && (
            <button type="button"
              onClick={() => setForm(f => {
                if (f.foto_preview?.startsWith('blob:')) URL.revokeObjectURL(f.foto_preview)
                return { ...f, foto: null, foto_preview: null }
              })}
              className="mt-3 text-xs text-red-400 hover:text-red-600 transition-colors">
              Quitar foto
            </button>
          )}
        </div>
      </div>

      {/* Tabla fórmula */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-gray-900">Fórmula de Mezcla</h3>
            <p className="text-xs text-gray-400 mt-0.5">
              KG de cada MP · % y {pesoNum > 0 ? `${pesoUnit}/pieza` : 'x/pieza'} automáticos ·
              <span className="text-amber-500 font-medium"> MODIREC01 y CFAB01 usan peso de pieza directamente</span>
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold text-gray-400 bg-gray-100 px-2.5 py-1 rounded-full">
              {form.items.length} ítem{form.items.length !== 1 ? 's' : ''}
            </span>
            {totalKg > 0 && (
              <div className="text-right">
                <p className="text-xs text-gray-400 mb-0.5">Total mezcla</p>
                <p className="text-xl font-bold text-gray-900">
                  {totalKg.toFixed(2)} <span className="text-sm font-normal text-gray-500">KG</span>
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="overflow-auto" style={{ maxHeight: '420px' }}>
          <table className="w-full">
            <thead className="sticky top-0 z-10">
              <tr className="bg-gray-50 border-b border-gray-200 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                <th className="text-left px-4 py-3 w-8">#</th>
                <th className="text-left px-4 py-3">Nombre Materia Prima</th>
                <th className="text-left px-4 py-3 w-36">Código</th>
                <th className="text-center px-4 py-3 w-24">Unidad</th>
                <th className="text-right px-4 py-3 w-28">KG / Cantidad</th>
                <th className="text-right px-4 py-3 w-20">%</th>
                <th className="text-right px-4 py-3 w-28">{pesoNum > 0 ? `${pesoUnit}/pieza` : 'x/pieza'}</th>
                <th className="text-left px-4 py-3">
                  <div className="flex items-center gap-2">
                    <span>Ubicación Salida</span>
                    <button type="button" onClick={fillAllUbi}
                      className="text-xs font-normal text-blue-500 hover:text-blue-700 border border-blue-200 hover:border-blue-400 hover:bg-blue-50 rounded px-1.5 py-0.5 transition-colors whitespace-nowrap">
                      ↓ Igualar todas
                    </button>
                  </div>
                </th>
                <th className="text-left px-4 py-3 w-40">Código Ubic.</th>
                <th className="w-10" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {form.items.map((item, idx) => {
                const isSpecial = SPECIAL_CODES.has(item.mp_codigo)
                const kg        = isSpecial ? pesoNum : (parseFloat(item.kg) || 0)
                const pct       = (!isSpecial && totalKg > 0) ? (kg / totalKg) * 100 : null
                const xPieza    = (!isSpecial && totalKg > 0 && pesoNum > 0) ? (kg / totalKg) * pesoNum : null

                return (
                  <tr key={item.id}
                    className={`group transition-colors ${isSpecial ? 'bg-amber-50/40 hover:bg-amber-50/70' : 'hover:bg-gray-50/40'}`}>
                    <td className="px-4 py-1.5 text-xs text-gray-300 text-right">{idx + 1}</td>

                    {/* Nombre */}
                    <td className="px-4 py-1.5">
                      <PickerField
                        value={item.mp_nombre}
                        placeholder="Click para buscar material…"
                        onOpen={() => setModal({ type: 'mp', itemId: item.id })}
                        onClear={() => updateItem(item.id, { mp_codigo: '', mp_nombre: '' })}
                      />
                    </td>

                    {/* Código MP */}
                    <td className="px-4 py-1.5">
                      {item.mp_codigo
                        ? <span className={`font-mono text-xs px-2 py-1 rounded-md whitespace-nowrap ${
                            isSpecial ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-700'
                          }`}>{item.mp_codigo}</span>
                        : <span className="text-xs text-gray-300 italic">— auto —</span>}
                    </td>

                    {/* Unidad */}
                    <td className="px-4 py-1.5 text-center">
                      {isSpecial
                        ? <span className="text-xs font-bold bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">UNIDAD</span>
                        : <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">KILOGRAMO</span>
                      }
                    </td>

                    {/* KG / Cantidad */}
                    <td className="px-4 py-1.5">
                      {isSpecial ? (
                        <div className="w-full border border-amber-200 rounded-lg px-3 py-1.5 text-sm text-right bg-amber-50 text-amber-800 font-semibold">
                          {pesoNum > 0 ? pesoNum.toFixed(4) : <span className="text-amber-400 font-normal text-xs">ingresa peso</span>}
                        </div>
                      ) : (
                        <input type="number" min="0" step="0.01" value={item.kg}
                          onChange={e => updateItem(item.id, { kg: e.target.value })}
                          className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm text-right focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="0" />
                      )}
                    </td>

                    {/* % */}
                    <td className="px-4 py-1.5 text-right">
                      {pct !== null && pct > 0
                        ? <span className="text-sm font-semibold text-indigo-600">{pct.toFixed(2)}%</span>
                        : <span className="text-xs text-gray-300">—</span>}
                    </td>

                    {/* x/pieza */}
                    <td className="px-4 py-1.5 text-right">
                      {isSpecial
                        ? (pesoNum > 0
                            ? <span className="text-sm font-semibold text-amber-600">{pesoNum.toFixed(4)}</span>
                            : <span className="text-xs text-gray-300">—</span>)
                        : (xPieza !== null
                            ? <span className="text-sm font-semibold text-emerald-600">{fmt(xPieza)}</span>
                            : <span className="text-xs text-gray-300">—</span>)
                      }
                    </td>

                    {/* Ubicación */}
                    <td className="px-4 py-1.5">
                      {isSpecial ? (
                        <div className="flex-1 border border-amber-200 rounded-lg px-3 py-1.5 text-sm bg-amber-50 text-amber-800 font-medium truncate cursor-default select-none">
                          Costos Directos de Fabricacion
                        </div>
                      ) : (
                        <PickerField
                          value={item.ubi_nombre}
                          placeholder="Click para buscar ubicación…"
                          onOpen={() => setModal({ type: 'ubi', itemId: item.id })}
                          onClear={() => updateItem(item.id, { ubi_codigo: '', ubi_nombre: '' })}
                        />
                      )}
                    </td>

                    {/* Código Ubic */}
                    <td className="px-4 py-1.5">
                      {isSpecial
                        ? <span className="font-mono text-xs bg-amber-100 text-amber-800 px-2 py-1 rounded-md whitespace-nowrap">UBI07GIF</span>
                        : item.ubi_codigo
                          ? <span className="font-mono text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded-md whitespace-nowrap">{item.ubi_codigo}</span>
                          : <span className="text-xs text-gray-300 italic">— auto —</span>}
                    </td>

                    {/* Eliminar */}
                    <td className="px-3 py-1.5">
                      <button onClick={() => removeItem(item.id)} disabled={form.items.length === 1}
                        className="opacity-0 group-hover:opacity-100 w-7 h-7 flex items-center justify-center text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all disabled:hidden">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                        </svg>
                      </button>
                    </td>
                  </tr>
                )
              })}

              {/* Fila total */}
              {totalKg > 0 && (
                <tr className="bg-gray-50 border-t-2 border-gray-200">
                  <td />
                  <td className="px-4 py-2 text-xs font-bold text-gray-500 uppercase tracking-wide">Total mezcla</td>
                  <td /><td />
                  <td className="px-4 py-2 text-right">
                    <span className="text-sm font-bold text-gray-900">{totalKg.toFixed(2)}</span>
                    <span className="text-xs text-gray-400 ml-1">KG</span>
                  </td>
                  <td className="px-4 py-2 text-right">
                    <span className="text-sm font-bold text-indigo-600">100%</span>
                  </td>
                  <td className="px-4 py-2 text-right">
                    {pesoNum > 0 && (
                      <span className="text-sm font-bold text-emerald-600">
                        {pesoNum.toFixed(4)} <span className="text-xs font-normal text-gray-400">{pesoUnit}</span>
                      </span>
                    )}
                  </td>
                  <td colSpan={3} />
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="px-6 py-3.5 bg-gray-50 border-t border-gray-100">
          <button onClick={addItem}
            className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center gap-1.5 transition-colors">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            Agregar materia prima
          </button>
        </div>
      </div>

      {modal?.type === 'mp' && (
        <SearchModal title="Buscar Materia Prima" data={[...COST_ITEMS, ...mpExtras, ...MP_LIST]}
          onSelect={mp => {
            const patch = { mp_codigo: mp.codigo, mp_nombre: mp.nombre }
            if (SPECIAL_CODES.has(mp.codigo)) {
              patch.ubi_codigo = 'UBI07GIF'
              patch.ubi_nombre = 'Costos Directos de Fabricacion'
            }
            updateItem(modal.itemId, patch)
          }}
          onClose={() => setModal(null)} />
      )}
      {modal?.type === 'ubi' && (
        <SearchModal title="Buscar Ubicación de Salida" data={[...ubiExtras, ...UBI_LIST]}
          onSelect={ubi => updateItem(modal.itemId, { ubi_codigo: ubi.codigo, ubi_nombre: ubi.nombre })}
          onClose={() => setModal(null)} />
      )}
    </div>
  )
}

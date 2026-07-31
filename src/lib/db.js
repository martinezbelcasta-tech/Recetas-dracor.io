import { supabase } from './supabase'

// ── activity log ─────────────────────────────────────────────────────────────
async function getCurrentUser() {
  const { data: { user } } = await supabase.auth.getUser()
  return user?.email || 'desconocido'
}

export async function logAction(accion, modulo, detalle = '') {
  const usuario = await getCurrentUser()
  await supabase.from('activity_log').insert([{ usuario, accion, modulo, detalle }])
}

export async function getActivityLog() {
  const { data, error } = await supabase
    .from('activity_log')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(500)
  if (error) throw error
  return data
}

// ── helpers ─────────────────────────────────────────────────────────────────
function stripLocal(form) {
  const { foto, foto_preview, ...rest } = form
  return rest
}

async function uploadFoto(file, storagePath) {
  const ext = file.name.split('.').pop().toLowerCase()
  const path = `${storagePath}.${ext}`
  const { error } = await supabase.storage
    .from('recetas-fotos')
    .upload(path, file, { upsert: true, contentType: file.type })
  if (error) throw error
  return supabase.storage.from('recetas-fotos').getPublicUrl(path).data.publicUrl
}

async function resolvePhotoUrl(foto, foto_preview, storagePath) {
  if (foto instanceof File) return await uploadFoto(foto, storagePath)
  // blob: es una URL temporal del navegador (muere al recargar). Nunca guardarla.
  if (foto_preview && !foto_preview.startsWith('blob:')) return foto_preview  // URL existente, conservar
  return null
}

// Trae TODOS los items paginando: Supabase corta cada request en 1000 filas.
// Orden (fk, sort_order) es único → paginación estable y cada grupo queda ordenado.
async function fetchAllItems(table, fkCol, ids) {
  if (!ids.length) return []
  const all = []
  for (let from = 0; ; from += 1000) {
    const { data, error } = await supabase
      .from(table).select('*').in(fkCol, ids)
      .order(fkCol).order('sort_order')
      .range(from, from + 999)
    if (error) throw error
    all.push(...data)
    if (data.length < 1000) break
  }
  return all
}

// ── SEMITERMINADOS ───────────────────────────────────────────────────────────
async function fetchOneSemiterminado(id) {
  const { data, error } = await supabase
    .from('semiterminados').select('*, semiterminado_items(*)').eq('id', id).single()
  if (error) throw error
  const items = (data.semiterminado_items || []).sort((a, b) => a.sort_order - b.sort_order)
  const { semiterminado_items: _, ...rest } = data
  return { ...rest, foto: null, foto_preview: data.foto_url || null, items }
}

export async function getSemiterminados() {
  const { data, error } = await supabase
    .from('semiterminados')
    .select('*')
    .order('revisado_at', { ascending: false, nullsFirst: false })  // revisadas arriba, más reciente primero
    .order('created_at', { ascending: false })
  if (error) throw error

  const ids = data.map(r => r.id)
  const itemsMap = {}
  ;(await fetchAllItems('semiterminado_items', 'semiterminado_id', ids)).forEach(it => {
    if (!itemsMap[it.semiterminado_id]) itemsMap[it.semiterminado_id] = []
    itemsMap[it.semiterminado_id].push(it)
  })

  return data.map(r => ({
    ...r,
    foto: null,
    foto_preview: r.foto_url || null,
    items: itemsMap[r.id] || [],
  }))
}

export async function saveSemiterminado(form) {
  const { items = [], id: existingId, foto, foto_preview, ...rest } = form
  const row = { ...rest }
  delete row.id

  row.foto_url = await resolvePhotoUrl(foto, foto_preview, `semiterminados/${existingId || crypto.randomUUID()}`)

  const toItems = (id) => items.map((it, i) => ({
    semiterminado_id: id,
    mp_codigo: it.mp_codigo, mp_nombre: it.mp_nombre,
    kg: it.kg, unidad: it.unidad || null, ubi_codigo: it.ubi_codigo, ubi_nombre: it.ubi_nombre,
    sort_order: i,
  }))

  let savedId = existingId

  if (existingId) {
    const [upd, del] = await Promise.all([
      supabase.from('semiterminados').update(row).eq('id', existingId),
      supabase.from('semiterminado_items').delete().eq('semiterminado_id', existingId),
    ])
    if (upd.error) throw upd.error
    if (del.error) throw del.error
    if (items.length) {
      const { error: e2 } = await supabase.from('semiterminado_items').insert(toItems(existingId))
      if (e2) throw e2
    }
  } else {
    const { data, error } = await supabase.from('semiterminados').insert([row]).select().single()
    if (error) throw error
    savedId = data.id
    if (items.length) {
      await supabase.from('semiterminado_items').insert(toItems(savedId))
    }
  }

  return fetchOneSemiterminado(savedId)
}

export async function deleteSemiterminado(id) {
  const { error } = await supabase.from('semiterminados').delete().eq('id', id)
  if (error) throw error
}

// ── PRODUCTOS TERMINADOS ─────────────────────────────────────────────────────
async function fetchOneProducto(id) {
  const { data, error } = await supabase
    .from('productos_terminados').select('*, producto_items(*)').eq('id', id).single()
  if (error) throw error
  const items = (data.producto_items || []).sort((a, b) => a.sort_order - b.sort_order)
  const { producto_items: _, ...rest } = data
  return { ...rest, foto: null, foto_preview: data.foto_url || null, items }
}

export async function getProductosTerminados() {
  const { data, error } = await supabase
    .from('productos_terminados')
    .select('*')
    .order('revisado_at', { ascending: false, nullsFirst: false })  // revisadas arriba, más reciente primero
    .order('created_at', { ascending: false })
  if (error) throw error

  const ids = data.map(r => r.id)
  const itemsMap = {}
  ;(await fetchAllItems('producto_items', 'producto_id', ids)).forEach(it => {
    if (!itemsMap[it.producto_id]) itemsMap[it.producto_id] = []
    itemsMap[it.producto_id].push(it)
  })

  return data.map(r => ({
    ...r,
    foto: null,
    foto_preview: r.foto_url || null,
    items: itemsMap[r.id] || [],
  }))
}

export async function saveProductoTerminado(form) {
  const { items = [], id: existingId, foto, foto_preview, ...rest } = form
  const row = { ...rest }
  delete row.id

  row.foto_url = await resolvePhotoUrl(foto, foto_preview, `productos/${existingId || crypto.randomUUID()}`)

  const toItems = (id) => items.map((it, i) => ({
    producto_id: id,
    comp_codigo: it.comp_codigo, comp_nombre: it.comp_nombre,
    unidad: it.unidad, cantidad: it.cantidad,
    ubi_codigo: it.ubi_codigo, ubi_nombre: it.ubi_nombre,
    sort_order: i,
  }))

  let savedId = existingId

  if (existingId) {
    const [upd, del] = await Promise.all([
      supabase.from('productos_terminados').update(row).eq('id', existingId),
      supabase.from('producto_items').delete().eq('producto_id', existingId),
    ])
    if (upd.error) throw upd.error
    if (del.error) throw del.error
    if (items.length) {
      const { error: e2 } = await supabase.from('producto_items').insert(toItems(existingId))
      if (e2) throw e2
    }
  } else {
    const { data, error } = await supabase.from('productos_terminados').insert([row]).select().single()
    if (error) throw error
    savedId = data.id
    if (items.length) {
      await supabase.from('producto_items').insert(toItems(savedId))
    }
  }

  return fetchOneProducto(savedId)
}

export async function deleteProductoTerminado(id) {
  const { error } = await supabase.from('productos_terminados').delete().eq('id', id)
  if (error) throw error
}

export async function marcarRevisado(tabla, id) {
  const { data: { user } } = await supabase.auth.getUser()
  const { error } = await supabase
    .from(tabla)
    .update({ revisado: true, revisado_por: user?.email, revisado_at: new Date().toISOString() })
    .eq('id', id)
  if (error) throw error
}

// ── CONSOLIDADO (API externa Sanchia) ────────────────────────────────────────
const CONSOLIDADO_API = 'https://sanchia-api-mx8id.ondigitalocean.app/api/manufactures/products'

// Categoría se deduce del prefijo del código (el API no la trae).
const catFromCodigo = (code = '') =>
  code.startsWith('PT') ? 'Prod. Terminado'
  : code.startsWith('ST') ? 'Semiterminado'
  : code.startsWith('ME') ? 'Empaque'
  : 'Otro'

const CONSOLIDADO_CACHE_KEY = 'consolidado:v1'
const CONSOLIDADO_TTL = 30 * 60 * 1000  // 30 min

export async function getConsolidadoProductos({ force = false } = {}) {
  // cache fresco → sin red (persiste entre recargas). "force" lo salta (botón Sincronizar).
  if (!force) {
    try {
      const c = JSON.parse(localStorage.getItem(CONSOLIDADO_CACHE_KEY) || 'null')
      if (c && Date.now() - c.t < CONSOLIDADO_TTL) return c.d
    } catch { /* cache corrupto, se ignora */ }
  }

  const res = await fetch(CONSOLIDADO_API)
  if (!res.ok) throw new Error(`API consolidado ${res.status}`)
  const data = (await res.json())
    .sort((a, b) => b.id - a.id)  // id mayor = recién creado → primero
    .map(p => ({ codigo: p.code, nombre: p.name, categoria: catFromCodigo(p.code) }))
  try { localStorage.setItem(CONSOLIDADO_CACHE_KEY, JSON.stringify({ t: Date.now(), d: data })) } catch { /* quota llena */ }
  return data
}

// ── CATÁLOGO EXTRA ───────────────────────────────────────────────────────────
export async function getCatalogoExtra() {
  const { data } = await supabase.from('catalogo_extra').select('*').order('created_at', { ascending: false })
  return data || []
}

export async function addCatalogoExtra(item) {
  const { data, error } = await supabase.from('catalogo_extra').insert([item]).select().single()
  if (error) throw error
  return data
}

export async function deleteCatalogoExtra(id) {
  const { error } = await supabase.from('catalogo_extra').delete().eq('id', id)
  if (error) throw error
}

// ── MATERIAS PRIMAS EXTRA ────────────────────────────────────────────────────
export async function getMpExtra() {
  const { data } = await supabase.from('mp_extra').select('*').order('nombre')
  return data || []
}

export async function addMpExtra(item) {
  const { data, error } = await supabase.from('mp_extra').insert([{ codigo: item.codigo, nombre: item.nombre }]).select().single()
  if (error) throw error
  return data
}

export async function deleteMpExtra(id) {
  const { error } = await supabase.from('mp_extra').delete().eq('id', id)
  if (error) throw error
}

// ── UBICACIONES EXTRA ────────────────────────────────────────────────────────
export async function getUbiExtra() {
  const { data } = await supabase.from('ubi_extra').select('*').order('nombre')
  return data || []
}

export async function addUbiExtra(item) {
  const { data, error } = await supabase.from('ubi_extra').insert([item]).select().single()
  if (error) throw error
  return data
}

export async function deleteUbiExtra(id) {
  const { error } = await supabase.from('ubi_extra').delete().eq('id', id)
  if (error) throw error
}

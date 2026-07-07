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
  if (foto_preview) return foto_preview  // URL existente, conservar
  return null
}

// ── SEMITERMINADOS ───────────────────────────────────────────────────────────
export async function getSemiterminados() {
  const { data, error } = await supabase
    .from('semiterminados')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) throw error

  const ids = data.map(r => r.id)
  let itemsMap = {}
  if (ids.length) {
    const { data: its } = await supabase
      .from('semiterminado_items')
      .select('*')
      .in('semiterminado_id', ids)
      .order('sort_order')
    ;(its || []).forEach(it => {
      if (!itemsMap[it.semiterminado_id]) itemsMap[it.semiterminado_id] = []
      itemsMap[it.semiterminado_id].push(it)
    })
  }

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

  if (existingId) {
    const { error } = await supabase.from('semiterminados').update(row).eq('id', existingId)
    if (error) throw error
    await supabase.from('semiterminado_items').delete().eq('semiterminado_id', existingId)
    if (items.length) {
      const { error: e2 } = await supabase.from('semiterminado_items').insert(
        items.map((it, i) => ({
          semiterminado_id: existingId,
          mp_codigo: it.mp_codigo, mp_nombre: it.mp_nombre,
          kg: it.kg, ubi_codigo: it.ubi_codigo, ubi_nombre: it.ubi_nombre,
          sort_order: i,
        }))
      )
      if (e2) throw e2
    }
    return existingId
  } else {
    const { data, error } = await supabase.from('semiterminados').insert([row]).select().single()
    if (error) throw error
    if (items.length) {
      await supabase.from('semiterminado_items').insert(
        items.map((it, i) => ({
          semiterminado_id: data.id,
          mp_codigo: it.mp_codigo, mp_nombre: it.mp_nombre,
          kg: it.kg, ubi_codigo: it.ubi_codigo, ubi_nombre: it.ubi_nombre,
          sort_order: i,
        }))
      )
    }
    return data.id
  }
}

export async function deleteSemiterminado(id) {
  const { error } = await supabase.from('semiterminados').delete().eq('id', id)
  if (error) throw error
}

// ── PRODUCTOS TERMINADOS ─────────────────────────────────────────────────────
export async function getProductosTerminados() {
  const { data, error } = await supabase
    .from('productos_terminados')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) throw error

  const ids = data.map(r => r.id)
  let itemsMap = {}
  if (ids.length) {
    const { data: its } = await supabase
      .from('producto_items')
      .select('*')
      .in('producto_id', ids)
      .order('sort_order')
    ;(its || []).forEach(it => {
      if (!itemsMap[it.producto_id]) itemsMap[it.producto_id] = []
      itemsMap[it.producto_id].push(it)
    })
  }

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

  if (existingId) {
    const { error } = await supabase.from('productos_terminados').update(row).eq('id', existingId)
    if (error) throw error
    await supabase.from('producto_items').delete().eq('producto_id', existingId)
    if (items.length) {
      await supabase.from('producto_items').insert(
        items.map((it, i) => ({
          producto_id: existingId,
          comp_codigo: it.comp_codigo, comp_nombre: it.comp_nombre,
          unidad: it.unidad, cantidad: it.cantidad,
          ubi_codigo: it.ubi_codigo, ubi_nombre: it.ubi_nombre,
          sort_order: i,
        }))
      )
    }
    return existingId
  } else {
    const { data, error } = await supabase.from('productos_terminados').insert([row]).select().single()
    if (error) throw error
    if (items.length) {
      await supabase.from('producto_items').insert(
        items.map((it, i) => ({
          producto_id: data.id,
          comp_codigo: it.comp_codigo, comp_nombre: it.comp_nombre,
          unidad: it.unidad, cantidad: it.cantidad,
          ubi_codigo: it.ubi_codigo, ubi_nombre: it.ubi_nombre,
          sort_order: i,
        }))
      )
    }
    return data.id
  }
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

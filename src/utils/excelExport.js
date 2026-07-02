import ExcelJS from 'exceljs'

const SPECIAL_CODES = new Set(['MODIREC01', 'CFAB01'])

/* ── helpers ─────────────────────────────────────────────────────── */
const BORDER = {
  top:    { style: 'thin', color: { argb: 'FFD1D5DB' } },
  left:   { style: 'thin', color: { argb: 'FFD1D5DB' } },
  bottom: { style: 'thin', color: { argb: 'FFD1D5DB' } },
  right:  { style: 'thin', color: { argb: 'FFD1D5DB' } },
}

const fill = (argb) => ({ type: 'pattern', pattern: 'solid', fgColor: { argb } })

function safeName(item) {
  return `${item.codigo}_${item.nombre}`.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 60)
}

async function triggerDownload(wb, filename) {
  const buf  = await wb.xlsx.writeBuffer()
  const blob = new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
  const url  = URL.createObjectURL(blob)
  const a    = document.createElement('a')
  a.style.display = 'none'
  a.href     = url
  a.download = `${filename}.xlsx`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  setTimeout(() => URL.revokeObjectURL(url), 100)
}

async function embedPhoto(wb, ws, item, col0, row0) {
  if (!item.foto_preview) return
  try {
    let base64, ext
    if (item.foto_preview.startsWith('blob:') || item.foto_preview.startsWith('http')) {
      const blob = await fetch(item.foto_preview).then(r => r.blob())
      ext = blob.type.includes('jpeg') || blob.type.includes('jpg') ? 'jpeg' : 'png'
      const buf = await blob.arrayBuffer()
      base64 = btoa(new Uint8Array(buf).reduce((s, b) => s + String.fromCharCode(b), ''))
    } else {
      const m = item.foto_preview.match(/^data:image\/(\w+);base64,(.+)$/)
      if (!m) return
      ext    = m[1] === 'jpeg' || m[1] === 'jpg' ? 'jpeg' : 'png'
      base64 = m[2]
    }
    const id = wb.addImage({ base64, extension: ext })
    ws.addImage(id, { tl: { col: col0, row: row0 }, ext: { width: 190, height: 190 } })
  } catch { /* imagen no disponible */ }
}

function infoRow(ws, label, value, mergeEnd, labelFill, labelColor) {
  const r = ws.addRow([label, value])
  r.height = 19
  const lc = r.getCell(1)
  lc.font      = { bold: true, size: 10, color: { argb: labelColor } }
  lc.fill      = fill(labelFill)
  lc.border    = BORDER
  lc.alignment = { vertical: 'middle' }
  const vc = r.getCell(2)
  vc.fill      = fill('FFFAFAFA')
  vc.font      = { size: 10, color: { argb: 'FF1E293B' } }
  vc.border    = BORDER
  vc.alignment = { vertical: 'middle' }
  ws.mergeCells(`B${r.number}:${mergeEnd}${r.number}`)
  return r
}

/* ── SEMITERMINADO ──────────────────────────────────────────────────── */
export async function exportSemiterminado(item) {
  const wb = new ExcelJS.Workbook()
  wb.creator = 'Recetas App'

  const ws = wb.addWorksheet('Receta ST')
  const NC = 9

  ws.columns = [
    { width: 5  }, // A  #
    { width: 18 }, // B  Código MP
    { width: 46 }, // C  Nombre MP
    { width: 13 }, // D  KG Mezcla
    { width: 11 }, // E  %
    { width: 13 }, // F  x/pieza
    { width: 13 }, // G  Unidad
    { width: 22 }, // H  Cód. Ubicación
    { width: 44 }, // I  Ubicación de Salida
    { width: 2  }, // J  separador
    { width: 27 }, // K  foto
  ]

  /* ── Título */
  const r1 = ws.addRow(['RECETA SEMITERMINADO'])
  ws.mergeCells('A1:I1')
  r1.height = 30
  const tc = r1.getCell(1)
  tc.font      = { bold: true, size: 14, color: { argb: 'FFFFFFFF' } }
  tc.fill      = fill('FF1E293B')
  tc.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 }

  ws.addRow([]).height = 5

  /* ── Info */
  const infoData = [
    ['NOMBRE DEL PRODUCTO', item.nombre],
    ['CÓDIGO',              item.codigo],
    ['PESO DE LA PIEZA',   item.peso ? `${item.peso} ${item.peso_unidad}` : '—'],
  ]
  if (item.tiene_medidas) {
    const dims = ['ancho','alto','largo','profundidad'].filter(d => item[d])
    if (dims.length) infoData.push(['MEDIDAS (cm)', dims.map(d => `${d}: ${item[d]}`).join('  ·  ')])
  }
  infoData.forEach(([label, value]) => infoRow(ws, label, value, 'I', 'FFF1F5F9', 'FF475569'))

  ws.addRow([]).height = 5

  /* ── Encabezado de tabla */
  const hr = ws.addRow([
    '#', 'CÓDIGO MP', 'NOMBRE MATERIA PRIMA',
    'KG MEZCLA', '%', `${item.peso_unidad || 'g'}/PIEZA`,
    'UNIDAD', 'CÓD. UBICACIÓN', 'UBICACIÓN DE SALIDA',
  ])
  hr.height = 22
  for (let c = 1; c <= NC; c++) {
    const cell = hr.getCell(c)
    cell.font      = { bold: true, size: 10, color: { argb: 'FFFFFFFF' } }
    cell.fill      = fill('FF2563EB')
    cell.border    = BORDER
    cell.alignment = { vertical: 'middle', horizontal: c <= 3 ? 'left' : 'center' }
  }

  /* ── Cálculos */
  const pesoNum = parseFloat(item.peso) || 0
  const totalKg = item.items
    .filter(i => !SPECIAL_CODES.has(i.mp_codigo))
    .reduce((s, i) => s + (parseFloat(i.kg) || 0), 0)

  /* ── Filas de datos */
  item.items.forEach((itm, idx) => {
    const isSpecial = SPECIAL_CODES.has(itm.mp_codigo)
    const kg        = parseFloat(itm.kg) || 0
    const pct       = !isSpecial && totalKg > 0
      ? (kg / totalKg * 100).toFixed(2) + ' %' : '—'
    const xPieza   = isSpecial
      ? (pesoNum > 0 ? pesoNum.toFixed(4) : '—')
      : (totalKg > 0 && pesoNum > 0 ? (kg / totalKg * pesoNum).toFixed(4) : '—')

    const r = ws.addRow([
      idx + 1,
      itm.mp_codigo,
      itm.mp_nombre,
      isSpecial ? '—' : (kg || '—'),
      pct,
      xPieza,
      isSpecial ? 'UNIDAD' : 'KILOGRAMO',
      isSpecial ? 'UBI07GIF' : itm.ubi_codigo,
      isSpecial ? 'Costos Directos de Fabricacion' : itm.ubi_nombre,
    ])
    r.height = 17

    const bg = isSpecial ? 'FFFFF8E1' : (idx % 2 === 0 ? 'FFFFFFFF' : 'FFF8FAFC')
    const fc = isSpecial ? 'FF92400E' : 'FF1E293B'
    for (let c = 1; c <= NC; c++) {
      const cell = r.getCell(c)
      cell.fill      = fill(bg)
      cell.font      = { size: 10, color: { argb: fc }, bold: isSpecial }
      cell.border    = BORDER
      cell.alignment = {
        vertical:   'middle',
        horizontal: c === 1 ? 'center' : (c >= 4 && c <= 6) ? 'right' : 'left',
      }
    }
  })

  /* ── Fila Total */
  const tr = ws.addRow([
    '', '', 'TOTAL MEZCLA',
    totalKg.toFixed(2),
    '100 %',
    pesoNum > 0 ? pesoNum.toFixed(4) : '—',
    '', '', '',
  ])
  tr.height = 21
  for (let c = 1; c <= NC; c++) {
    const cell = tr.getCell(c)
    cell.fill      = fill('FFDBEAFE')
    cell.font      = { bold: true, size: 10, color: { argb: 'FF1E40AF' } }
    cell.border    = BORDER
    cell.alignment = {
      vertical:   'middle',
      horizontal: c === 3 ? 'left' : (c >= 4 && c <= 6) ? 'right' : 'center',
    }
  }

  /* ── Foto */
  await embedPhoto(wb, ws, item, 10.3, 0.3)

  await triggerDownload(wb, safeName(item))
}

/* ── CSV helpers ────────────────────────────────────────────────────── */
function csvCell(v) {
  const s = v == null ? '' : String(v)
  return s.includes(',') || s.includes('"') || s.includes('\n') ? `"${s.replace(/"/g, '""')}"` : s
}

function downloadCsv(rows, filename) {
  const content = rows.map(r => r.map(csvCell).join(',')).join('\r\n')
  const blob = new Blob(['﻿' + content], { type: 'text/csv;charset=utf-8;' })
  const url  = URL.createObjectURL(blob)
  const a    = document.createElement('a')
  a.style.display = 'none'
  a.href     = url
  a.download = `${filename}.csv`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  setTimeout(() => URL.revokeObjectURL(url), 100)
}

export function exportSemiterminadoCSV(item) {
  const pesoNum = parseFloat(item.peso) || 0
  const totalKg = item.items
    .filter(i => !SPECIAL_CODES.has(i.mp_codigo))
    .reduce((s, i) => s + (parseFloat(i.kg) || 0), 0)

  const rows = [
    ['#', 'Código MP', 'Nombre Materia Prima', 'KG Mezcla', '%', `${item.peso_unidad || 'g'}/Pieza`, 'Unidad', 'Cód. Ubicación', 'Ubicación de Salida'],
  ]
  item.items.forEach((itm, idx) => {
    const isSpecial = SPECIAL_CODES.has(itm.mp_codigo)
    const kg        = parseFloat(itm.kg) || 0
    const pct       = !isSpecial && totalKg > 0 ? (kg / totalKg * 100).toFixed(2) : ''
    const xPieza   = isSpecial
      ? (pesoNum > 0 ? pesoNum.toFixed(4) : '')
      : (totalKg > 0 && pesoNum > 0 ? (kg / totalKg * pesoNum).toFixed(4) : '')
    rows.push([
      idx + 1,
      itm.mp_codigo,
      itm.mp_nombre,
      isSpecial ? '' : (kg || ''),
      pct,
      xPieza,
      isSpecial ? 'UNIDAD' : 'KILOGRAMO',
      isSpecial ? 'UBI07GIF' : itm.ubi_codigo,
      isSpecial ? 'Costos Directos de Fabricacion' : itm.ubi_nombre,
    ])
  })
  rows.push(['', '', 'TOTAL MEZCLA', totalKg.toFixed(2), '100', pesoNum > 0 ? pesoNum.toFixed(4) : '', '', '', ''])
  downloadCsv(rows, safeName(item))
}

export function exportProductoTerminadoCSV(item) {
  const rows = [
    ['#', 'Código', 'Nombre Componente', 'Tipo', 'Unidad', 'Cantidad', 'Cód. Ubicación', 'Ubicación de Salida'],
  ]
  item.items.forEach((itm, idx) => {
    const isSpecial = SPECIAL_CODES.has(itm.comp_codigo)
    rows.push([
      idx + 1,
      itm.comp_codigo,
      itm.comp_nombre,
      getTipo(itm.comp_codigo),
      isSpecial ? 'UNIDAD' : itm.unidad,
      isSpecial ? 1 : (parseFloat(itm.cantidad) || itm.cantidad || ''),
      isSpecial ? 'UBI07GIF' : itm.ubi_codigo,
      isSpecial ? 'Costos Directos de Fabricacion' : itm.ubi_nombre,
    ])
  })
  downloadCsv(rows, safeName(item))
}

/* ── PRODUCTO TERMINADO ─────────────────────────────────────────────── */
function getTipo(codigo) {
  if (SPECIAL_CODES.has(codigo))                          return 'Costo'
  if (codigo.startsWith('ST'))                            return 'Semiterminado'
  if (codigo.startsWith('ME') || codigo.startsWith('PT')) return 'Empaque'
  return 'Material'
}

export async function exportProductoTerminado(item) {
  const wb = new ExcelJS.Workbook()
  wb.creator = 'Recetas App'

  const ws = wb.addWorksheet('Receta PT')
  const NC = 8

  ws.columns = [
    { width: 5  }, // A  #
    { width: 18 }, // B  Código
    { width: 46 }, // C  Nombre componente
    { width: 16 }, // D  Tipo
    { width: 13 }, // E  Unidad
    { width: 11 }, // F  Cantidad
    { width: 22 }, // G  Cód. Ubicación
    { width: 44 }, // H  Ubicación de Salida
    { width: 2  }, // I  separador
    { width: 27 }, // J  foto
  ]

  /* ── Título */
  const r1 = ws.addRow(['RECETA PRODUCTO TERMINADO'])
  ws.mergeCells('A1:H1')
  r1.height = 30
  const tc = r1.getCell(1)
  tc.font      = { bold: true, size: 14, color: { argb: 'FFFFFFFF' } }
  tc.fill      = fill('FF064E3B')
  tc.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 }

  ws.addRow([]).height = 5

  /* ── Info */
  const infoData = [
    ['NOMBRE DEL PRODUCTO', item.nombre],
    ['CÓDIGO',              item.codigo],
  ]
  if (item.peso_neto)  infoData.push(['PESO NETO (sin empaque)',  `${item.peso_neto} ${item.peso_neto_unidad}`])
  if (item.peso_bruto) infoData.push(['PESO BRUTO (con empaque)', `${item.peso_bruto} ${item.peso_bruto_unidad}`])
  if (item.tiene_medidas) {
    const dims = ['ancho','alto','largo','profundidad'].filter(d => item[d])
    if (dims.length) infoData.push(['MEDIDAS (cm)', dims.map(d => `${d}: ${item[d]}`).join('  ·  ')])
  }
  infoData.forEach(([label, value]) => infoRow(ws, label, value, 'H', 'FFF0FDF4', 'FF065F46'))

  ws.addRow([]).height = 5

  /* ── Encabezado de tabla */
  const hr = ws.addRow([
    '#', 'CÓDIGO', 'NOMBRE COMPONENTE',
    'TIPO', 'UNIDAD', 'CANTIDAD',
    'CÓD. UBICACIÓN', 'UBICACIÓN DE SALIDA',
  ])
  hr.height = 22
  for (let c = 1; c <= NC; c++) {
    const cell = hr.getCell(c)
    cell.font      = { bold: true, size: 10, color: { argb: 'FFFFFFFF' } }
    cell.fill      = fill('FF059669')
    cell.border    = BORDER
    cell.alignment = { vertical: 'middle', horizontal: c <= 3 ? 'left' : 'center' }
  }

  /* ── Filas de datos */
  item.items.forEach((itm, idx) => {
    const isSpecial = SPECIAL_CODES.has(itm.comp_codigo)
    const r = ws.addRow([
      idx + 1,
      itm.comp_codigo,
      itm.comp_nombre,
      getTipo(itm.comp_codigo),
      isSpecial ? 'UNIDAD' : itm.unidad,
      isSpecial ? 1 : (parseFloat(itm.cantidad) || itm.cantidad || '—'),
      isSpecial ? 'UBI07GIF' : itm.ubi_codigo,
      isSpecial ? 'Costos Directos de Fabricacion' : itm.ubi_nombre,
    ])
    r.height = 17

    const bg = isSpecial ? 'FFFFF8E1' : (idx % 2 === 0 ? 'FFFFFFFF' : 'FFF0FDF4')
    const fc = isSpecial ? 'FF92400E' : 'FF1E293B'
    for (let c = 1; c <= NC; c++) {
      const cell = r.getCell(c)
      cell.fill      = fill(bg)
      cell.font      = { size: 10, color: { argb: fc }, bold: isSpecial }
      cell.border    = BORDER
      cell.alignment = {
        vertical:   'middle',
        horizontal: c === 1 ? 'center' : (c === 5 || c === 6) ? 'center' : 'left',
      }
    }
  })

  /* ── Foto */
  await embedPhoto(wb, ws, item, 9.3, 0.3)

  await triggerDownload(wb, safeName(item))
}

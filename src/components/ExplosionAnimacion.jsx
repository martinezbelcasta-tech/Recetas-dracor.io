import { useState, useEffect, useMemo } from 'react'

// Prototipo opción D (v3): "armado" del producto a partir de UNA sola foto.
// Como los componentes no tienen foto, cortamos la foto del producto en una grilla
// de piezas que arrancan dispersas (desplazadas + rotadas + invisibles) y convergen
// a su lugar, de abajo hacia arriba, hasta formar la imagen. Solo CSS + estado.
// El "Repetir" remonta la grilla (key) para reiniciar las transiciones de forma fiable.
const COLS = 4
const ROWS = 5
const STEP_MS = 60
const NPIEZAS = COLS * ROWS
const TOTAL_MS = NPIEZAS * STEP_MS + 650

// Piezas con offset disperso aleatorio + orden de entrada (base primero).
function buildPiezas() {
  const arr = []
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      arr.push({
        i: r * COLS + c, r, c,
        dx: Math.round((Math.random() * 2 - 1) * 220),
        dy: Math.round((Math.random() * 2 - 1) * 160),
        rot: Math.round((Math.random() * 2 - 1) * 45),
      })
    }
  }
  return arr
    .sort((a, b) => b.r - a.r)                 // de abajo hacia arriba
    .map((p, orden) => ({ ...p, orden }))
}

// Grilla animada. Se remonta en cada reproducción (via key en el padre),
// así arranca siempre desde el estado disperso y las transiciones corren limpias.
function Grid({ foto, dims }) {
  const piezas = useMemo(buildPiezas, [])      // offsets nuevos en cada montaje
  const [armado, setArmado] = useState(false)

  useEffect(() => {
    // Doble rAF: garantiza un pintado en el estado disperso antes de converger.
    let raf2
    const raf1 = requestAnimationFrame(() => { raf2 = requestAnimationFrame(() => setArmado(true)) })
    return () => { cancelAnimationFrame(raf1); cancelAnimationFrame(raf2) }
  }, [])

  return (
    <>
      <div className="relative h-full" style={{ aspectRatio: `${dims.w} / ${dims.h}`, maxWidth: '100%' }}>
        {piezas.map((p) => {
          const posX = COLS > 1 ? (p.c / (COLS - 1)) * 100 : 0
          const posY = ROWS > 1 ? (p.r / (ROWS - 1)) * 100 : 0
          return (
            <div
              key={p.i}
              className="absolute will-change-transform"
              style={{
                left: `${(p.c / COLS) * 100}%`,
                top: `${(p.r / ROWS) * 100}%`,
                width: `${100 / COLS}%`,
                height: `${100 / ROWS}%`,
                backgroundImage: `url(${foto})`,
                backgroundSize: `${COLS * 100}% ${ROWS * 100}%`,
                backgroundPosition: `${posX}% ${posY}%`,
                backgroundRepeat: 'no-repeat',
                opacity: armado ? 1 : 0,
                transform: armado ? 'none' : `translate(${p.dx}px, ${p.dy}px) rotate(${p.rot}deg) scale(0.6)`,
                transition: 'transform 550ms cubic-bezier(0.22,1,0.36,1), opacity 400ms ease-out',
                transitionDelay: `${p.orden * STEP_MS}ms`,
              }}
            />
          )
        })}
      </div>
      {/* Barra de progreso: 0→100% al montar */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-emerald-100">
        <div className="h-full bg-emerald-500" style={{ width: armado ? '100%' : '0%', transition: `width ${TOTAL_MS}ms linear` }} />
      </div>
    </>
  )
}

export default function ExplosionAnimacion({ productoNombre, productoFoto }) {
  const [dims, setDims] = useState({ w: 3, h: 4 })   // aspecto por defecto hasta que carga
  const [runId, setRunId] = useState(0)              // cambia en cada reproducción → remonta Grid
  const [listo, setListo] = useState(false)

  const play = () => { setListo(false); setRunId(r => r + 1) }

  // Autoplay al abrir / cambiar de producto, y marca "listo" al terminar.
  useEffect(() => {
    if (!productoFoto) return
    play()
    const t = setTimeout(() => setListo(true), TOTAL_MS)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productoFoto])

  // Al pulsar Repetir: reinicia el temporizador de "listo".
  useEffect(() => {
    if (runId === 0) return
    const t = setTimeout(() => setListo(true), TOTAL_MS)
    return () => clearTimeout(t)
  }, [runId])

  if (!productoFoto) {
    return (
      <div className="m-4 rounded-2xl border border-gray-100 bg-slate-50 px-4 py-10 text-center text-sm text-gray-400">
        Este producto no tiene foto cargada para animar el armado.
      </div>
    )
  }

  return (
    <div className="m-4 rounded-2xl border border-emerald-100 bg-gradient-to-b from-slate-50 to-emerald-50/40 overflow-hidden">
      {/* Encabezado + control */}
      <div className="flex items-center justify-between px-4 pt-3 pb-2">
        <span className="text-xs font-semibold uppercase tracking-wide text-emerald-700">Armado del producto</span>
        <button
          onClick={play}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-700 hover:text-emerald-800 border border-emerald-200 hover:bg-emerald-100 rounded-full px-2.5 py-1 transition-colors"
        >
          <svg viewBox="0 0 24 24" width="11" height="11" fill="currentColor"><path d="M12 5V1L7 6l5 5V7a5 5 0 1 1-5 5H5a7 7 0 1 0 7-7z" /></svg>
          {listo ? 'Repetir' : 'Armando…'}
        </button>
      </div>

      {/* Escenario */}
      <div className="px-4 pb-3">
        <div className="relative h-56 flex items-center justify-center overflow-hidden rounded-xl bg-white border border-gray-100">
          {/* img oculta solo para leer el aspecto real y no deformar las piezas */}
          <img src={productoFoto} alt="" className="hidden"
            onLoad={e => setDims({ w: e.target.naturalWidth || 3, h: e.target.naturalHeight || 4 })} />

          <Grid key={runId} foto={productoFoto} dims={dims} />

          {listo && (
            <span className="pointer-events-none absolute inset-3 rounded-lg ring-2 ring-emerald-400/60 animate-[ping_0.7s_ease-out_1]" />
          )}
        </div>
      </div>

      {/* Caption */}
      <p className={`px-4 pb-3 -mt-1 text-sm font-medium truncate ${listo ? 'text-emerald-700' : 'text-gray-500'}`}>
        {listo ? `✓ Producto armado: ${productoNombre || ''}` : 'Ensamblando…'}
      </p>
    </div>
  )
}

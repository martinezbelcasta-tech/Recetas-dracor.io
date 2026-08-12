import { useState, useEffect, useMemo, useRef } from 'react'

// Prototipo opción D (v2): "armado" del producto a partir de UNA sola foto.
// Como los componentes no tienen foto, cortamos la foto del producto en una grilla
// de piezas que arrancan dispersas (desplazadas + rotadas + invisibles) y convergen
// a su lugar, en secuencia, hasta formar la imagen completa. Solo CSS + estado.
const COLS = 4
const ROWS = 5

export default function ExplosionAnimacion({ productoNombre, productoFoto }) {
  const [dims, setDims] = useState({ w: 3, h: 4 })   // aspecto por defecto (portrait) hasta que carga
  const [armado, setArmado] = useState(false)        // dispara la convergencia de las piezas
  const [listo, setListo] = useState(false)          // todas las piezas llegaron
  const timers = useRef([])

  // Offsets iniciales estables por pieza (dispersión) + orden de entrada.
  const piezas = useMemo(() => {
    const arr = []
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        arr.push({
          r, c,
          dx: Math.round((Math.random() * 2 - 1) * 220),
          dy: Math.round((Math.random() * 2 - 1) * 160),
          rot: Math.round((Math.random() * 2 - 1) * 45),
        })
      }
    }
    // Entran de abajo hacia arriba (como se arma un mueble: base primero).
    return arr
      .map((p, i) => ({ ...p, i }))
      .sort((a, b) => b.r - a.r)
      .map((p, orden) => ({ ...p, orden }))
  }, [])

  const stepMs = 60
  const totalMs = piezas.length * stepMs + 650

  const play = () => {
    timers.current.forEach(clearTimeout)
    timers.current = []
    setListo(false)
    setArmado(false)
    // Siguiente frame: pasa a "armado" para que las transiciones corran desde el estado disperso.
    timers.current.push(setTimeout(() => setArmado(true), 40))
    timers.current.push(setTimeout(() => setListo(true), totalMs))
  }

  // Autoplay al abrir / cambiar de producto.
  useEffect(() => {
    play()
    return () => timers.current.forEach(clearTimeout)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productoFoto])

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

      {/* Escenario: grilla de piezas de la foto convergiendo */}
      <div className="px-4">
        <div className="relative h-56 flex items-center justify-center overflow-hidden rounded-xl bg-white border border-gray-100">
          {/* img oculta solo para leer el aspecto real y no deformar las piezas */}
          <img src={productoFoto} alt="" className="hidden"
            onLoad={e => setDims({ w: e.target.naturalWidth || 3, h: e.target.naturalHeight || 4 })} />

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
                    backgroundImage: `url(${productoFoto})`,
                    backgroundSize: `${COLS * 100}% ${ROWS * 100}%`,
                    backgroundPosition: `${posX}% ${posY}%`,
                    backgroundRepeat: 'no-repeat',
                    opacity: armado ? 1 : 0,
                    transform: armado ? 'none' : `translate(${p.dx}px, ${p.dy}px) rotate(${p.rot}deg) scale(0.6)`,
                    transition: 'transform 550ms cubic-bezier(0.22,1,0.36,1), opacity 400ms ease-out',
                    transitionDelay: `${p.orden * stepMs}ms`,
                  }}
                />
              )
            })}
          </div>

          {/* Anillo de "listo" */}
          {listo && (
            <span className="pointer-events-none absolute inset-3 rounded-lg ring-2 ring-emerald-400/60 animate-[ping_0.7s_ease-out_1]" />
          )}
        </div>
      </div>

      {/* Caption */}
      <p className={`px-4 mt-2 mb-1 text-sm font-medium truncate ${listo ? 'text-emerald-700' : 'text-gray-500'}`}>
        {listo ? `✓ Producto armado: ${productoNombre || ''}` : 'Ensamblando…'}
      </p>

      {/* Barra de progreso */}
      <div className="h-1 bg-emerald-100">
        <div className="h-full bg-emerald-500" style={{ width: armado ? '100%' : '0%', transition: `width ${totalMs}ms linear` }} />
      </div>
    </div>
  )
}

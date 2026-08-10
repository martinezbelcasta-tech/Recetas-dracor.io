import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'

// Miniatura que al hacer click se abre a pantalla completa.
// Cerrar: click en el overlay o tecla Esc.
export default function ZoomableImg({ src, alt = '', className = '' }) {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (!open) return
    const onKey = e => { if (e.key === 'Escape') setOpen(false) }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  return (
    <>
      <img src={src} alt={alt} className={`${className} cursor-zoom-in`}
        onClick={() => setOpen(true)} />
      {open && createPortal(
        <div onClick={() => setOpen(false)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-6 cursor-zoom-out">
          <img src={src} alt={alt}
            className="max-w-full max-h-full object-contain rounded-lg shadow-2xl" />
        </div>,
        document.body
      )}
    </>
  )
}

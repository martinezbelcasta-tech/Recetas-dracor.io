// Paginación reutilizable — misma UI que tenía Consolidado.
export default function Pagination({ page, total, perPage, onPage }) {
  const totalPages = Math.ceil(total / perPage)
  if (totalPages <= 1) return null

  const pages = Array.from({ length: totalPages }, (_, i) => i + 1)
    .filter(n => n === 1 || n === totalPages || Math.abs(n - page) <= 2)
    .reduce((acc, n, i, arr) => {
      if (i > 0 && n - arr[i - 1] > 1) acc.push('…')
      acc.push(n)
      return acc
    }, [])

  return (
    <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 bg-gray-50">
      <p className="text-sm text-gray-500">
        Mostrando {((page - 1) * perPage) + 1}–{Math.min(page * perPage, total)} de {total.toLocaleString()}
      </p>
      <div className="flex items-center gap-1">
        <button onClick={() => onPage(Math.max(1, page - 1))} disabled={page === 1}
          className="px-3 py-1.5 text-sm rounded-lg border border-gray-200 text-gray-600 hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
          ← Anterior
        </button>
        {pages.map((n, i) =>
          n === '…'
            ? <span key={`e${i}`} className="px-1 text-gray-400 text-sm">…</span>
            : (
              <button key={n} onClick={() => onPage(n)}
                className={`w-8 h-8 text-sm rounded-lg transition-colors ${
                  page === n ? 'bg-blue-600 text-white font-semibold' : 'text-gray-600 hover:bg-gray-100'
                }`}>
                {n}
              </button>
            )
        )}
        <button onClick={() => onPage(Math.min(totalPages, page + 1))} disabled={page === totalPages}
          className="px-3 py-1.5 text-sm rounded-lg border border-gray-200 text-gray-600 hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
          Siguiente →
        </button>
      </div>
    </div>
  )
}

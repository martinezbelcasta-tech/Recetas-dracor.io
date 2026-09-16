// Clave y limpieza del caché del consolidado. Vive aparte de db.js para poder
// verificarse en Node (db.js arrastra import.meta.env vía supabase.js).

export const CONSOLIDADO_CACHE_PREFIJO = 'consolidado:v4:'
const CLAVE_LEGADA = 'consolidado:v3'  // clave fija anterior, sin versión del estático

// El caché guarda la unión API+estático YA calculada. Con una clave fija, un
// producto agregado al estático quedaba invisible hasta 30 min para cualquiera
// con caché tibio. Atando la clave al tamaño del catálogo, un cambio en el
// estático invalida el caché solo.
export function claveCache(totalEstatico) {
  return CONSOLIDADO_CACHE_PREFIJO + totalEstatico
}

// Las entradas viejas pesan ~300 KB cada una: sin barrerlas se acumulan hasta
// llenar la cuota. Devuelve las claves eliminadas.
export function clavesAPurgar(claves, claveActual) {
  return claves.filter(
    (k) => (k.startsWith(CONSOLIDADO_CACHE_PREFIJO) || k === CLAVE_LEGADA) && k !== claveActual,
  )
}

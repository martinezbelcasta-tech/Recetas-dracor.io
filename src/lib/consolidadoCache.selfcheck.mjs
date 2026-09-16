// Self-check de consolidadoCache.js — Node puro, sin frameworks.
// Correr: node src/lib/consolidadoCache.selfcheck.mjs
import assert from 'node:assert/strict'
import { claveCache, clavesAPurgar } from './consolidadoCache.js'

// Agregar productos al estático debe cambiar la clave: ese era el bug. Con la
// clave fija, 6 productos nuevos no le llegaban a nadie con caché tibio.
assert.notEqual(claveCache(3206), claveCache(3212), 'un estático distinto exige clave distinta')
assert.equal(claveCache(3212), 'consolidado:v4:3212')
assert.equal(claveCache(3212), claveCache(3212), 'mismo estático, misma clave (el caché sirve)')

const actual = claveCache(3212)

// Se barre la clave fija vieja y las versiones anteriores; se conserva la actual.
assert.deepEqual(
  clavesAPurgar(['consolidado:v3', 'consolidado:v4:3206', actual], actual),
  ['consolidado:v3', 'consolidado:v4:3206'],
)

// No toca nada ajeno al consolidado.
assert.deepEqual(clavesAPurgar(['recetas:draft', 'sb-auth-token', actual], actual), [])

// Sin caché previo no hay nada que borrar.
assert.deepEqual(clavesAPurgar([actual], actual), [])

console.log('OK — consolidadoCache.selfcheck: todos los asserts pasaron')

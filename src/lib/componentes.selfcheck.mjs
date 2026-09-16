// Self-check de componentes.js — Node puro, sin frameworks.
// Correr: node src/lib/componentes.selfcheck.mjs
import assert from 'node:assert/strict'
import { unirComponentes } from './componentes.js'

const recetas  = [{ codigo: '300611', nombre: 'Marco Tocador Con espejo', origen: 'receta' }]
const costos   = [{ codigo: 'CFAB01', nombre: 'Carga Fabril' }]
const catalogo = [{ codigo: 'ME01', nombre: 'Bolsa' }, { codigo: '300611', nombre: 'Nombre viejo del catalogo' }]

// Una receta creada en la app aparece como componente: ese era el bug.
const todo = unirComponentes([recetas, costos, catalogo], null)
assert.ok(todo.some(c => c.codigo === '300611'), 'la receta de la app debe estar')

// Ante código repetido gana la receta (nombre más actual), no el catálogo.
assert.equal(todo.filter(c => c.codigo === '300611').length, 1, 'sin duplicados')
assert.equal(todo.find(c => c.codigo === '300611').nombre, 'Marco Tocador Con espejo')

// Los costos fijos nunca se pierden.
assert.ok(todo.some(c => c.codigo === 'CFAB01'))

// Una receta no se contiene a sí misma.
const editando = unirComponentes([recetas, costos, catalogo], '300611')
assert.ok(!editando.some(c => c.codigo === '300611'), 'la receta actual se excluye')
assert.ok(editando.some(c => c.codigo === 'ME01'), 'el resto sigue')

// Filas basura del API no rompen la lista.
assert.deepEqual(unirComponentes([[null, undefined, { nombre: 'sin codigo' }]], null), [])

console.log('OK — componentes.selfcheck: todos los asserts pasaron')

// Self-check de explosion.js — Node puro, sin frameworks.
// Correr: node src/lib/explosion.selfcheck.mjs
import assert from 'node:assert/strict'
import { buildRecipeIndex, explotar, rollupMaterias } from './explosion.js'

// ── Index de prueba ───────────────────────────────────────────────────────────
// PTx (1 PT) → 2 componentes ST: STa (x2) y STb (x1)
// STa (1 ST) → 2 MP: MPy (x3) y ME01 (empaque, x5)
// STb (1 ST) → 1 MP: MPz (x4)
const productos = [{
  codigo: 'PTx', nombre: 'Producto X', foto_url: 'http://foto/ptx.jpg',
  items: [
    { comp_codigo: 'STa', comp_nombre: 'Semi A', cantidad: 2, unidad: 'u', ubi_codigo: 'U1', ubi_nombre: 'Almacén 1' },
    { comp_codigo: 'STb', comp_nombre: 'Semi B', cantidad: 1, unidad: 'u', ubi_codigo: 'U1', ubi_nombre: 'Almacén 1' },
  ],
}]
const semiterminados = [
  {
    codigo: 'STa', nombre: 'Semi A', foto_url: null,
    items: [
      { mp_codigo: 'MPy', mp_nombre: 'Materia Y', kg: 3, unidad: 'kg', ubi_codigo: 'U2', ubi_nombre: 'Almacén 2' },
      { mp_codigo: 'ME01', mp_nombre: 'Empaque 01', kg: 5, unidad: 'u', ubi_codigo: 'U3', ubi_nombre: 'Almacén 3' },
    ],
  },
  {
    codigo: 'STb', nombre: 'Semi B', foto_url: null,
    items: [
      { mp_codigo: 'MPz', mp_nombre: 'Materia Z', kg: 4, unidad: 'kg', ubi_codigo: 'U2', ubi_nombre: 'Almacén 2' },
    ],
  },
]

const index = buildRecipeIndex({ productos, semiterminados })

// ── 1. buildRecipeIndex normaliza bien ────────────────────────────────────────
assert.equal(index.size, 3, 'index debe tener 3 recetas')
assert.equal(index.get('PTx').tipo, 'PT')
assert.equal(index.get('PTx').foto, 'http://foto/ptx.jpg')
assert.equal(index.get('STa').tipo, 'ST')
assert.equal(index.get('STa').componentes[0].codigo, 'MPy')
assert.equal(index.get('STa').componentes[0].cantidad, 3, 'ST usa kg como cantidad')

// ── 2. explotar: árbol de 2 niveles ───────────────────────────────────────────
const raiz = explotar('PTx', index)
assert.equal(raiz.codigo, 'PTx')
assert.equal(raiz.cantidad, 1, 'raíz cuenta como 1')
assert.equal(raiz.tipo, 'PT')
assert.equal(raiz.esHoja, false)
assert.equal(raiz.hijos.length, 2, 'PTx tiene 2 hijos')

const nodoSTa = raiz.hijos.find(h => h.codigo === 'STa')
assert.equal(nodoSTa.cantidad, 2)
assert.equal(nodoSTa.tipo, 'ST')
assert.equal(nodoSTa.hijos.length, 2)

const nodoMPy = nodoSTa.hijos.find(h => h.codigo === 'MPy')
assert.equal(nodoMPy.tipo, 'MP', 'hoja sin receta = MP')
assert.equal(nodoMPy.esHoja, true)
assert.equal(nodoMPy.cantidad, 3)

// ── 3. rollupMaterias: multiplica cantidades por rama ──────────────────────────
const { materiaPrima, empaque } = rollupMaterias(raiz)

// MPy: PTx(1) * STa(2) * MPy(3) = 6
const my = materiaPrima.find(l => l.codigo === 'MPy')
assert.equal(my.cantidad, 6, 'MPy debe ser 2*3 = 6')
// MPz: PTx(1) * STb(1) * MPz(4) = 4
const mz = materiaPrima.find(l => l.codigo === 'MPz')
assert.equal(mz.cantidad, 4, 'MPz debe ser 1*4 = 4')
// ME01: PTx(1) * STa(2) * ME01(5) = 10 → clasificado en empaque
const me = empaque.find(l => l.codigo === 'ME01')
assert.ok(me, 'ME01 debe ir a empaque')
assert.equal(me.cantidad, 10, 'ME01 debe ser 2*5 = 10')
assert.equal(materiaPrima.length, 2, 'solo MPy y MPz en materiaPrima')
assert.equal(empaque.length, 1, 'solo ME01 en empaque')

// ── 4. Corte de ciclo A→B→A ────────────────────────────────────────────────────
const idxCiclo = buildRecipeIndex({
  productos: [{
    codigo: 'A', nombre: 'A', foto_url: null,
    items: [{ comp_codigo: 'B', comp_nombre: 'B', cantidad: 1, unidad: 'u', ubi_codigo: '', ubi_nombre: '' }],
  }],
  semiterminados: [{
    codigo: 'B', nombre: 'B', foto_url: null,
    items: [{ mp_codigo: 'A', mp_nombre: 'A', kg: 1, unidad: 'u', ubi_codigo: '', ubi_nombre: '' }],
  }],
})
const raizCiclo = explotar('A', idxCiclo) // no debe colgar
const nodoB = raizCiclo.hijos[0]
assert.equal(nodoB.codigo, 'B')
const nodoAciclo = nodoB.hijos[0]
assert.equal(nodoAciclo.codigo, 'A')
assert.equal(nodoAciclo.ciclo, true, 'A→B→A debe marcar ciclo')
assert.equal(nodoAciclo.esHoja, true, 'nodo con ciclo se corta como hoja')

console.log('OK — explosion.selfcheck: todos los asserts pasaron')

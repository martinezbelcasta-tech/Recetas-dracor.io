import { useState } from 'react'
import Sidebar from './components/Sidebar'
import Login from './components/Login'
import Semiterminados from './pages/Semiterminados'
import ProductosTerminados from './pages/ProductosTerminados'
import Ubicaciones from './pages/Ubicaciones'
import MateriaPrima from './pages/MateriaPrima'
import Consolidado from './pages/Consolidado'
import Historial from './pages/Historial'

const PAGES = {
  semiterminados: <Semiterminados />,
  productos:      <ProductosTerminados />,
  consolidado:    <Consolidado />,
  ubicaciones:    <Ubicaciones />,
  'materia-prima':<MateriaPrima />,
  historial:      <Historial />,
}

export default function App() {
  const [user, setUser] = useState(() => localStorage.getItem('recetas_email') || sessionStorage.getItem('recetas_email'))
  const [page, setPage] = useState('semiterminados')

  if (!user) return <Login onLogin={setUser} />

  return (
    <div style={{ display:'flex', minHeight:'100vh', background:'var(--page-bg)' }}>
      <Sidebar active={page} onNavigate={setPage} user={user}
        onLogout={() => { localStorage.removeItem('recetas_email'); sessionStorage.removeItem('recetas_email'); setUser(null) }} />
      <main style={{ marginLeft:'var(--sb-width)', flex:1, overflowY:'auto', minHeight:'100vh' }}>
        {PAGES[page]}
      </main>
    </div>
  )
}

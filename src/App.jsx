import { useState, useEffect } from 'react'
import { supabase } from './lib/supabase'
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
  const [user, setUser]       = useState(null)
  const [loading, setLoading] = useState(true)
  const [page, setPage]       = useState('semiterminados')

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      setLoading(false)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT') setUser(null)
      else if (session?.user) setUser(session.user)
    })
    return () => subscription.unsubscribe()
  }, [])

  if (loading) return null

  if (!user) return <Login />

  return (
    <div style={{ display:'flex', minHeight:'100vh', background:'var(--page-bg)' }}>
      <Sidebar active={page} onNavigate={setPage} user={user.email}
        onLogout={() => supabase.auth.signOut()} />
      <main style={{ marginLeft:'var(--sb-width)', flex:1, overflowY:'auto', minHeight:'100vh' }}>
        {PAGES[page]}
      </main>
    </div>
  )
}

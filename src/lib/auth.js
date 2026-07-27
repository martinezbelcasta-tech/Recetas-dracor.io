// Auth manejado por Supabase Auth — ver dashboard.supabase.com → Authentication → Users
import { useEffect, useState } from 'react'
import { supabase } from './supabase'

// Único usuario autorizado a editar recetas
export const EDITOR_EMAIL = 'planificador02@sanchiacorporation.com'

// ponytail: gate solo de UI (client-side). Si se necesita seguridad real, usar RLS en Supabase.
export function useCanEdit() {
  const [email, setEmail] = useState(null)
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setEmail(data?.user?.email ?? null)).catch(() => {})
  }, [])
  return email === EDITOR_EMAIL
}

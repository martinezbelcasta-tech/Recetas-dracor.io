// Usuarios del sistema. Para agregar más: { password, role: 'admin' | 'readonly' }
const USERS = {
  'consulta@sanchia.com': { password: 'consulta2026', role: 'readonly' },
}

// Si el email no está en USERS, se permite acceso admin (compatibilidad con usuarios existentes)
export function authenticate(email, password) {
  const norm = email.toLowerCase().trim()
  const user = USERS[norm]
  if (user) {
    if (user.password !== password) return null
    return { email: norm, role: user.role }
  }
  return { email: norm, role: 'admin' }
}

export function isReadOnly(email) {
  if (!email) return false
  return USERS[email.toLowerCase().trim()]?.role === 'readonly'
}

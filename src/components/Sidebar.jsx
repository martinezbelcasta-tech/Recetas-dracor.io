const NAV_GROUPS = [
  {
    label: 'Recetas',
    items: [
      { id: 'semiterminados', label: 'Semiterminados', icon: <path d="M12 2 2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/> },
      { id: 'productos',      label: 'Prod. Terminados', icon: <><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></> },
    ],
  },
  {
    label: 'Gestión',
    items: [
      { id: 'consolidado',   label: 'Consolidado',   icon: <><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/><line x1="2" y1="20" x2="22" y2="20"/></> },
      { id: 'ubicaciones',   label: 'Ubicaciones',   icon: <><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></> },
      { id: 'materia-prima', label: 'Materia Prima',  icon: <><path d="M10 2v7.527a2 2 0 0 1-.211.896L4.72 20.55a1 1 0 0 0 .9 1.45h12.76a1 1 0 0 0 .9-1.45l-5.069-10.127A2 2 0 0 1 14 9.527V2"/><path d="M8.5 2h7"/><path d="M7 16h10"/></> },
      { id: 'historial',    label: 'Historial',       icon: <><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></> },
    ],
  },
]

export default function Sidebar({ active, onNavigate, user, onLogout }) {
  const initials = user ? user.charAt(0).toUpperCase() : 'U'

  return (
    <aside style={{
      background: 'var(--sb-bg)',
      display: 'flex',
      flexDirection: 'column',
      position: 'fixed',
      width: 'var(--sb-width)',
      height: '100vh',
      top: 0, left: 0,
      zIndex: 100,
      borderRight: '1px solid rgba(255,255,255,0.04)',
    }}>

      {/* ── Header / Brand ── */}
      <div style={{ display:'flex', alignItems:'center', gap:11, padding:'0 16px', height:56, flexShrink:0, borderBottom:'1px solid rgba(255,255,255,0.06)' }}>
        {/* Logo box con shine animation */}
        <div style={{ width:38, height:38, borderRadius:9, background:'#fff', display:'grid', placeItems:'center', flexShrink:0, overflow:'hidden', boxShadow:'0 2px 8px rgba(0,0,0,0.3)', position:'relative' }}>
          <img src="/logo.png" alt="Logo" style={{ width:30, height:30, objectFit:'contain', position:'relative', zIndex:1 }} />
          <span style={{ position:'absolute', top:'-50%', left:'-75%', width:'50%', height:'200%', background:'linear-gradient(120deg,transparent,rgba(255,255,255,0.75),transparent)', transform:'skewX(-15deg)', animation:'logoShine 2s ease-in-out infinite', pointerEvents:'none', zIndex:2 }}/>
        </div>
        <div>
          <div style={{ fontFamily:"'Archivo',sans-serif", fontSize:13, fontWeight:800, color:'#fff', letterSpacing:'-0.01em', whiteSpace:'nowrap' }}>
            Ind. Sanchia
          </div>
          <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9, fontWeight:600, letterSpacing:'0.16em', textTransform:'uppercase', color:'var(--gold)', marginTop:1 }}>
            Gestión Recetas
          </div>
        </div>
      </div>

      {/* ── Nav ── */}
      <nav style={{ flex:1, padding:'12px 8px', display:'flex', flexDirection:'column', gap:2, overflowY:'auto' }}>
        {NAV_GROUPS.map(group => (
          <div key={group.label} style={{ marginBottom:4 }}>
            <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9.5, fontWeight:700, letterSpacing:'0.14em', color:'var(--sb-muted)', padding:'8px 10px 6px', textTransform:'uppercase' }}>
              {group.label}
            </div>
            {group.items.map(item => {
              const isActive = active === item.id
              return (
                <button key={item.id} onClick={() => onNavigate(item.id)}
                  style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 12px', background: isActive ? 'var(--sb-active)' : 'transparent', border:'none', borderRadius:8, color: isActive ? '#fff' : 'var(--sb-text)', cursor:'pointer', width:'100%', textAlign:'left', transition:'background 0.12s', position:'relative', fontFamily:"'JetBrains Mono',sans-serif", fontSize:13, fontWeight: isActive ? 600 : 500 }}
                  onMouseEnter={e => { if (!isActive) e.currentTarget.style.background='var(--sb-hover)' }}
                  onMouseLeave={e => { if (!isActive) e.currentTarget.style.background='transparent' }}>
                  {isActive && (
                    <span style={{ position:'absolute', left:0, top:'20%', bottom:'20%', width:3, borderRadius:'0 3px 3px 0', background:'var(--gold)' }}/>
                  )}
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="17" height="17" style={{ flexShrink:0 }}>
                    {item.icon}
                  </svg>
                  <span style={{ whiteSpace:'nowrap' }}>{item.label}</span>
                </button>
              )
            })}
          </div>
        ))}
      </nav>

      {/* ── Footer: usuario + cerrar sesión ── */}
      <div style={{ padding:'12px 12px 14px', borderTop:'1px solid rgba(255,255,255,0.06)', flexShrink:0, display:'flex', flexDirection:'column', gap:10 }}>
        {user && (
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            <div style={{ width:32, height:32, borderRadius:'50%', background:'linear-gradient(135deg,var(--navy-700) 0%,var(--gold-dark) 100%)', display:'grid', placeItems:'center', fontFamily:"'Archivo',sans-serif", fontWeight:700, fontSize:13, color:'#fff', flexShrink:0 }}>
              {initials}
            </div>
            <div style={{ minWidth:0 }}>
              <div style={{ fontSize:12, fontWeight:600, color:'rgba(255,255,255,0.85)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', maxWidth:130 }}>
                {user}
              </div>
              <div style={{ fontSize:10, color:'var(--sb-muted)', marginTop:1 }}>Usuario</div>
            </div>
          </div>
        )}
        <button onClick={onLogout}
          style={{ display:'flex', alignItems:'center', gap:8, width:'100%', padding:'8px 11px', background:'rgba(220,38,38,0.10)', border:'1px solid rgba(220,38,38,0.18)', borderRadius:7, cursor:'pointer', color:'#f87171', fontFamily:"'JetBrains Mono',sans-serif", fontSize:12.5, fontWeight:600, transition:'background 0.12s' }}
          onMouseEnter={e => e.currentTarget.style.background='rgba(220,38,38,0.20)'}
          onMouseLeave={e => e.currentTarget.style.background='rgba(220,38,38,0.10)'}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="15" height="15">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
            <polyline points="16 17 21 12 16 7"/>
            <line x1="21" y1="12" x2="9" y2="12"/>
          </svg>
          Cerrar sesión
        </button>
      </div>
    </aside>
  )
}

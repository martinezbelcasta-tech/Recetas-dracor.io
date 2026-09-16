import { Component } from 'react'

// Red de seguridad: si CUALQUIER página lanza al renderizar, muestra esto en vez
// de dejar la app en blanco. React exige clase para error boundaries (aún sin hook).
export default class ErrorBoundary extends Component {
  state = { error: null }

  static getDerivedStateFromError(error) {
    return { error }
  }

  componentDidCatch(error, info) {
    console.error('ErrorBoundary:', error, info)
  }

  render() {
    if (!this.state.error) return this.props.children
    return (
      <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', padding: 24, background: '#f0f4fb' }}>
        <div style={{ maxWidth: 460, background: '#fff', border: '1px solid #e2e8f0', borderRadius: 16, padding: '32px 28px', boxShadow: '0 4px 32px rgba(13,30,53,0.12)', textAlign: 'center' }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>⚠️</div>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: '#1e293b', marginBottom: 8 }}>Algo salió mal en esta pantalla</h2>
          <p style={{ fontSize: 13.5, color: '#64748b', lineHeight: 1.6, marginBottom: 20 }}>
            El resto de tus datos está a salvo. Recarga para volver a la app.
          </p>
          <pre style={{ fontSize: 11, color: '#94a3b8', background: '#f8fafc', border: '1px solid #eef2f7', borderRadius: 8, padding: '8px 10px', textAlign: 'left', overflowX: 'auto', marginBottom: 20, whiteSpace: 'pre-wrap' }}>
            {String(this.state.error?.message || this.state.error)}
          </pre>
          <button onClick={() => window.location.reload()}
            style={{ background: '#2563eb', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 20px', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
            Recargar
          </button>
        </div>
      </div>
    )
  }
}

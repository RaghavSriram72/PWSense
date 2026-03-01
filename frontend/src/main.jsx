import React from 'react'
import ReactDOM from 'react-dom/client'
import './index.css'

function showError(title, message) {
  const root = document.getElementById('root')
  if (root) {
    root.innerHTML =
      '<div style="padding:24px;font-family:sans-serif;max-width:600px;">' +
      '<h1 style="color:#b91c1c">' +
      title +
      '</h1><pre style="background:#fef2f2;padding:16px;overflow:auto;font-size:12px">' +
      message +
      '</pre></div>'
  }
}

function runApp(App) {
  class ErrorBoundary extends React.Component {
    state = { hasError: false, error: null }
    static getDerivedStateFromError(error) {
      return { hasError: true, error }
    }
    componentDidCatch(error, info) {
      console.error('App error:', error, info)
    }
    render() {
      if (this.state.hasError) {
        return (
          <div style={{ padding: 24, fontFamily: 'sans-serif', maxWidth: 600 }}>
            <h1 style={{ color: '#b91c1c' }}>Something went wrong</h1>
            <pre style={{ background: '#fef2f2', padding: 16, overflow: 'auto' }}>
              {this.state.error?.message || String(this.state.error)}
            </pre>
            <p>Check the browser console for details.</p>
          </div>
        )
      }
      return this.props.children
    }
  }

  const root = document.getElementById('root')
  if (!root) {
    document.body.innerHTML = '<p>Root element not found.</p>'
    return
  }
  ReactDOM.createRoot(root).render(
    <React.StrictMode>
      <ErrorBoundary>
        <App />
      </ErrorBoundary>
    </React.StrictMode>
  )
}

import('./App.jsx')
  .then((m) => runApp(m.default))
  .catch((err) => {
    console.error('Load error:', err)
    showError('Load error', (err && err.message) || String(err))
  })

import React from 'react'

// Root-level boundary: full screen error panel
export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { error: null }
  }

  static getDerivedStateFromError(error) {
    return { error }
  }

  componentDidCatch(error, info) {
    console.error('React error boundary caught:', error, info)
  }

  render() {
    if (this.state.error) {
      return (
        <div className="min-h-screen flex items-center justify-center p-8 bg-slate-900">
          <div className="max-w-lg w-full bg-red-900/30 border border-red-500 rounded-xl p-6">
            <h1 className="text-xl font-bold text-red-400 mb-2">Application Error</h1>
            <p className="text-slate-300 text-sm font-mono whitespace-pre-wrap">
              {this.state.error.message}
            </p>
            <button
              className="mt-4 btn-ghost text-sm"
              onClick={() => { this.setState({ error: null }); window.location.reload() }}
            >
              Reload
            </button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}

// Route-level boundary: inline error that doesn't take down other routes
export class RouteErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { error: null }
  }

  static getDerivedStateFromError(error) {
    return { error }
  }

  componentDidCatch(error, info) {
    console.error('Route error boundary caught:', error, info)
  }

  render() {
    if (this.state.error) {
      return (
        <div className="flex items-center justify-center p-8">
          <div className="max-w-md w-full bg-red-900/20 border border-red-500/50 rounded-xl p-6 text-center">
            <h2 className="text-lg font-bold text-red-400 mb-2">Page Error</h2>
            <p className="text-slate-400 text-sm mb-4">{this.state.error.message}</p>
            <button
              className="btn-ghost text-sm"
              onClick={() => this.setState({ error: null })}
            >
              Try again
            </button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}

// Card-level boundary: tiny inline fallback so one bad card can't break the board
export class CardErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { error: null }
  }

  static getDerivedStateFromError(error) {
    return { error }
  }

  componentDidCatch(error, info) {
    console.error('Card error boundary caught:', error, info)
  }

  render() {
    if (this.state.error) {
      return (
        <div className="rounded-xl border border-red-500/40 bg-red-900/10 p-4 text-center">
          <p className="text-red-400 text-xs font-mono">Card render error</p>
          <button
            className="mt-2 text-xs text-slate-500 hover:text-slate-300"
            onClick={() => this.setState({ error: null })}
          >
            Retry
          </button>
        </div>
      )
    }
    return this.props.children
  }
}

import React from 'react'
import ReactDOM from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import App from './App'
import ErrorBoundary from './components/ErrorBoundary'
import Toast from './components/Toast'
import './index.css'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 30_000,
      // surface errors as query state, not exceptions
      throwOnError: false,
    },
    mutations: {
      // let call sites handle errors
      throwOnError: false,
    },
  },
})

ReactDOM.createRoot(document.getElementById('root')).render(
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <App />
      {/* global toast portal */}
      <Toast />
    </QueryClientProvider>
  </ErrorBoundary>
)

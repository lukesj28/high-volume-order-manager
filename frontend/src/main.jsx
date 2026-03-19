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
      // Never let a failed query throw uncaught — surface as query state instead
      throwOnError: false,
    },
    mutations: {
      // Mutations: don't throw globally, let each call site handle errors
      throwOnError: false,
    },
  },
})

ReactDOM.createRoot(document.getElementById('root')).render(
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <App />
      {/* Global toast portal — available on login/station-select before Layout mounts */}
      <Toast />
    </QueryClientProvider>
  </ErrorBoundary>
)

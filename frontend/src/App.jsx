import React from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from './store/authStore'
import { RouteErrorBoundary } from './components/ErrorBoundary'
import Login from './pages/Login'
import StationSelect from './pages/StationSelect'
import POS from './pages/POS'
import Admin from './pages/Admin'
import Layout from './components/Layout'

function RequireAuth({ children }) {
  const token = useAuthStore(s => s.token)
  if (!token) return <Navigate to="/login" replace />
  return children
}

function RequireStation({ children }) {
  const stationProfile = useAuthStore(s => s.stationProfile)
  const token = useAuthStore(s => s.token)
  if (!token) return <Navigate to="/login" replace />
  if (!stationProfile) return <Navigate to="/select-station" replace />
  return children
}

function RequireAdmin({ children }) {
  const user = useAuthStore(s => s.user)
  const token = useAuthStore(s => s.token)
  if (!token) return <Navigate to="/login" replace />
  if (user?.role !== 'ADMIN') return <Navigate to="/pos" replace />
  return children
}

function DefaultRedirect() {
  const stationProfile = useAuthStore(s => s.stationProfile)
  const token = useAuthStore(s => s.token)
  if (!token) return <Navigate to="/login" replace />
  if (!stationProfile) return <Navigate to="/select-station" replace />
  return <Navigate to="/pos" replace />
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={
          <RouteErrorBoundary><Login /></RouteErrorBoundary>
        } />
        <Route path="/select-station" element={
          <RequireAuth><RouteErrorBoundary><StationSelect /></RouteErrorBoundary></RequireAuth>
        } />
        <Route element={<RequireStation><Layout /></RequireStation>}>
          <Route path="/" element={<DefaultRedirect />} />
          <Route path="/pos" element={
            <RouteErrorBoundary><POS /></RouteErrorBoundary>
          } />
          <Route path="/board" element={<Navigate to="/pos" replace />} />
          <Route path="/analytics" element={<Navigate to="/admin" replace />} />
          <Route path="/admin" element={
            <RequireAdmin><RouteErrorBoundary><Admin /></RouteErrorBoundary></RequireAdmin>
          } />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

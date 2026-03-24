import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import { login } from '../api/auth'

export default function Login() {
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const setInitialAuth = useAuthStore(s => s.setInitialAuth)
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const data = await login(password)
      setInitialAuth(data.token, { role: data.role, username: data.username }, data.stationProfiles)
      navigate('/select-station')
    } catch (err) {
      setError(err.response?.data?.error ?? 'Invalid password')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <form onSubmit={handleSubmit}>
        <input
          className="input"
          type="password"
          autoFocus
          autoComplete="current-password"
          placeholder={loading ? 'Signing in…' : 'Password'}
          value={password}
          onChange={e => setPassword(e.target.value)}
          disabled={loading}
          maxLength={128}
          required
        />
        {error && <p className="text-red-400 text-sm mt-2">{error}</p>}
      </form>
    </div>
  )
}

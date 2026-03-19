import React, { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { changeStaffPassword } from '../api/admin'

export default function UserManager() {
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [success, setSuccess] = useState(false)

  const mutation = useMutation({
    mutationFn: () => changeStaffPassword(password),
    onSuccess: () => {
      setSuccess(true)
      setPassword('')
      setConfirm('')
      setTimeout(() => setSuccess(false), 3000)
    }
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    if (password !== confirm) return alert('Passwords do not match')
    if (password.length < 6) return alert('Password must be at least 6 characters')
    mutation.mutate()
  }

  return (
    <div className="max-w-md space-y-4">
      <h2 className="text-lg font-bold text-white">Change Staff Password</h2>
      <p className="text-sm text-slate-400">
        All 5 POS terminals share a single staff account. Change the password here and update all devices.
      </p>

      <form onSubmit={handleSubmit} className="card space-y-4">
        <div>
          <label className="label">New Password</label>
          <input
            type="password"
            className="input"
            value={password}
            onChange={e => setPassword(e.target.value)}
            minLength={6}
            required
          />
        </div>
        <div>
          <label className="label">Confirm Password</label>
          <input
            type="password"
            className="input"
            value={confirm}
            onChange={e => setConfirm(e.target.value)}
            required
          />
        </div>
        {mutation.isError && (
          <p className="text-red-400 text-sm">{mutation.error?.response?.data?.error ?? 'Failed'}</p>
        )}
        {success && <p className="text-green-400 text-sm">Password updated successfully</p>}
        <button type="submit" className="btn-primary w-full" disabled={mutation.isPending}>
          {mutation.isPending ? 'Updating…' : 'Update Password'}
        </button>
      </form>
    </div>
  )
}

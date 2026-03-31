import React, { useState, useEffect, useRef } from 'react'
import { useMutation } from '@tanstack/react-query'
import { changeStaffPassword, changeAdminPassword } from '../api/admin'

function usePasswordForm(mutationFn) {
  const [current, setCurrent] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [success, setSuccess] = useState(false)
  const timerRef = useRef(null)

  useEffect(() => () => clearTimeout(timerRef.current), [])

  const mutation = useMutation({
    mutationFn: () => mutationFn(current, password),
    onSuccess: () => {
      setSuccess(true)
      setCurrent('')
      setPassword('')
      setConfirm('')
      clearTimeout(timerRef.current)
      timerRef.current = setTimeout(() => setSuccess(false), 3000)
    }
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    if (password !== confirm) return alert('Passwords do not match')
    if (password.length < 6) return alert('Password must be at least 6 characters')
    mutation.mutate()
  }

  return { current, setCurrent, password, setPassword, confirm, setConfirm, success, mutation, handleSubmit }
}

export default function UserManager() {
  const staff = usePasswordForm((_, pw) => changeStaffPassword(pw))
  const admin = usePasswordForm((cur, pw) => changeAdminPassword(cur, pw))

  return (
    <div className="max-w-md space-y-8">
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-white">Change Staff Password</h2>

        <form onSubmit={staff.handleSubmit} className="card space-y-4">
          <div>
            <label className="label">New Password</label>
            <input
              type="password"
              className="input"
              value={staff.password}
              onChange={e => staff.setPassword(e.target.value)}
              minLength={6}
              required
            />
          </div>
          <div>
            <label className="label">Confirm Password</label>
            <input
              type="password"
              className="input"
              value={staff.confirm}
              onChange={e => staff.setConfirm(e.target.value)}
              required
            />
          </div>
          {staff.mutation.isError && (
            <p className="text-red-400 text-sm">{staff.mutation.error?.response?.data?.error ?? 'Failed'}</p>
          )}
          {staff.success && <p className="text-green-400 text-sm">Password updated successfully</p>}
          <button type="submit" className="btn-primary w-full" disabled={staff.mutation.isPending}>
            {staff.mutation.isPending ? 'Updating…' : 'Update Password'}
          </button>
        </form>
      </div>

      <div className="space-y-4">
        <h2 className="text-lg font-bold text-white">Change Admin Password</h2>

        <form onSubmit={admin.handleSubmit} className="card space-y-4">
          <div>
            <label className="label">Current Password</label>
            <input
              type="password"
              className="input"
              value={admin.current}
              onChange={e => admin.setCurrent(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="label">New Password</label>
            <input
              type="password"
              className="input"
              value={admin.password}
              onChange={e => admin.setPassword(e.target.value)}
              minLength={6}
              required
            />
          </div>
          <div>
            <label className="label">Confirm Password</label>
            <input
              type="password"
              className="input"
              value={admin.confirm}
              onChange={e => admin.setConfirm(e.target.value)}
              required
            />
          </div>
          {admin.mutation.isError && (
            <p className="text-red-400 text-sm">{admin.mutation.error?.response?.data?.error ?? 'Failed'}</p>
          )}
          {admin.success && <p className="text-green-400 text-sm">Password updated successfully</p>}
          <button type="submit" className="btn-primary w-full" disabled={admin.mutation.isPending}>
            {admin.mutation.isPending ? 'Updating…' : 'Update Password'}
          </button>
        </form>
      </div>
    </div>
  )
}

import React from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation } from '@tanstack/react-query'
import { useAuthStore } from '../store/authStore'
import { getStationProfiles, selectStation } from '../api/auth'

export default function StationSelect() {
  const user = useAuthStore(s => s.user)
  const setStationAuth = useAuthStore(s => s.setStationAuth)
  const navigate = useNavigate()

  // Always fetch fresh profiles so displayConfig changes take effect without re-login
  const { data: profiles = [], isLoading, error } = useQuery({
    queryKey: ['station-profiles'],
    queryFn: getStationProfiles,
  })

  const mutation = useMutation({
    mutationFn: (profile) => selectStation(profile.id).then(data => ({ data, profile })),
    onSuccess: ({ data, profile }) => {
      setStationAuth(data.token, profile)
      navigate('/pos')
    }
  })

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-black text-white mb-1">Select Station</h1>
          <p className="text-slate-400">Welcome, {user?.username}</p>
        </div>

        {isLoading && <p className="text-slate-500 text-center">Loading stations…</p>}
        {error && <p className="text-red-400 text-sm text-center mb-4">Failed to load stations</p>}
        {mutation.isError && (
          <p className="text-red-400 text-sm text-center mb-4">
            {mutation.error?.response?.data?.error ?? 'Failed to select station'}
          </p>
        )}

        <div className="grid gap-3">
          {profiles.length === 0 && !isLoading && (
            <p className="text-slate-500 text-center">No station profiles available.</p>
          )}
          {profiles.map(profile => (
            <button
              key={profile.id}
              className="card text-left hover:border-blue-500 transition-colors cursor-pointer group disabled:opacity-50"
              onClick={() => mutation.mutate(profile)}
              disabled={mutation.isPending}
            >
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold text-white group-hover:text-blue-300">
                    {profile.name}
                  </h2>
                  <div className="flex gap-2 mt-1 flex-wrap">
                    {profile.canSubmit && (
                      <span className="text-xs bg-green-500/20 text-green-400 px-2 py-0.5 rounded">Submit Orders</span>
                    )}
                    {profile.canSetInProgress && (
                      <span className="text-xs bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded">Mark In Progress</span>
                    )}
                    {profile.canSetCompleted && (
                      <span className="text-xs bg-purple-500/20 text-purple-400 px-2 py-0.5 rounded">Mark Complete</span>
                    )}
                  </div>
                </div>
                <span className="text-slate-500 group-hover:text-blue-400 text-2xl">→</span>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

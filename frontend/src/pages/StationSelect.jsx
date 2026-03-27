import React from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation } from '@tanstack/react-query'
import { useAuthStore } from '../store/authStore'
import { getStationProfiles, selectStation } from '../api/auth'

export default function StationSelect() {
  const user = useAuthStore(s => s.user)
  const setStationAuth = useAuthStore(s => s.setStationAuth)
  const clearAuth = useAuthStore(s => s.clearAuth)
  const navigate = useNavigate()

  // always refetch so displayConfig changes take effect without re-login
  const { data: profiles = [], isLoading, error } = useQuery({
    queryKey: ['station-profiles'],
    queryFn: getStationProfiles,
  })

  const mutation = useMutation({
    mutationFn: (profile) => selectStation(profile.id).then(data => ({ data, profile })),
    onSuccess: ({ data, profile }) => {
      setStationAuth(data.token, profile)
      navigate('/pos')
    },
    onError: () => {
      clearAuth()
      navigate('/login')
    }
  })

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-black text-white mb-1 tracking-wide">Select Station</h1>
          <p className="text-zinc-400 text-sm font-medium tracking-wide">Auth: {user?.username}</p>
        </div>

        {isLoading && <p className="text-zinc-400 text-sm font-medium tracking-wide text-center">Loading stations…</p>}
        {error && <p className="text-red-400 text-sm font-medium tracking-wide text-center mb-4">Failed to load stations</p>}
        {mutation.isError && (
          <p className="text-red-400 text-sm font-medium tracking-wide text-center mb-4">
            {mutation.error?.response?.data?.error ?? 'Failed to select station'}
          </p>
        )}

        <div className="grid gap-3">
          {profiles.length === 0 && !isLoading && (
            <p className="text-zinc-400 text-sm font-medium tracking-wide text-center">No station profiles available.</p>
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
                  <h2 className="text-base font-bold text-white group-hover:text-blue-400 tracking-wide mb-2 transition-colors">
                    {profile.name}
                  </h2>
                  <div className="flex gap-2 flex-wrap">
                    {profile.canSubmit && (
                      <span className="text-[10px] uppercase tracking-wider font-semibold border border-green-500/30 bg-green-500/10 text-green-400 px-2 py-0.5 rounded-lg">Submit Orders</span>
                    )}
                    {profile.canSetInProgress && (
                      <span className="text-[10px] uppercase tracking-wider font-semibold border border-blue-500/30 bg-blue-500/10 text-blue-400 px-2 py-0.5 rounded-lg">In Progress</span>
                    )}
                    {profile.canSetCompleted && (
                      <span className="text-[10px] uppercase tracking-wider font-semibold border border-zinc-500/30 bg-zinc-500/10 text-zinc-400 px-2 py-0.5 rounded-lg">Complete</span>
                    )}
                  </div>
                </div>
                <span className="text-zinc-500 group-hover:text-blue-500 text-2xl transition-colors">→</span>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

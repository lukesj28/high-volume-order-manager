import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export const useAuthStore = create(
  persist(
    (set, get) => ({
      token: null,
      user: null,
      stationProfile: null,
      stationProfiles: [],

      setInitialAuth: (token, user, stationProfiles) => set({ token, user, stationProfile: null, stationProfiles: stationProfiles ?? [] }),

      setStationAuth: (token, stationProfile) =>
        set(state => ({
          token,
          stationProfile,
          // keep profiles fresh for station re-select
          stationProfiles: state.stationProfiles.map(p =>
            p.id === stationProfile.id ? stationProfile : p
          )
        })),

      clearAuth: () => set({ token: null, user: null, stationProfile: null }),

      isAdmin: () => get().user?.role === 'ADMIN',
      canSubmit: () => get().stationProfile?.canSubmit ?? false,
      canSetInProgress: () => get().stationProfile?.canSetInProgress ?? false,
      canSetCompleted: () => get().stationProfile?.canSetCompleted ?? false,
      canSkipToCompleted: () => get().stationProfile?.canSkipToCompleted ?? false,
    }),
    { name: 'pos-auth', partialize: state => ({ token: state.token, user: state.user, stationProfile: state.stationProfile, stationProfiles: state.stationProfiles }) }
  )
)

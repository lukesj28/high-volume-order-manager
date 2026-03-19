export const canTransition = (currentStatus, targetStatus, stationProfile) => {
  if (!stationProfile) return false
  if (targetStatus === 'IN_PROGRESS') {
    return currentStatus === 'PENDING' && stationProfile.canSetInProgress
  }
  if (targetStatus === 'COMPLETED') {
    if (!stationProfile.canSetCompleted) return false
    if (currentStatus === 'PENDING') return stationProfile.canSkipToCompleted
    return currentStatus === 'IN_PROGRESS'
  }
  return false
}

export const requiresConfirmation = (currentStatus, targetStatus, stationProfile) => {
  return targetStatus === 'COMPLETED' &&
         currentStatus === 'PENDING' &&
         stationProfile?.canSkipToCompleted
}

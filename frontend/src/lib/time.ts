export const SECONDS_PER_DAY = 86_400n

export type DepositTiming = {
  graceEndsAt: bigint
  canEarlyWithdraw: boolean
  canWithdrawAtMaturity: boolean
  canManualRenew: boolean
  canAutoRenew: boolean
}

export function getGraceEndsAt(
  maturityAt: bigint,
  gracePeriodSeconds: bigint,
): bigint {
  return maturityAt + gracePeriodSeconds
}

export function getDepositTiming(
  maturityAt: bigint,
  currentBlockTimestamp: bigint,
  gracePeriodSeconds: bigint,
): DepositTiming {
  const graceEndsAt = getGraceEndsAt(
    maturityAt,
    gracePeriodSeconds,
  )

  return {
    graceEndsAt,
    canEarlyWithdraw:
      currentBlockTimestamp < maturityAt,
    canWithdrawAtMaturity:
      currentBlockTimestamp >= maturityAt,
    canManualRenew:
      currentBlockTimestamp >= maturityAt &&
      currentBlockTimestamp < graceEndsAt,
    canAutoRenew:
      currentBlockTimestamp >= graceEndsAt,
  }
}

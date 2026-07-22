export const BPS_DENOMINATOR = 10_000n
export const DAYS_PER_YEAR = 365n

export function calculateSimpleInterest(
  principal: bigint,
  aprBps: bigint,
  tenorDays: bigint,
): bigint {
  if (principal < 0n || aprBps < 0n || tenorDays < 0n) {
    throw new Error('Financial inputs must not be negative.')
  }

  return (
    principal *
    aprBps *
    tenorDays /
    (DAYS_PER_YEAR * BPS_DENOMINATOR)
  )
}

export function calculateEarlyWithdrawalPenalty(
  principal: bigint,
  penaltyBps: bigint,
): bigint {
  if (principal < 0n || penaltyBps < 0n) {
    throw new Error('Financial inputs must not be negative.')
  }

  return principal * penaltyBps / BPS_DENOMINATOR
}

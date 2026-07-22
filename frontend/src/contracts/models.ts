export type SavingPlan = {
  planId: bigint
  tenorDays: bigint
  aprBps: bigint
  minDeposit: bigint
  maxDeposit: bigint
  earlyWithdrawPenaltyBps: bigint
  enabled: boolean
}

export type DepositRecord = {
  depositId: bigint
  planId: bigint
  principal: bigint
  startedAt: bigint
  maturityAt: bigint
  tenorDays: bigint
  aprBpsAtOpen: bigint
  penaltyBpsAtOpen: bigint
  status: bigint
}

export type VaultMetrics = {
  vaultBalance: bigint
  totalReservedInterest: bigint
  availableLiquidity: bigint
  fundingShortfall: bigint
}

export type TokenAccountState = {
  balance: bigint
  allowance: bigint
}

export type PendingInterestState = {
  depositId: bigint
  amount: bigint
  claimant: string
}

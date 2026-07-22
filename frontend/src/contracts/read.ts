import type {
  SavingPlan,
  TokenAccountState,
  VaultMetrics,
} from './models'
import { decodeSavingPlan } from './decode'

type SavingCoreReadContract = {
  planCount: () => Promise<unknown>
  getPlan: (
    planId: bigint,
  ) => Promise<unknown>
  depositCount: () => Promise<unknown>
  paused: () => Promise<unknown>
  totalReservedInterest:
    () => Promise<unknown>
  GRACE_PERIOD: () => Promise<unknown>
  BPS_DENOMINATOR: () => Promise<unknown>
}

type VaultManagerReadContract = {
  paused: () => Promise<unknown>
  vaultBalance: () => Promise<unknown>
  totalReservedInterest:
    () => Promise<unknown>
  availableLiquidity:
    () => Promise<unknown>
  fundingShortfall:
    () => Promise<unknown>
}

type MockUsdcReadContract = {
  balanceOf: (
    account: string,
  ) => Promise<unknown>
  allowance: (
    owner: string,
    spender: string,
  ) => Promise<unknown>
}

type BlockLike = {
  timestamp: number
}

type BlockProvider = {
  getBlock: (
    blockTag: 'latest',
  ) => Promise<BlockLike | null>
}

export type ProtocolStatus = {
  planCount: bigint
  depositCount: bigint
  savingCorePaused: boolean
  vaultManagerPaused: boolean
  totalReservedInterest: bigint
  gracePeriodSeconds: bigint
  bpsDenominator: bigint
  latestBlockTimestamp: bigint
}

function requireUnsignedBigInt(
  value: unknown,
  fieldName: string,
): bigint {
  let normalizedValue: bigint

  if (typeof value === 'bigint') {
    normalizedValue = value
  } else if (
    typeof value === 'number' &&
    Number.isSafeInteger(value)
  ) {
    normalizedValue = BigInt(value)
  } else if (
    typeof value === 'string' &&
    /^\d+$/.test(value)
  ) {
    normalizedValue = BigInt(value)
  } else {
    throw new Error(
      `${fieldName} must be an unsigned integer.`,
    )
  }

  if (normalizedValue < 0n) {
    throw new Error(
      `${fieldName} must be an unsigned integer.`,
    )
  }

  return normalizedValue
}

function requireBoolean(
  value: unknown,
  fieldName: string,
): boolean {
  if (typeof value !== 'boolean') {
    throw new Error(
      `${fieldName} must be a boolean.`,
    )
  }

  return value
}

export async function readSavingPlans(
  savingCore: unknown,
): Promise<SavingPlan[]> {
  const contract =
    savingCore as SavingCoreReadContract

  const planCount = requireUnsignedBigInt(
    await contract.planCount(),
    'planCount',
  )

  const plans: SavingPlan[] = []

  for (
    let planId = 1n;
    planId <= planCount;
    planId += 1n
  ) {
    const rawPlan =
      await contract.getPlan(planId)

    plans.push(
      decodeSavingPlan(planId, rawPlan),
    )
  }

  return plans
}

export async function readVaultMetrics(
  vaultManager: unknown,
): Promise<VaultMetrics> {
  const contract =
    vaultManager as VaultManagerReadContract

  const [
    vaultBalance,
    totalReservedInterest,
    availableLiquidity,
    fundingShortfall,
  ] = await Promise.all([
    contract.vaultBalance(),
    contract.totalReservedInterest(),
    contract.availableLiquidity(),
    contract.fundingShortfall(),
  ])

  return {
    vaultBalance: requireUnsignedBigInt(
      vaultBalance,
      'vaultBalance',
    ),
    totalReservedInterest:
      requireUnsignedBigInt(
        totalReservedInterest,
        'totalReservedInterest',
      ),
    availableLiquidity:
      requireUnsignedBigInt(
        availableLiquidity,
        'availableLiquidity',
      ),
    fundingShortfall:
      requireUnsignedBigInt(
        fundingShortfall,
        'fundingShortfall',
      ),
  }
}

export async function readTokenAccountState(
  mockUsdc: unknown,
  account: string,
  savingCoreAddress: string,
): Promise<TokenAccountState> {
  const contract =
    mockUsdc as MockUsdcReadContract

  const [balance, allowance] =
    await Promise.all([
      contract.balanceOf(account),
      contract.allowance(
        account,
        savingCoreAddress,
      ),
    ])

  return {
    balance: requireUnsignedBigInt(
      balance,
      'tokenBalance',
    ),
    allowance: requireUnsignedBigInt(
      allowance,
      'tokenAllowance',
    ),
  }
}

export async function readLatestBlockTimestamp(
  provider: unknown,
): Promise<bigint> {
  const blockProvider =
    provider as BlockProvider

  const latestBlock =
    await blockProvider.getBlock('latest')

  if (!latestBlock) {
    throw new Error(
      'The latest Sepolia block could not be loaded.',
    )
  }

  return requireUnsignedBigInt(
    latestBlock.timestamp,
    'latestBlockTimestamp',
  )
}

export async function readProtocolStatus(
  savingCore: unknown,
  vaultManager: unknown,
  provider: unknown,
): Promise<ProtocolStatus> {
  const core =
    savingCore as SavingCoreReadContract

  const vault =
    vaultManager as VaultManagerReadContract

  const [
    planCount,
    depositCount,
    savingCorePaused,
    vaultManagerPaused,
    totalReservedInterest,
    gracePeriodSeconds,
    bpsDenominator,
    latestBlockTimestamp,
  ] = await Promise.all([
    core.planCount(),
    core.depositCount(),
    core.paused(),
    vault.paused(),
    core.totalReservedInterest(),
    core.GRACE_PERIOD(),
    core.BPS_DENOMINATOR(),
    readLatestBlockTimestamp(provider),
  ])

  return {
    planCount: requireUnsignedBigInt(
      planCount,
      'planCount',
    ),
    depositCount: requireUnsignedBigInt(
      depositCount,
      'depositCount',
    ),
    savingCorePaused: requireBoolean(
      savingCorePaused,
      'savingCorePaused',
    ),
    vaultManagerPaused: requireBoolean(
      vaultManagerPaused,
      'vaultManagerPaused',
    ),
    totalReservedInterest:
      requireUnsignedBigInt(
        totalReservedInterest,
        'totalReservedInterest',
      ),
    gracePeriodSeconds:
      requireUnsignedBigInt(
        gracePeriodSeconds,
        'gracePeriodSeconds',
      ),
    bpsDenominator:
      requireUnsignedBigInt(
        bpsDenominator,
        'bpsDenominator',
      ),
    latestBlockTimestamp,
  }
}

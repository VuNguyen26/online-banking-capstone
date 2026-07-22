import {
  Interface,
  getAddress,
  zeroPadValue,
} from 'ethers'

import {
  SAFE_BANK_DEPLOYMENT,
  SAVING_CORE_ABI,
} from './generated/contracts'
import type {
  PendingInterestState,
} from './models'

const DEFAULT_LOG_BLOCK_RANGE = 5_000

const savingCoreInterface =
  new Interface(SAVING_CORE_ABI)

function requireInterestDeferredEvent() {
  const event =
    savingCoreInterface.getEvent(
      'InterestDeferred(uint256,address,uint256)',
    )

  if (!event) {
    throw new Error(
      'SavingCore ABI is missing the InterestDeferred event.',
    )
  }

  return event
}

const interestDeferredEvent =
  requireInterestDeferredEvent()

type LogLike = {
  topics: readonly string[]
  data: string
}

type InterestDeferredFilter = {
  address: string
  fromBlock: number
  toBlock: number
  topics: Array<string | null>
}

type PendingInterestLogProvider = {
  getBlockNumber: () => Promise<number>

  getLogs: (
    filter: InterestDeferredFilter,
  ) => Promise<readonly LogLike[]>
}

type PendingInterestReadContract = {
  pendingInterest: (
    depositId: bigint,
  ) => Promise<unknown>

  interestClaimant: (
    depositId: bigint,
  ) => Promise<string>
}

function requireValidBlockRange(
  blockRange: number,
): void {
  if (
    !Number.isSafeInteger(blockRange) ||
    blockRange <= 0
  ) {
    throw new Error(
      'blockRange must be a positive safe integer.',
    )
  }
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

function decodeDeferredDepositId(
  log: LogLike,
): bigint {
  const parsedLog =
    savingCoreInterface.parseLog({
      topics: [...log.topics],
      data: log.data,
    })

  if (!parsedLog) {
    throw new Error(
      'Unable to decode an InterestDeferred event.',
    )
  }

  const depositId =
    parsedLog.args[0]

  if (
    typeof depositId !== 'bigint' ||
    depositId <= 0n
  ) {
    throw new Error(
      'InterestDeferred contains an invalid deposit ID.',
    )
  }

  return depositId
}

export async function scanDeferredInterestDepositIds(
  provider: unknown,
  claimant: string,
  blockRange = DEFAULT_LOG_BLOCK_RANGE,
): Promise<bigint[]> {
  requireValidBlockRange(blockRange)

  const normalizedClaimant =
    getAddress(claimant)

  const logProvider =
    provider as PendingInterestLogProvider

  const deploymentBlock =
    SAFE_BANK_DEPLOYMENT.contracts
      .SavingCore.deploymentBlockNumber

  const latestBlock =
    await logProvider.getBlockNumber()

  if (latestBlock < deploymentBlock) {
    return []
  }

  const claimantTopic =
    zeroPadValue(
      normalizedClaimant,
      32,
    )

  const depositIds =
    new Map<string, bigint>()

  for (
    let fromBlock = deploymentBlock;
    fromBlock <= latestBlock;
    fromBlock += blockRange
  ) {
    const toBlock = Math.min(
      fromBlock + blockRange - 1,
      latestBlock,
    )

    const logs =
      await logProvider.getLogs({
        address:
          SAFE_BANK_DEPLOYMENT.contracts
            .SavingCore.address,
        fromBlock,
        toBlock,
        topics: [
          interestDeferredEvent.topicHash,
          null,
          claimantTopic,
        ],
      })

    for (const log of logs) {
      const depositId =
        decodeDeferredDepositId(log)

      depositIds.set(
        depositId.toString(),
        depositId,
      )
    }
  }

  return [...depositIds.values()].sort(
    (left, right) => {
      if (left < right) {
        return -1
      }

      if (left > right) {
        return 1
      }

      return 0
    },
  )
}

export async function readPendingInterestClaims(
  provider: unknown,
  savingCore: unknown,
  claimant: string,
  blockRange = DEFAULT_LOG_BLOCK_RANGE,
): Promise<PendingInterestState[]> {
  const normalizedClaimant =
    getAddress(claimant)

  const candidateIds =
    await scanDeferredInterestDepositIds(
      provider,
      normalizedClaimant,
      blockRange,
    )

  const contract =
    savingCore as PendingInterestReadContract

  const claims:
    PendingInterestState[] = []

  for (const depositId of candidateIds) {
    try {
      const [
        rawAmount,
        rawClaimant,
      ] = await Promise.all([
        contract.pendingInterest(
          depositId,
        ),
        contract.interestClaimant(
          depositId,
        ),
      ])

      const amount =
        requireUnsignedBigInt(
          rawAmount,
          'pendingInterest',
        )

      const currentClaimant =
        getAddress(rawClaimant)

      if (
        amount === 0n ||
        currentClaimant !==
          normalizedClaimant
      ) {
        continue
      }

      claims.push({
        depositId,
        amount,
        claimant: currentClaimant,
      })
    } catch {
      continue
    }
  }

  return claims
}

export type PendingInterestClaimsReader =
  typeof readPendingInterestClaims

export async function readWalletPendingInterestClaims(
  provider: unknown,
  savingCore: unknown,
  account: string | null,
  reader: PendingInterestClaimsReader =
    readPendingInterestClaims,
): Promise<PendingInterestState[]> {
  if (account === null) {
    return []
  }

  return reader(
    provider,
    savingCore,
    account,
  )
}

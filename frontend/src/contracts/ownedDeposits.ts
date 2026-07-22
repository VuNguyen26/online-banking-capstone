import {
  Interface,
  getAddress,
  zeroPadValue,
} from 'ethers'

import {
  SAFE_BANK_DEPLOYMENT,
  SAVING_CORE_ABI,
} from './generated/contracts'
import {
  decodeDepositRecord,
} from './decode'
import type {
  DepositRecord,
} from './models'

const DEFAULT_LOG_BLOCK_RANGE = 5_000

const savingCoreInterface =
  new Interface(SAVING_CORE_ABI)

const transferEvent =
  savingCoreInterface.getEvent(
    'Transfer(address,address,uint256)',
  )

if (!transferEvent) {
  throw new Error(
    'SavingCore ABI is missing the ERC-721 Transfer event.',
  )
}

const TRANSFER_TOPIC_HASH =
  transferEvent.topicHash

type LogLike = {
  topics: readonly string[]
  data: string
}

type IncomingTransferFilter = {
  address: string
  fromBlock: number
  toBlock: number
  topics: Array<string | null>
}

type DepositLogProvider = {
  getBlockNumber: () => Promise<number>
  getLogs: (
    filter: IncomingTransferFilter,
  ) => Promise<readonly LogLike[]>
}

type SavingCoreDepositContract = {
  depositCount: () => Promise<unknown>

  ownerOf: (
    depositId: bigint,
  ) => Promise<string>

  getDeposit: (
    depositId: bigint,
  ) => Promise<unknown>
}

async function readSequentialDepositIds(
  contract: SavingCoreDepositContract,
): Promise<bigint[]> {
  const rawDepositCount =
    await contract.depositCount()

  if (
    typeof rawDepositCount !== 'bigint' ||
    rawDepositCount < 0n
  ) {
    throw new Error(
      'depositCount must be a non-negative bigint.',
    )
  }

  const depositIds: bigint[] = []

  for (
    let depositId = 1n;
    depositId <= rawDepositCount;
    depositId += 1n
  ) {
    depositIds.push(depositId)
  }

  return depositIds
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

function decodeTransferredDepositId(
  log: LogLike,
): bigint {
  const parsedLog =
    savingCoreInterface.parseLog({
      topics: [...log.topics],
      data: log.data,
    })

  if (!parsedLog) {
    throw new Error(
      'Unable to decode a SavingCore Transfer event.',
    )
  }

  const depositId =
    parsedLog.args[2]

  if (
    typeof depositId !== 'bigint' ||
    depositId <= 0n
  ) {
    throw new Error(
      'Transfer event contains an invalid deposit ID.',
    )
  }

  return depositId
}

export async function scanIncomingDepositIds(
  provider: unknown,
  account: string,
  blockRange = DEFAULT_LOG_BLOCK_RANGE,
): Promise<bigint[]> {
  requireValidBlockRange(blockRange)

  const normalizedAccount =
    getAddress(account)

  const logProvider =
    provider as DepositLogProvider

  const deploymentBlock =
    SAFE_BANK_DEPLOYMENT.contracts
      .SavingCore.deploymentBlockNumber

  const latestBlock =
    await logProvider.getBlockNumber()

  if (latestBlock < deploymentBlock) {
    return []
  }

  const accountTopic =
    zeroPadValue(normalizedAccount, 32)

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
          TRANSFER_TOPIC_HASH,
          null,
          accountTopic,
        ],
      })

    for (const log of logs) {
      const depositId =
        decodeTransferredDepositId(log)

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

export async function readOwnedDeposits(
  provider: unknown,
  savingCore: unknown,
  account: string,
  blockRange = DEFAULT_LOG_BLOCK_RANGE,
): Promise<DepositRecord[]> {
  const normalizedAccount =
    getAddress(account)

  const contract =
    savingCore as SavingCoreDepositContract

  let candidateIds: bigint[]

  try {
    candidateIds =
      await scanIncomingDepositIds(
        provider,
        normalizedAccount,
        blockRange,
      )
  } catch {
    candidateIds =
      await readSequentialDepositIds(
        contract,
      )
  }

  const ownedDeposits:
    DepositRecord[] = []

  for (const depositId of candidateIds) {
    let currentOwner: string

    try {
      currentOwner =
        getAddress(
          await contract.ownerOf(
            depositId,
          ),
        )
    } catch {
      continue
    }

    if (
      currentOwner !==
      normalizedAccount
    ) {
      continue
    }

    const rawDeposit =
      await contract.getDeposit(
        depositId,
      )

    ownedDeposits.push(
      decodeDepositRecord(
        depositId,
        rawDeposit,
      ),
    )
  }

  return ownedDeposits
}

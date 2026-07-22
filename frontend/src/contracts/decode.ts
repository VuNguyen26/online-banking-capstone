import type {
  DepositRecord,
  SavingPlan,
} from './models'

function isRecord(
  value: unknown,
): value is Record<string, unknown> {
  return (
    typeof value === 'object' &&
    value !== null
  )
}

function readTupleField(
  value: unknown,
  fieldName: string,
  fieldIndex: number,
): unknown {
  if (Array.isArray(value)) {
    if (fieldIndex >= value.length) {
      throw new Error(
        `Missing tuple field ${fieldName}.`,
      )
    }

    return value[fieldIndex]
  }

  if (isRecord(value)) {
    if (fieldName in value) {
      return value[fieldName]
    }

    const indexedField = String(fieldIndex)

    if (indexedField in value) {
      return value[indexedField]
    }
  }

  throw new Error(
    `Missing tuple field ${fieldName}.`,
  )
}

function toUnsignedBigInt(
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

function toBoolean(
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

export function decodeSavingPlan(
  planId: bigint,
  value: unknown,
): SavingPlan {
  return {
    planId,
    tenorDays: toUnsignedBigInt(
      readTupleField(
        value,
        'tenorDays',
        0,
      ),
      'tenorDays',
    ),
    aprBps: toUnsignedBigInt(
      readTupleField(
        value,
        'aprBps',
        1,
      ),
      'aprBps',
    ),
    minDeposit: toUnsignedBigInt(
      readTupleField(
        value,
        'minDeposit',
        2,
      ),
      'minDeposit',
    ),
    maxDeposit: toUnsignedBigInt(
      readTupleField(
        value,
        'maxDeposit',
        3,
      ),
      'maxDeposit',
    ),
    earlyWithdrawPenaltyBps:
      toUnsignedBigInt(
        readTupleField(
          value,
          'earlyWithdrawPenaltyBps',
          4,
        ),
        'earlyWithdrawPenaltyBps',
      ),
    enabled: toBoolean(
      readTupleField(
        value,
        'enabled',
        5,
      ),
      'enabled',
    ),
  }
}

export function decodeDepositRecord(
  depositId: bigint,
  value: unknown,
): DepositRecord {
  return {
    depositId,
    planId: toUnsignedBigInt(
      readTupleField(
        value,
        'planId',
        0,
      ),
      'planId',
    ),
    principal: toUnsignedBigInt(
      readTupleField(
        value,
        'principal',
        1,
      ),
      'principal',
    ),
    startedAt: toUnsignedBigInt(
      readTupleField(
        value,
        'startedAt',
        2,
      ),
      'startedAt',
    ),
    maturityAt: toUnsignedBigInt(
      readTupleField(
        value,
        'maturityAt',
        3,
      ),
      'maturityAt',
    ),
    tenorDays: toUnsignedBigInt(
      readTupleField(
        value,
        'tenorDays',
        4,
      ),
      'tenorDays',
    ),
    aprBpsAtOpen: toUnsignedBigInt(
      readTupleField(
        value,
        'aprBpsAtOpen',
        5,
      ),
      'aprBpsAtOpen',
    ),
    penaltyBpsAtOpen:
      toUnsignedBigInt(
        readTupleField(
          value,
          'penaltyBpsAtOpen',
          6,
        ),
        'penaltyBpsAtOpen',
      ),
    status: toUnsignedBigInt(
      readTupleField(
        value,
        'status',
        7,
      ),
      'status',
    ),
  }
}

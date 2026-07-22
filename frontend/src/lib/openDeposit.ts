import type {
  SavingPlan,
  TokenAccountState,
} from '../contracts/models'
import {
  calculateSimpleInterest,
} from './finance'
import {
  parseMusdcAmount,
} from './units'

export type OpenDepositErrorCode =
  | 'plan-required'
  | 'plan-disabled'
  | 'invalid-amount'
  | 'amount-not-positive'
  | 'below-minimum'
  | 'above-maximum'
  | 'insufficient-balance'

export type OpenDepositValidation = {
  amount: bigint | null
  estimatedInterest: bigint | null
  needsApproval: boolean
  error: OpenDepositErrorCode | null
}

export type ValidateOpenDepositArguments = {
  amountInput: string
  plan: SavingPlan | null
  tokenAccountState: TokenAccountState | null
}

export function validateOpenDeposit({
  amountInput,
  plan,
  tokenAccountState,
}: ValidateOpenDepositArguments): OpenDepositValidation {
  if (!plan) {
    return {
      amount: null,
      estimatedInterest: null,
      needsApproval: false,
      error: 'plan-required',
    }
  }

  if (!plan.enabled) {
    return {
      amount: null,
      estimatedInterest: null,
      needsApproval: false,
      error: 'plan-disabled',
    }
  }

  let amount: bigint

  try {
    amount = parseMusdcAmount(
      amountInput,
    )
  } catch {
    return {
      amount: null,
      estimatedInterest: null,
      needsApproval: false,
      error:
        'invalid-amount',
    }
  }

  if (amount <= 0n) {
    return {
      amount,
      estimatedInterest: null,
      needsApproval: false,
      error:
        'amount-not-positive',
    }
  }

  if (amount < plan.minDeposit) {
    return {
      amount,
      estimatedInterest: null,
      needsApproval: false,
      error:
        'below-minimum',
    }
  }

  if (amount > plan.maxDeposit) {
    return {
      amount,
      estimatedInterest: null,
      needsApproval: false,
      error:
        'above-maximum',
    }
  }

  if (
    tokenAccountState &&
    amount > tokenAccountState.balance
  ) {
    return {
      amount,
      estimatedInterest: null,
      needsApproval: false,
      error:
        'insufficient-balance',
    }
  }

  return {
    amount,
    estimatedInterest:
      calculateSimpleInterest(
        amount,
        plan.aprBps,
        plan.tenorDays,
      ),
    needsApproval:
      tokenAccountState !== null &&
      tokenAccountState.allowance < amount,
    error: null,
  }
}
